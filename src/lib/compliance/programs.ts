/**
 * Program classification and the approvals register (expansion brief §6).
 *
 * - Every course has a program type. "State-approved program" and "continuing
 *   education" can be claimed only while a real approval is recorded here (the
 *   database refuses otherwise; see courses_classification_guard).
 * - Approvals are entered by the platform administrator from the approving body's own
 *   record, with a source link and a verification date. Nothing here is inferred.
 * - When an approval is withdrawn or expires, the course falls back to
 *   "supports state-regulated training" automatically.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { courseCategories, courses, programApprovals } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { ServiceResult } from "@/lib/tenancy/service";

export const APPROVAL_KIND_LABEL: Record<string, string> = {
  STATE_PROGRAM_APPROVAL: "State program approval",
  CE_PROVIDER_APPROVAL: "Continuing education provider approval",
  CURRICULUM_APPROVAL: "Curriculum approval (for example DOEA dementia curriculum)",
  ACCREDITATION: "Accreditation",
  PARTNER_AUTHORIZATION: "Authorized partner (for example a certified MHFA instructor organization)",
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker");

export const approvalSchema = z
  .object({
    courseId: z.string().uuid(),
    kind: z.enum(["STATE_PROGRAM_APPROVAL", "CE_PROVIDER_APPROVAL", "CURRICULUM_APPROVAL", "ACCREDITATION", "PARTNER_AUTHORIZATION"]),
    approvingBody: z.string().trim().min(3, "Name the approving body").max(200),
    approvalNumber: z.string().trim().min(1, "Enter the approval or provider number").max(100),
    scope: z.string().trim().max(500).optional().or(z.literal("")),
    effectiveOn: isoDate,
    expiresOn: z.union([z.literal(""), isoDate]).optional(),
    sourceUrl: z.string().trim().url("Enter the link to the approving body's record").refine((u) => u.startsWith("https://"), "Use an https link"),
    verifiedOn: isoDate,
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((v) => !v.expiresOn || v.expiresOn >= v.effectiveOn, { message: "Expiration must be after the effective date", path: ["expiresOn"] });

export const classificationSchema = z.object({
  courseId: z.string().uuid(),
  programClassification: z.enum(["GENERAL_EDUCATION", "EMPLOYER_REQUIRED", "STATE_REGULATED_TRAINING", "STATE_APPROVED_PROGRAM", "CONTINUING_EDUCATION", "PROFESSION_SPECIFIC"]),
  certificateType: z.enum(["COURSE_COMPLETION", "PROFESSIONAL_DEVELOPMENT", "SPECIALIZED_TRAINING", "CONTINUING_EDUCATION"]),
  reason: z.string().trim().min(5, "Explain the change").max(500),
});

export async function listPrograms(sys: Db) {
  const rows = await sys
    .select({
      id: courses.id,
      code: courses.code,
      title: courses.title,
      status: courses.status,
      programClassification: courses.programClassification,
      certificateType: courses.certificateType,
      category: courseCategories.name,
      activeApprovals: sql<number>`(select count(*)::int from program_approvals a where a.course_id = ${courses.id} and a.status = 'ACTIVE' and a.effective_on <= current_date and (a.expires_on is null or a.expires_on >= current_date))`,
    })
    .from(courses)
    .innerJoin(courseCategories, eq(courseCategories.id, courses.categoryId))
    .where(sql`${courses.tenantId} is null`)
    .orderBy(asc(courseCategories.sortOrder), asc(courses.code));
  const approvals = await sys
    .select({ a: programApprovals, code: courses.code, title: courses.title })
    .from(programApprovals)
    .innerJoin(courses, eq(courses.id, programApprovals.courseId))
    .orderBy(desc(programApprovals.createdAt));
  return { rows, approvals };
}

export async function recordApproval(sys: Db, adminUserId: string, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = approvalSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  const [course] = await sys.select({ id: courses.id, tenantId: courses.tenantId }).from(courses).where(eq(courses.id, v.courseId));
  if (!course || course.tenantId) return { ok: false, error: "Choose a library course." };
  const [row] = await sys
    .insert(programApprovals)
    .values({ ...v, scope: v.scope || null, expiresOn: v.expiresOn || null, notes: v.notes || null, verifiedById: adminUserId })
    .returning({ id: programApprovals.id });
  await writeAudit(sys, { tenantId: null, actorUserId: adminUserId, action: "program_approval.recorded", entityType: "program_approval", entityId: row.id, after: v });
  return { ok: true, data: row };
}

/** Downgrades any course whose approval-backed classification no longer has an active approval. */
export async function enforceApprovalBackedClassifications(sys: Db, actorUserId: string | null): Promise<string[]> {
  const rows = await sys.execute<{ id: string; code: string; program_classification: string }>(sql`
    update courses c
       set program_classification = 'STATE_REGULATED_TRAINING',
           certificate_type = case when c.certificate_type = 'CONTINUING_EDUCATION' then 'COURSE_COMPLETION'::certificate_kind else c.certificate_type end,
           updated_at = now()
     where c.program_classification in ('STATE_APPROVED_PROGRAM', 'CONTINUING_EDUCATION')
       and not exists (select 1 from program_approvals a where a.course_id = c.id and a.status = 'ACTIVE'
                        and a.effective_on <= current_date and (a.expires_on is null or a.expires_on >= current_date))
     returning c.id, c.code, c.program_classification::text`);
  for (const r of rows.rows) {
    await writeAudit(sys, { tenantId: null, actorUserId, action: "course.classification_downgraded", entityType: "course", entityId: r.id, after: { code: r.code, programClassification: "STATE_REGULATED_TRAINING", reason: "No active approval on record" } });
  }
  return rows.rows.map((r) => r.code);
}

/** Daily: marks approvals past their expiration EXPIRED and downgrades dependent courses. */
export async function expireApprovals(sys: Db): Promise<{ expired: number; downgraded: string[] }> {
  const ex = await sys.execute<{ id: string }>(sql`update program_approvals set status = 'EXPIRED' where status = 'ACTIVE' and expires_on < current_date returning id`);
  for (const r of ex.rows) await writeAudit(sys, { tenantId: null, actorUserId: null, action: "program_approval.expired", entityType: "program_approval", entityId: r.id });
  return { expired: ex.rows.length, downgraded: await enforceApprovalBackedClassifications(sys, null) };
}

export async function withdrawApproval(sys: Db, adminUserId: string, id: string, reason: string): Promise<ServiceResult<{ downgraded: string[] }>> {
  if (reason.trim().length < 10) return { ok: false, error: "Explain why the approval is withdrawn (at least 10 characters)." };
  const [a] = await sys.select().from(programApprovals).where(eq(programApprovals.id, id));
  if (!a) return { ok: false, error: "Approval not found." };
  if (a.status !== "ACTIVE") return { ok: false, error: "Only an active approval can be withdrawn." };
  await sys.update(programApprovals).set({ status: "WITHDRAWN", notes: [a.notes, `Withdrawn: ${reason.trim()}`].filter(Boolean).join("\n") }).where(eq(programApprovals.id, id));
  await writeAudit(sys, { tenantId: null, actorUserId: adminUserId, action: "program_approval.withdrawn", entityType: "program_approval", entityId: id, after: { reason: reason.trim() } });
  return { ok: true, data: { downgraded: await enforceApprovalBackedClassifications(sys, adminUserId) } };
}

export async function setClassification(sys: Db, adminUserId: string, raw: unknown): Promise<ServiceResult<null>> {
  const p = classificationSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  const [before] = await sys.select({ code: courses.code, tenantId: courses.tenantId, pc: courses.programClassification, ct: courses.certificateType }).from(courses).where(eq(courses.id, v.courseId));
  if (!before || before.tenantId) return { ok: false, error: "Choose a library course." };
  try {
    await sys.update(courses).set({ programClassification: v.programClassification, certificateType: v.certificateType }).where(and(eq(courses.id, v.courseId)));
  } catch (e) {
    const msg = String((e as { cause?: { message?: string }; message?: string }).cause?.message ?? (e as Error).message);
    if (/without an active approval/.test(msg)) return { ok: false, error: "This program type needs an active approval on record first. Record the approval below, then try again." };
    if (/continuing education certificates require/.test(msg)) return { ok: false, error: "Continuing education certificates need the course to be classified as continuing education (with an active approval)." };
    throw e;
  }
  await writeAudit(sys, { tenantId: null, actorUserId: adminUserId, action: "course.classification_changed", entityType: "course", entityId: v.courseId, before: { programClassification: before.pc, certificateType: before.ct }, after: { programClassification: v.programClassification, certificateType: v.certificateType, reason: v.reason } });
  return { ok: true, data: null };
}
