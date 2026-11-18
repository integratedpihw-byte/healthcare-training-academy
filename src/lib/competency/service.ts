/**
 * Practical competency validation (spec §9).
 *
 * - Theoretical course completion NEVER creates or implies a competency record.
 * - Evaluators record criterion-by-criterion observations; the result is derived:
 *   any critical criterion not met → FAIL; any other criterion not met → NEEDS_REMEDIATION.
 * - Electronic signature requires re-entering the evaluator's password and the
 *   competency.sign permission; the signature hash binds the signer to the exact record.
 *   Signed records are immutable and may only be voided with a reason (database triggers).
 */
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import { competencies, competencyAssessments, employeeFacilities, employees, facilities, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { sha256 } from "@/lib/auth/crypto";
import { verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/auth/rate-limit";
import { notify } from "@/lib/notify/notifications";
import { addMonths } from "@/lib/certificates/service";
import { can, facilityScope, type Access } from "@/lib/rbac/access";
import type { ServiceResult } from "@/lib/tenancy/service";

export interface Ctx {
  tenantId: string;
  userId: string;
  access: Access;
}
export type Criterion = { id: string; text: string; critical: boolean };
export type CriterionResult = { id: string; outcome: "MET" | "NOT_MET" | "NA"; note?: string };

const err = (error: string): ServiceResult<never> => ({ ok: false, error });

export function deriveResult(criteria: Criterion[], results: CriterionResult[]): "PASS" | "FAIL" | "NEEDS_REMEDIATION" {
  const byId = new Map(results.map((r) => [r.id, r]));
  const notMet = criteria.filter((c) => byId.get(c.id)?.outcome === "NOT_MET");
  if (notMet.some((c) => c.critical)) return "FAIL";
  if (notMet.length > 0) return "NEEDS_REMEDIATION";
  return "PASS";
}

/** Canonical content bound by the electronic signature. */
export function signaturePayload(a: {
  id: string; tenantId: string; employeeId: string; facilityId: string; competencyId: string; evaluatorUserId: string;
  assessedOn: string; result: string; criteriaResults: unknown; remediationRequired: string | null; evaluatorComments: string | null;
}, signedAtIso: string, signerName: string) {
  return JSON.stringify({
    id: a.id, tenantId: a.tenantId, employeeId: a.employeeId, facilityId: a.facilityId, competencyId: a.competencyId,
    evaluatorUserId: a.evaluatorUserId, assessedOn: a.assessedOn, result: a.result, criteriaResults: a.criteriaResults,
    remediationRequired: a.remediationRequired, evaluatorComments: a.evaluatorComments, signedAt: signedAtIso, signerName,
  });
}

export async function listCompetencies(tx: Tx) {
  return tx.select().from(competencies).where(eq(competencies.isActive, true)).orderBy(asc(competencies.name));
}

/** Employees the user may evaluate (facility-scoped for Facility Administrators). */
export async function evaluableEmployees(tx: Tx, access: Access) {
  const scope = facilityScope(access, "competency.evaluate");
  return tx
    .select({
      id: employees.id,
      name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      jobTitle: employees.jobTitle,
      userId: employees.userId,
      primaryFacilityId: employees.primaryFacilityId,
      facilityIds: sql<string[]>`array(select ef.facility_id from employee_facilities ef where ef.employee_id = "employees"."id")`,
    })
    .from(employees)
    .where(
      and(
        ne(employees.employmentStatus, "TERMINATED"),
        scope === null ? undefined : scope.length ? sql`exists (select 1 from employee_facilities ef where ef.employee_id = "employees"."id" and ef.facility_id in (${sql.join(scope.map((f) => sql`${f}::uuid`), sql`, `)}))` : sql`false`,
      ),
    )
    .orderBy(asc(employees.lastName));
}

export const assessmentSchema = z.object({
  employeeId: z.string().uuid("Choose an employee"),
  facilityId: z.string().uuid("Choose a facility"),
  competencyId: z.string().uuid("Choose a skill"),
  assessedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the assessment date"),
  criteriaResults: z.array(z.object({ id: z.string(), outcome: z.enum(["MET", "NOT_MET", "NA"]), note: z.string().max(500).optional() })),
  remediationRequired: z.string().trim().max(2000).optional().or(z.literal("")),
  evaluatorComments: z.string().trim().max(2000).optional().or(z.literal("")),
  evidenceUrls: z.array(z.string().trim().url().refine((u) => u.startsWith("https://"), "https links only")).max(10).default([]),
  nextAssessmentDue: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

async function validate(tx: Tx, ctx: Ctx, raw: unknown) {
  const p = assessmentSchema.safeParse(raw);
  if (!p.success) return { error: { ok: false as const, error: "Please complete the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> } };
  const v = p.data;
  if (!can(ctx.access, "competency.evaluate", v.facilityId)) return { error: err("You are not authorized to evaluate competencies at this facility.") };
  const today = new Date().toISOString().slice(0, 10);
  if (v.assessedOn > today) return { error: err("The assessment date cannot be in the future.") };
  const [emp] = await tx.select().from(employees).where(eq(employees.id, v.employeeId));
  if (!emp) return { error: err("Employee not found.") };
  if (emp.userId && emp.userId === ctx.userId) return { error: err("You cannot evaluate your own competency.") };
  const [assigned] = await tx.select().from(employeeFacilities).where(and(eq(employeeFacilities.employeeId, v.employeeId), eq(employeeFacilities.facilityId, v.facilityId)));
  if (!assigned) return { error: err("The employee is not assigned to the selected facility.") };
  const [comp] = await tx.select().from(competencies).where(eq(competencies.id, v.competencyId));
  if (!comp) return { error: err("Skill checklist not found.") };
  const criteria = comp.criteria as Criterion[];
  const answered = new Set(v.criteriaResults.map((r) => r.id));
  const missing = criteria.filter((c) => !answered.has(c.id));
  if (missing.length) return { error: err(`Record an outcome for every criterion (${missing.length} missing).`) };
  const results = criteria.map((c) => v.criteriaResults.find((r) => r.id === c.id)!);
  if (results.some((r, i) => criteria[i].critical && r.outcome === "NA")) return { error: err("Critical criteria cannot be marked not applicable.") };
  const result = deriveResult(criteria, results);
  if (result !== "PASS" && !v.remediationRequired) return { error: { ok: false as const, error: "Describe the remediation required.", fieldErrors: { remediationRequired: ["Required when the result is not a pass"] } } };
  let next = v.nextAssessmentDue || null;
  if (!next && result === "PASS" && comp.renewalMonths) next = addMonths(v.assessedOn, comp.renewalMonths);
  return { v, comp, criteria, results, result, next };
}

export async function saveDraft(tx: Tx, ctx: Ctx, raw: unknown, id?: string): Promise<ServiceResult<{ id: string }>> {
  const r = await validate(tx, ctx, raw);
  if ("error" in r) return r.error as ServiceResult<never>;
  const values = {
    employeeId: r.v.employeeId,
    facilityId: r.v.facilityId,
    competencyId: r.v.competencyId,
    assessedOn: r.v.assessedOn,
    criteriaResults: r.results,
    result: r.result,
    remediationRequired: r.v.remediationRequired || null,
    evaluatorComments: r.v.evaluatorComments || null,
    evidenceUrls: r.v.evidenceUrls,
    nextAssessmentDue: r.next,
  };
  if (id) {
    const [existing] = await tx.select().from(competencyAssessments).where(eq(competencyAssessments.id, id));
    if (!existing) return err("Assessment not found.");
    if (existing.status !== "DRAFT") return err("Signed assessments cannot be edited.");
    if (existing.evaluatorUserId !== ctx.userId) return err("Only the evaluator can edit this draft.");
    await tx.update(competencyAssessments).set(values).where(eq(competencyAssessments.id, id));
    return { ok: true, data: { id } };
  }
  const [a] = await tx
    .insert(competencyAssessments)
    .values({ ...values, tenantId: ctx.tenantId, evaluatorUserId: ctx.userId, status: "DRAFT" })
    .returning({ id: competencyAssessments.id });
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "competency.draft_created", entityType: "competency_assessment", entityId: a.id, after: { employeeId: r.v.employeeId, competency: r.comp.code, result: r.result } });
  return { ok: true, data: { id: a.id } };
}

export async function deleteDraft(tx: Tx, ctx: Ctx, id: string): Promise<ServiceResult<null>> {
  const [a] = await tx.select().from(competencyAssessments).where(eq(competencyAssessments.id, id));
  if (!a || a.status !== "DRAFT" || a.evaluatorUserId !== ctx.userId) return err("Only your own drafts can be deleted.");
  await tx.delete(competencyAssessments).where(eq(competencyAssessments.id, id));
  return { ok: true, data: null };
}

/** Electronic signature with password re-authentication (system client verifies the password). */
export async function signAssessment(
  tx: Tx,
  sys: Db,
  ctx: Ctx,
  id: string,
  input: { password: string; credentials: string; attest: boolean },
): Promise<ServiceResult<{ signatureHash: string }>> {
  if (!can(ctx.access, "competency.sign")) return err("You do not have permission to sign competency assessments.");
  if (!input.attest) return err("Confirm the attestation to sign.");
  const lim = await rateLimit(sys, `esign:${ctx.userId}`, 5, 10 * 60);
  if (!lim.allowed) return err("Too many signature attempts. Try again in a few minutes.");
  const [u] = await sys.select({ hash: users.passwordHash, first: users.firstName, last: users.lastName }).from(users).where(eq(users.id, ctx.userId));
  if (!u || !(await verifyPassword(u.hash, input.password))) {
    await writeAudit(sys, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "competency.signature_failed", entityType: "competency_assessment", entityId: id });
    return err("Password is incorrect. Your signature was not applied.");
  }
  const [a] = await tx.select().from(competencyAssessments).where(eq(competencyAssessments.id, id));
  if (!a) return err("Assessment not found.");
  if (a.status !== "DRAFT") return err("This assessment is already signed.");
  if (a.evaluatorUserId !== ctx.userId) return err("Only the evaluator who recorded the observations may sign.");
  const signedAt = new Date();
  const signerName = `${u.first} ${u.last}`;
  const signatureHash = sha256(signaturePayload(a, signedAt.toISOString(), signerName));
  await tx
    .update(competencyAssessments)
    .set({ status: "SIGNED", signedAt, signatureHash, signerName, signerCredentials: input.credentials.trim() || null })
    .where(eq(competencyAssessments.id, id));
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "competency.signed", entityType: "competency_assessment", entityId: id, after: { result: a.result, signatureHash } });
  const [emp] = await tx.select({ userId: employees.userId }).from(employees).where(eq(employees.id, a.employeeId));
  if (emp?.userId) {
    const [comp] = await tx.select({ name: competencies.name }).from(competencies).where(eq(competencies.id, a.competencyId));
    await notify(sys, { tenantId: ctx.tenantId, userId: emp.userId, type: "competency.recorded", title: "Skills evaluation recorded", body: `A ${comp?.name ?? "skills"} evaluation was signed with result: ${a.result.replace("_", " ").toLowerCase()}.`, link: `/competency/${id}`, dedupeKey: `comp:${id}` });
  }
  // The Certificate of Competency is issued by the caller after this transaction commits
  // (issueForCompetency), with a daily repair job as a safety net.
  return { ok: true, data: { signatureHash } };
}

export async function voidAssessment(tx: Tx, ctx: Ctx, id: string, reason: string): Promise<ServiceResult<null>> {
  if (!can(ctx.access, "competency.sign")) return err("You do not have permission to void competency assessments.");
  if (reason.trim().length < 10) return err("Explain why this record is being voided (at least 10 characters).");
  const [a] = await tx.select().from(competencyAssessments).where(eq(competencyAssessments.id, id));
  if (!a || a.status !== "SIGNED") return err("Only signed assessments can be voided.");
  await tx.update(competencyAssessments).set({ status: "VOIDED", voidReason: reason.trim(), voidedById: ctx.userId }).where(eq(competencyAssessments.id, id));
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "competency.voided", entityType: "competency_assessment", entityId: id, after: { reason: reason.trim() } });
  // The caller revokes the Certificate of Competency after this commits (revokeForVoidedCompetency).
  return { ok: true, data: null };
}

export async function getAssessment(tx: Tx, id: string) {
  const [row] = await tx
    .select({
      a: competencyAssessments,
      competency: competencies,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeUserId: employees.userId,
      jobTitle: employees.jobTitle,
      facilityName: facilities.name,
      evaluatorName: sql<string>`(select u.first_name || ' ' || u.last_name from users u where u.id = ${competencyAssessments.evaluatorUserId})`,
    })
    .from(competencyAssessments)
    .innerJoin(competencies, eq(competencies.id, competencyAssessments.competencyId))
    .innerJoin(employees, eq(employees.id, competencyAssessments.employeeId))
    .innerJoin(facilities, eq(facilities.id, competencyAssessments.facilityId))
    .where(eq(competencyAssessments.id, id));
  return row ?? null;
}

/** Verifies a signed record against its stored signature hash. */
export function verifySignature(a: typeof competencyAssessments.$inferSelect): boolean {
  if (!a.signatureHash || !a.signedAt || !a.signerName) return false;
  return sha256(signaturePayload(a, a.signedAt.toISOString(), a.signerName)) === a.signatureHash;
}

export async function listAssessments(tx: Tx, opts: { employeeId?: string; mineOnly?: string; limit?: number } = {}) {
  return tx
    .select({
      id: competencyAssessments.id,
      status: competencyAssessments.status,
      result: competencyAssessments.result,
      assessedOn: competencyAssessments.assessedOn,
      nextAssessmentDue: competencyAssessments.nextAssessmentDue,
      competency: competencies.name,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      facilityName: facilities.name,
      evaluatorUserId: competencyAssessments.evaluatorUserId,
    })
    .from(competencyAssessments)
    .innerJoin(competencies, eq(competencies.id, competencyAssessments.competencyId))
    .innerJoin(employees, eq(employees.id, competencyAssessments.employeeId))
    .innerJoin(facilities, eq(facilities.id, competencyAssessments.facilityId))
    .where(and(opts.employeeId ? eq(competencyAssessments.employeeId, opts.employeeId) : undefined, opts.mineOnly ? eq(employees.userId, opts.mineOnly) : undefined))
    .orderBy(desc(competencyAssessments.createdAt))
    .limit(opts.limit ?? 200);
}

/** Latest signed (non-voided) result per employee × competency for the competency matrix. */
export async function competencyMatrix(tx: Tx, employeeIds: string[]) {
  if (employeeIds.length === 0) return [];
  const rows = await tx.execute<{ employee_id: string; competency_id: string; result: string; assessed_on: string; next_due: string | null; id: string }>(sql`
    select distinct on (employee_id, competency_id) employee_id, competency_id, result::text, assessed_on::text, next_assessment_due::text next_due, id
      from competency_assessments
     where status = 'SIGNED' and employee_id in (${sql.join(employeeIds.map((e) => sql`${e}::uuid`), sql`, `)})
     order by employee_id, competency_id, assessed_on desc, signed_at desc`);
  return rows.rows;
}

