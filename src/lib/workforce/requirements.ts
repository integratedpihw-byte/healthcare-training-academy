/**
 * Organization training requirements and pathways (spec §12 step 3, §13). A requirement
 * maps a course OR a competency checklist to the employees it applies to (facility
 * types, positions, exposure). Requirements are the organization's own policy;
 * federal/Florida regulatory mappings with citations are maintained in the
 * Compliance Center and never invented here.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { competencies, courses, employeeFacilities, employees, facilities, trainingRequirements } from "@/db/schema";
import { FACILITY_TYPES } from "@/db/schema/_shared";
import { writeAudit } from "@/lib/audit";
import type { ServiceResult } from "@/lib/tenancy/service";
import type { Ctx } from "./employees";
import { normalizePositionCode, parseLeadDays, requirementApplies, type EmployeeFacts } from "./rules";

export const TENANT_REQUIREMENT_SOURCES = ["ORGANIZATIONAL_POLICY", "ACCREDITATION"] as const;
export const SOURCE_LABELS: Record<string, string> = {
  FEDERAL_REGULATION: "Federal regulation",
  STATE_REGULATION: "State regulation",
  ACCREDITATION: "Accreditation standard",
  ORGANIZATIONAL_POLICY: "Organizational policy",
};

const optInt = (min: number, max: number) =>
  z.union([z.literal(""), z.coerce.number().int().min(min).max(max)]).optional().transform((v) => (v === "" || v === undefined ? null : v));

export const requirementSchema = z
  .object({
    title: z.string().trim().min(3, "Required").max(200),
    target: z.enum(["course", "competency"]),
    courseId: z.string().uuid().optional().or(z.literal("")),
    competencyId: z.string().uuid().optional().or(z.literal("")),
    source: z.enum(TENANT_REQUIREMENT_SOURCES),
    facilityTypes: z.array(z.enum(FACILITY_TYPES)).default([]),
    positionCodes: z.string().max(1000).default("").transform((s) => [...new Set(s.split(/[\s,]+/).filter(Boolean).map(normalizePositionCode).filter(Boolean))]),
    requiresClinicalExposure: z.boolean().default(false),
    requiresBloodborneExposure: z.boolean().default(false),
    dueWithinDaysOfHire: optInt(0, 730),
    frequencyMonths: optInt(1, 120),
    reminderLeadDays: z.string().max(100).default(""),
    needsAdminReview: z.boolean().default(false),
    notes: z.string().trim().max(2000).optional().or(z.literal("")).transform((v) => v || null),
  })
  .superRefine((v, c) => {
    if (v.target === "course" && !v.courseId) c.addIssue({ code: "custom", path: ["courseId"], message: "Choose a course" });
    if (v.target === "competency" && !v.competencyId) c.addIssue({ code: "custom", path: ["competencyId"], message: "Choose a skills checklist" });
    if (v.reminderLeadDays.trim() && !parseLeadDays(v.reminderLeadDays)) c.addIssue({ code: "custom", path: ["reminderLeadDays"], message: "Use whole days between 1 and 365, e.g. 60, 30, 7" });
  });

const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });

export async function saveRequirement(tx: Tx, ctx: Ctx, raw: unknown, id?: string): Promise<ServiceResult<{ id: string }>> {
  const p = requirementSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  let courseId: string | null = null;
  let competencyId: string | null = null;
  if (v.target === "course") {
    const [c] = await tx.select({ id: courses.id, status: courses.status }).from(courses).where(eq(courses.id, v.courseId!));
    if (!c) return err("Course not found.");
    if (c.status !== "PUBLISHED") return err("Only published courses can be required.");
    courseId = c.id;
  } else {
    const [c] = await tx.select({ id: competencies.id }).from(competencies).where(and(eq(competencies.id, v.competencyId!), eq(competencies.isActive, true)));
    if (!c) return err("Skills checklist not found.");
    competencyId = c.id;
  }
  const values = {
    title: v.title,
    courseId,
    competencyId,
    source: v.source,
    facilityTypes: v.facilityTypes,
    positionCodes: v.positionCodes,
    requiresClinicalExposure: v.requiresClinicalExposure,
    requiresBloodborneExposure: v.requiresBloodborneExposure,
    dueWithinDaysOfHire: v.dueWithinDaysOfHire,
    frequencyMonths: v.frequencyMonths,
    reminderLeadDays: parseLeadDays(v.reminderLeadDays),
    needsAdminReview: v.needsAdminReview,
    notes: v.notes,
  };
  try {
    if (id) {
      const [before] = await tx.select().from(trainingRequirements).where(eq(trainingRequirements.id, id));
      if (!before || before.tenantId !== ctx.tenantId) return err("Requirement not found or not editable.");
      await tx.update(trainingRequirements).set(values).where(eq(trainingRequirements.id, id));
      await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "requirement.updated", entityType: "training_requirement", entityId: id, before, after: values });
      return { ok: true, data: { id } };
    }
    const [row] = await tx.insert(trainingRequirements).values({ ...values, tenantId: ctx.tenantId }).returning({ id: trainingRequirements.id });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "requirement.created", entityType: "training_requirement", entityId: row.id, after: values });
    return { ok: true, data: { id: row.id } };
  } catch {
    return err("You are not authorized to manage training requirements.");
  }
}

export async function setRequirementActive(tx: Tx, ctx: Ctx, id: string, isActive: boolean): Promise<ServiceResult<null>> {
  const r = await tx
    .update(trainingRequirements)
    .set({ isActive })
    .where(and(eq(trainingRequirements.id, id), eq(trainingRequirements.tenantId, ctx.tenantId)))
    .returning({ id: trainingRequirements.id });
  if (!r.length) return err("Requirement not found or not editable.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: isActive ? "requirement.activated" : "requirement.deactivated", entityType: "training_requirement", entityId: id });
  return { ok: true, data: null };
}

export async function listRequirements(tx: Tx, opts: { activeOnly?: boolean } = {}) {
  return tx
    .select({
      r: trainingRequirements,
      courseTitle: courses.title,
      courseCode: courses.code,
      courseStatus: courses.status,
      competencyName: competencies.name,
    })
    .from(trainingRequirements)
    .leftJoin(courses, eq(courses.id, trainingRequirements.courseId))
    .leftJoin(competencies, eq(competencies.id, trainingRequirements.competencyId))
    .where(opts.activeOnly ? eq(trainingRequirements.isActive, true) : undefined)
    .orderBy(sql`${trainingRequirements.tenantId} nulls first`, asc(trainingRequirements.title));
}

export async function getRequirement(tx: Tx, id: string) {
  const [r] = await tx.select().from(trainingRequirements).where(eq(trainingRequirements.id, id));
  return r ?? null;
}

/** Facts used to evaluate applicability for one employee (spec §12 steps 1–2). */
export async function employeeFacts(tx: Tx, employeeId: string): Promise<(EmployeeFacts & { hireDate: string; userId: string | null; primaryFacilityId: string | null; employmentStatus: string }) | null> {
  const [e] = await tx.select().from(employees).where(eq(employees.id, employeeId));
  if (!e) return null;
  const types = await tx
    .selectDistinct({ type: facilities.facilityType, licenseType: facilities.licenseType, designations: facilities.designations })
    .from(employeeFacilities)
    .innerJoin(facilities, eq(facilities.id, employeeFacilities.facilityId))
    .where(eq(employeeFacilities.employeeId, employeeId));
  return {
    positionCode: e.positionCode,
    clinicalExposure: e.clinicalExposure,
    bloodborneExposure: e.bloodborneExposure,
    facilityTypes: [...new Set(types.map((t) => t.type))],
    facilityLicenseTypes: [...new Set(types.flatMap((t) => [t.licenseType, ...t.designations]).filter((x): x is string => !!x))],
    jobDuties: e.jobDuties,
    hireDate: e.hireDate,
    userId: e.userId,
    primaryFacilityId: e.primaryFacilityId,
    employmentStatus: e.employmentStatus,
  };
}

/** Active requirements (organization + platform defaults) that apply to the employee. */
export async function applicableRequirements(tx: Tx, employeeId: string) {
  const facts = await employeeFacts(tx, employeeId);
  if (!facts) return { facts: null, requirements: [] };
  const all = await tx
    .select({ r: trainingRequirements, courseTitle: courses.title, courseStatus: courses.status, renewalMonths: courses.renewalMonths, competencyName: competencies.name })
    .from(trainingRequirements)
    .leftJoin(courses, eq(courses.id, trainingRequirements.courseId))
    .leftJoin(competencies, eq(competencies.id, trainingRequirements.competencyId))
    .where(eq(trainingRequirements.isActive, true));
  return { facts, requirements: all.filter((a) => requirementApplies(a.r, facts)) };
}
