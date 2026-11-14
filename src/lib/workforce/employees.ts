/**
 * Employee profiles (spec §12). Visibility and write scope are enforced by RLS:
 * Facility Administrators see/manage employees assigned to their facilities;
 * Supervisors (team.view) see direct reports only. Services add friendly checks.
 */
import { and, asc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import {
  departments,
  employeeFacilities,
  employees,
  facilities,
  membershipRoles,
  memberships,
  organizations,
  users,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { randomToken } from "@/lib/auth/crypto";
import { secureUnverifiedAccount, sendPasswordLink } from "@/lib/auth/service";
import { can, type Access } from "@/lib/rbac/access";
import { systemRoleId, type ServiceResult } from "@/lib/tenancy/service";
import { normalizePositionCode } from "./rules";

export interface Ctx {
  tenantId: string;
  userId: string;
  access: Access;
}
const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });
const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const optUuid = z.string().uuid().optional().or(z.literal("")).transform((v) => v || null);
const optText = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || null);

export const EMPLOYMENT_STATUSES = ["ACTIVE", "ON_LEAVE", "PRN", "CONTRACTOR", "TERMINATED"] as const;
export const EMPLOYMENT_LABELS: Record<string, string> = { ACTIVE: "Active", ON_LEAVE: "On leave", PRN: "PRN", CONTRACTOR: "Contractor", TERMINATED: "Terminated" };

export const employeeSchema = z
  .object({
    employeeNumber: z.string().trim().min(1, "Required").max(40),
    firstName: z.string().trim().min(1, "Required").max(100),
    lastName: z.string().trim().min(1, "Required").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(254).optional().or(z.literal("")).transform((v) => v || null),
    phone: optText(40),
    jobTitle: z.string().trim().min(1, "Required").max(120),
    positionCode: z.string().trim().min(1, "Required").max(60).transform(normalizePositionCode),
    clinicalExposure: z.boolean().default(false),
    bloodborneExposure: z.boolean().default(false),
    employmentStatus: z.enum(EMPLOYMENT_STATUSES).default("ACTIVE"),
    hireDate: iso,
    terminationDate: iso.optional().or(z.literal("")).transform((v) => v || null),
    primaryFacilityId: z.string().uuid("Choose a facility"),
    departmentId: optUuid,
    supervisorId: optUuid,
    trainingPathway: optText(200),
    jobDuties: z.array(z.string().regex(/^[A-Z0-9_]{2,40}$/)).max(30).default([]),
  })
  .superRefine((v, c) => {
    if (v.employmentStatus === "TERMINATED" && !v.terminationDate) c.addIssue({ code: "custom", path: ["terminationDate"], message: "Required for terminated employees" });
    if (v.terminationDate && v.terminationDate < v.hireDate) c.addIssue({ code: "custom", path: ["terminationDate"], message: "Cannot precede the hire date" });
    if (v.positionCode.length < 2) c.addIssue({ code: "custom", path: ["positionCode"], message: "Enter a position code" });
  });
export type EmployeeInput = z.input<typeof employeeSchema>;

async function validateRefs(tx: Tx, v: z.output<typeof employeeSchema>, employeeId?: string): Promise<string | null> {
  const [f] = await tx.select({ id: facilities.id }).from(facilities).where(eq(facilities.id, v.primaryFacilityId));
  if (!f) return "Facility not found.";
  if (v.departmentId) {
    const [d] = await tx.select({ facilityId: departments.facilityId }).from(departments).where(eq(departments.id, v.departmentId));
    if (!d) return "Department not found.";
    if (d.facilityId && d.facilityId !== v.primaryFacilityId) return "The department belongs to a different facility.";
  }
  if (v.supervisorId) {
    if (v.supervisorId === employeeId) return "An employee cannot supervise themselves.";
    // Walk up the chain to prevent cycles (bounded).
    let cur: string | null = v.supervisorId;
    for (let i = 0; cur && i < 25; i++) {
      const [s]: { id: string; supervisorId: string | null }[] = await tx.select({ id: employees.id, supervisorId: employees.supervisorId }).from(employees).where(eq(employees.id, cur));
      if (!s) return i === 0 ? "Supervisor not found." : null;
      if (employeeId && s.supervisorId === employeeId) return "That supervisor reports to this employee (circular reporting line).";
      cur = s.supervisorId;
    }
  }
  return null;
}

export async function createEmployee(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = employeeSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  if (!can(ctx.access, "employees.manage", v.primaryFacilityId)) return err("You can only add employees to facilities you manage.");
  const refErr = await validateRefs(tx, v);
  if (refErr) return err(refErr);
  const [dup] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.employeeNumber, v.employeeNumber));
  if (dup) return err("That employee ID is already in use.", { employeeNumber: ["Already in use"] });
  const [org] = await tx.select({ id: organizations.id }).from(organizations).limit(1);
  if (!org) return err("Organization profile not found.");
  const [row] = await tx
    .insert(employees)
    .values({ ...v, tenantId: ctx.tenantId, organizationId: org.id })
    .returning({ id: employees.id });
  await tx.insert(employeeFacilities).values({ tenantId: ctx.tenantId, employeeId: row.id, facilityId: v.primaryFacilityId });
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "employee.created", entityType: "employee", entityId: row.id, after: { ...v, email: v.email ? "[set]" : null, phone: v.phone ? "[set]" : null } });
  return { ok: true, data: { id: row.id } };
}

export async function updateEmployee(tx: Tx, ctx: Ctx, id: string, raw: unknown): Promise<ServiceResult<{ facilityOrPositionChanged: boolean }>> {
  const p = employeeSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  const [before] = await tx.select().from(employees).where(eq(employees.id, id));
  if (!before) return err("Employee not found.");
  if (!can(ctx.access, "employees.manage", v.primaryFacilityId)) return err("You can only assign employees to facilities you manage.");
  const refErr = await validateRefs(tx, v, id);
  if (refErr) return err(refErr);
  if (v.employeeNumber !== before.employeeNumber) {
    const [dup] = await tx.select({ id: employees.id }).from(employees).where(and(eq(employees.employeeNumber, v.employeeNumber), ne(employees.id, id)));
    if (dup) return err("That employee ID is already in use.", { employeeNumber: ["Already in use"] });
  }
  const updated = await tx.update(employees).set(v).where(eq(employees.id, id)).returning({ id: employees.id });
  if (!updated.length) return err("You are not authorized to edit this employee.");
  if (v.primaryFacilityId !== before.primaryFacilityId) {
    await tx.insert(employeeFacilities).values({ tenantId: ctx.tenantId, employeeId: id, facilityId: v.primaryFacilityId }).onConflictDoNothing();
  }
  await writeAudit(tx, {
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "employee.updated",
    entityType: "employee",
    entityId: id,
    before: { jobTitle: before.jobTitle, positionCode: before.positionCode, employmentStatus: before.employmentStatus, primaryFacilityId: before.primaryFacilityId, supervisorId: before.supervisorId },
    after: { jobTitle: v.jobTitle, positionCode: v.positionCode, employmentStatus: v.employmentStatus, primaryFacilityId: v.primaryFacilityId, supervisorId: v.supervisorId },
  });
  const changed =
    v.positionCode !== before.positionCode ||
    v.primaryFacilityId !== before.primaryFacilityId ||
    v.clinicalExposure !== before.clinicalExposure ||
    v.bloodborneExposure !== before.bloodborneExposure;
  return { ok: true, data: { facilityOrPositionChanged: changed } };
}

/** Spec §12: employees may work at multiple facilities "when authorized" (employees.manage at that facility). */
export async function addEmployeeFacility(tx: Tx, ctx: Ctx, employeeId: string, facilityId: string): Promise<ServiceResult<null>> {
  if (!can(ctx.access, "employees.manage", facilityId)) return err("You are not authorized to assign staff to that facility.");
  const [e] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, employeeId));
  if (!e) return err("Employee not found.");
  const [f] = await tx.select({ id: facilities.id, active: facilities.isActive }).from(facilities).where(eq(facilities.id, facilityId));
  if (!f || !f.active) return err("Facility not found or inactive.");
  try {
    const r = await tx.insert(employeeFacilities).values({ tenantId: ctx.tenantId, employeeId, facilityId }).onConflictDoNothing().returning({ e: employeeFacilities.employeeId });
    if (!r.length) return err("The employee is already assigned to that facility.");
  } catch {
    return err("You are not authorized to assign this employee to that facility.");
  }
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "employee.facility_added", entityType: "employee", entityId: employeeId, after: { facilityId } });
  return { ok: true, data: null };
}

export async function removeEmployeeFacility(tx: Tx, ctx: Ctx, employeeId: string, facilityId: string): Promise<ServiceResult<null>> {
  const [e] = await tx.select({ primary: employees.primaryFacilityId }).from(employees).where(eq(employees.id, employeeId));
  if (!e) return err("Employee not found.");
  if (e.primary === facilityId) return err("Change the primary facility before removing it.");
  const r = await tx.delete(employeeFacilities).where(and(eq(employeeFacilities.employeeId, employeeId), eq(employeeFacilities.facilityId, facilityId))).returning({ e: employeeFacilities.employeeId });
  if (!r.length) return err("You are not authorized to change this facility assignment.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "employee.facility_removed", entityType: "employee", entityId: employeeId, before: { facilityId } });
  return { ok: true, data: null };
}

/**
 * Gives an employee a learner account in this organization (spec §12 step 7). Only the
 * least-privileged Learner role is granted, so Facility Administrators (who cannot
 * manage organization users) may provision their staff; the platform client writes
 * the membership after the caller's authority over the employee is verified under RLS.
 */
export async function provisionEmployeeAccount(sys: Db, tx: Tx, ctx: Ctx, employeeId: string): Promise<ServiceResult<{ userId: string; created: boolean }>> {
  const [e] = await tx.select().from(employees).where(eq(employees.id, employeeId));
  if (!e) return err("Employee not found.");
  if (!can(ctx.access, "employees.manage", e.primaryFacilityId)) return err("You are not authorized to manage this employee.");
  if (e.userId) return err("This employee already has an academy account.");
  if (!e.email) return err("Add the employee's email address first.");
  if (e.employmentStatus === "TERMINATED") return err("Terminated employees cannot be given an account.");

  let created = false;
  let [u] = await sys.select({ id: users.id }).from(users).where(eq(users.email, e.email)).limit(1);
  if (!u) {
    [u] = await sys.insert(users).values({ email: e.email, firstName: e.firstName, lastName: e.lastName, status: "ACTIVE", passwordHash: await hashPassword(randomToken(48)) }).returning({ id: users.id });
    created = true;
  }
  const [linked] = await tx.select({ id: employees.id }).from(employees).where(and(eq(employees.userId, u.id), ne(employees.id, employeeId)));
  if (linked) return err("That email belongs to an account already linked to another employee record.");

  const learnerRole = await systemRoleId(sys, "learner");
  await sys.transaction(async (s) => {
    let [m] = await s.select({ id: memberships.id, status: memberships.status }).from(memberships).where(and(eq(memberships.tenantId, ctx.tenantId), eq(memberships.userId, u.id)));
    if (!m) [m] = await s.insert(memberships).values({ tenantId: ctx.tenantId, userId: u.id }).returning({ id: memberships.id, status: memberships.status });
    await s.insert(membershipRoles).values({ tenantId: ctx.tenantId, membershipId: m.id, roleId: learnerRole, facilityId: null }).onConflictDoNothing();
  });
  const upd = await tx.update(employees).set({ userId: u.id }).where(eq(employees.id, employeeId)).returning({ id: employees.id });
  if (!upd.length) return err("You are not authorized to edit this employee.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "employee.account_provisioned", entityType: "employee", entityId: employeeId, after: { userId: u.id, role: "learner", created } });
  if (created) await sendPasswordLink(sys, u.id, e.email, "invite");
  else await secureUnverifiedAccount(sys, u.id, e.email);
  return { ok: true, data: { userId: u.id, created } };
}

// ---------------------------------------------------------------------------
// Queries (RLS-scoped)
// ---------------------------------------------------------------------------

export const employeeFilterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  facilityId: z.string().uuid().optional(),
  status: z.enum([...EMPLOYMENT_STATUSES, "CURRENT", "ALL"]).optional(),
  position: z.string().trim().max(60).optional(),
});

export async function listEmployees(tx: Tx, f: z.infer<typeof employeeFilterSchema> = {}) {
  const sup = sql`(select s.first_name || ' ' || s.last_name from employees s where s.id = ${employees.supervisorId})`;
  const status = f.status ?? "CURRENT";
  return tx
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      jobTitle: employees.jobTitle,
      positionCode: employees.positionCode,
      employmentStatus: employees.employmentStatus,
      hireDate: employees.hireDate,
      userId: employees.userId,
      supervisorId: employees.supervisorId,
      supervisorName: sql<string | null>`${sup}`,
      primaryFacilityId: employees.primaryFacilityId,
      facilityName: facilities.name,
      departmentName: departments.name,
    })
    .from(employees)
    .leftJoin(facilities, eq(facilities.id, employees.primaryFacilityId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(
      and(
        status === "ALL" ? undefined : status === "CURRENT" ? ne(employees.employmentStatus, "TERMINATED") : eq(employees.employmentStatus, status),
        f.facilityId ? sql`exists (select 1 from employee_facilities ef where ef.employee_id = ${employees.id} and ef.facility_id = ${f.facilityId}::uuid)` : undefined,
        f.position ? eq(employees.positionCode, normalizePositionCode(f.position)) : undefined,
        f.q
          ? or(
              ilike(employees.firstName, `%${f.q}%`),
              ilike(employees.lastName, `%${f.q}%`),
              ilike(employees.employeeNumber, `%${f.q}%`),
              ilike(employees.jobTitle, `%${f.q}%`),
              sql`(${employees.firstName} || ' ' || ${employees.lastName}) ilike ${"%" + f.q + "%"}`,
            )
          : undefined,
      ),
    )
    .orderBy(asc(employees.lastName), asc(employees.firstName))
    .limit(1000);
}

export async function getEmployee(tx: Tx, id: string) {
  const [e] = await tx.select().from(employees).where(eq(employees.id, id));
  if (!e) return null;
  const facs = await tx
    .select({ id: facilities.id, name: facilities.name, type: facilities.facilityType })
    .from(employeeFacilities)
    .innerJoin(facilities, eq(facilities.id, employeeFacilities.facilityId))
    .where(eq(employeeFacilities.employeeId, id))
    .orderBy(asc(facilities.name));
  const [sup] = e.supervisorId ? await tx.select({ id: employees.id, name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}` }).from(employees).where(eq(employees.id, e.supervisorId)) : [];
  const [dept] = e.departmentId ? await tx.select({ name: departments.name }).from(departments).where(eq(departments.id, e.departmentId)) : [];
  const reports = await tx.select({ id: employees.id, name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`, jobTitle: employees.jobTitle }).from(employees).where(and(eq(employees.supervisorId, id), ne(employees.employmentStatus, "TERMINATED"))).orderBy(asc(employees.lastName));
  const [account] = e.userId ? await tx.select({ email: users.email, status: users.status }).from(users).where(eq(users.id, e.userId)) : [];
  return { employee: e, facilities: facs, supervisor: sup ?? null, department: dept?.name ?? null, reports, account: account ?? null };
}

/** Reference lists for employee forms. */
export async function employeeFormOptions(tx: Tx, access: Access) {
  const facs = await tx.select({ id: facilities.id, name: facilities.name, type: facilities.facilityType }).from(facilities).where(eq(facilities.isActive, true)).orderBy(asc(facilities.name));
  const depts = await tx.select({ id: departments.id, name: departments.name, facilityId: departments.facilityId }).from(departments).orderBy(asc(departments.name));
  const sups = await tx
    .select({ id: employees.id, name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`, jobTitle: employees.jobTitle })
    .from(employees)
    .where(ne(employees.employmentStatus, "TERMINATED"))
    .orderBy(asc(employees.lastName));
  return { facilities: facs.filter((f) => can(access, "employees.manage", f.id)), allFacilities: facs, departments: depts, supervisors: sups };
}

export async function employeeIdsForUser(tx: Tx, userId: string) {
  return (await tx.select({ id: employees.id }).from(employees).where(eq(employees.userId, userId))).map((r) => r.id);
}

export async function employeesByIds(tx: Tx, ids: string[]) {
  if (!ids.length) return [];
  return tx.select().from(employees).where(inArray(employees.id, ids));
}
