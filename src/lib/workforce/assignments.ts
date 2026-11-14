/**
 * Training assignments (spec §12 steps 5–8, §13). An assignment asks an employee to
 * complete a course by a due date. Its status follows the employee's enrollment
 * (database trigger): IN_PROGRESS when started, COMPLETED only when the enrollment is
 * completed (all lessons + mandatory exams). Assignments are never deleted; they are
 * waived or cancelled with a reason, and due-date corrections are audited.
 */
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { courses, employees, enrollments, facilities, trainingAssignments } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import { can } from "@/lib/rbac/access";
import type { ServiceResult } from "@/lib/tenancy/service";
import type { Ctx } from "./employees";
import { addDays, normalizePositionCode, todayIso } from "./rules";

const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });
const OPEN = ["ASSIGNED", "IN_PROGRESS", "OVERDUE"] as const;

export const ASSIGNMENT_LABELS: Record<string, { label: string; tone: "green" | "amber" | "red" | "blue" | "gray" | "teal" }> = {
  ASSIGNED: { label: "Assigned", tone: "blue" },
  IN_PROGRESS: { label: "In progress", tone: "teal" },
  COMPLETED: { label: "Completed", tone: "green" },
  OVERDUE: { label: "Overdue", tone: "red" },
  WAIVED: { label: "Waived", tone: "gray" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
};
export const SOURCE_LABELS: Record<string, string> = { MANUAL: "Manual", ONBOARDING: "Onboarding", RENEWAL: "Renewal", BULK: "Bulk" };

export interface NewAssignment {
  employeeIds: string[];
  courseId: string;
  dueDate: string | null;
  reason?: string | null;
  source: "MANUAL" | "ONBOARDING" | "RENEWAL" | "BULK";
  requirementId?: string | null;
  /** Send one notification per assignment (onboarding sends a single summary instead). */
  notifyEach?: boolean;
}

/**
 * Creates assignments, skipping employees who already have an open assignment for the
 * course (unique partial index). Notifies employees who have an academy account.
 */
export async function createAssignments(tx: Tx, ctx: Ctx, a: NewAssignment): Promise<ServiceResult<{ created: { id: string; employeeId: string }[]; skipped: string[]; denied: string[] }>> {
  const today = todayIso();
  if (a.dueDate && a.dueDate < today) return err("The due date cannot be in the past.");
  const [course] = await tx.select({ id: courses.id, title: courses.title, status: courses.status }).from(courses).where(eq(courses.id, a.courseId));
  if (!course) return err("Course not found.");
  if (course.status !== "PUBLISHED") return err("Only published courses can be assigned.");
  const emps = a.employeeIds.length ? await tx.select().from(employees).where(inArray(employees.id, a.employeeIds)) : [];
  if (!emps.length) return err("Choose at least one employee.");

  const created: { id: string; employeeId: string }[] = [];
  const skipped: string[] = [];
  const denied: string[] = [];
  for (const e of emps) {
    if (e.employmentStatus === "TERMINATED") {
      skipped.push(e.id);
      continue;
    }
    // Facility-scoped assigners: the employee must be at one of their facilities (RLS enforces too).
    const facs = await employeeFacilityIds(tx, e.id);
    if (!facs.some((f) => can(ctx.access, "training.assign", f)) && !can(ctx.access, "training.assign", null)) {
      denied.push(e.id);
      continue;
    }
    const rows = await tx
      .insert(trainingAssignments)
      .values({
        tenantId: ctx.tenantId,
        employeeId: e.id,
        courseId: course.id,
        requirementId: a.requirementId ?? null,
        assignedById: ctx.userId,
        source: a.source,
        reason: a.reason?.trim() || null,
        dueDate: a.dueDate,
      })
      .onConflictDoNothing()
      .returning({ id: trainingAssignments.id });
    if (!rows.length) {
      skipped.push(e.id);
      continue;
    }
    created.push({ id: rows[0].id, employeeId: e.id });
    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "assignment.created",
      entityType: "training_assignment",
      entityId: rows[0].id,
      after: { employeeId: e.id, courseId: course.id, dueDate: a.dueDate, source: a.source, requirementId: a.requirementId ?? null },
    });
    if (e.userId && a.notifyEach !== false) {
      await notify(tx, {
        tenantId: ctx.tenantId,
        userId: e.userId,
        type: "assignment.new",
        title: "New training assigned",
        body: `${course.title}${a.dueDate ? ` — due ${a.dueDate}` : ""}. Open My Learning to start.`,
        link: "/learning",
        dedupeKey: `assign:${rows[0].id}`,
      });
    }
  }
  return { ok: true, data: { created, skipped, denied } };
}

async function employeeFacilityIds(tx: Tx, employeeId: string): Promise<string[]> {
  const r = await tx.execute<{ facility_id: string }>(sql`select facility_id from employee_facilities where employee_id = ${employeeId}::uuid`);
  return r.rows.map((x) => x.facility_id);
}

export const bulkAssignSchema = z
  .object({
    courseId: z.string().uuid("Choose a course"),
    mode: z.enum(["employees", "facility", "position", "department"]),
    employeeIds: z.array(z.string().uuid()).default([]),
    facilityId: z.string().uuid().optional().or(z.literal("")),
    positionCode: z.string().trim().max(60).optional().or(z.literal("")),
    departmentId: z.string().uuid().optional().or(z.literal("")),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date"),
    reason: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .superRefine((v, c) => {
    if (v.mode === "employees" && !v.employeeIds.length) c.addIssue({ code: "custom", path: ["employeeIds"], message: "Choose at least one employee" });
    if (v.mode === "facility" && !v.facilityId) c.addIssue({ code: "custom", path: ["facilityId"], message: "Choose a facility" });
    if (v.mode === "position" && !v.positionCode) c.addIssue({ code: "custom", path: ["positionCode"], message: "Enter a position code" });
    if (v.mode === "department" && !v.departmentId) c.addIssue({ code: "custom", path: ["departmentId"], message: "Choose a department" });
  });

/** Resolves a bulk target to current (non-terminated) employees visible to the user. */
export async function resolveTargets(tx: Tx, v: z.infer<typeof bulkAssignSchema>): Promise<string[]> {
  const base = ne(employees.employmentStatus, "TERMINATED");
  const where =
    v.mode === "employees"
      ? and(base, inArray(employees.id, v.employeeIds))
      : v.mode === "facility"
        ? and(base, sql`exists (select 1 from employee_facilities ef where ef.employee_id = ${employees.id} and ef.facility_id = ${v.facilityId}::uuid)`)
        : v.mode === "position"
          ? and(base, eq(employees.positionCode, normalizePositionCode(v.positionCode ?? "")))
          : and(base, eq(employees.departmentId, v.departmentId!));
  return (await tx.select({ id: employees.id }).from(employees).where(where)).map((r) => r.id);
}

export async function bulkAssign(tx: Tx, ctx: Ctx, raw: unknown) {
  const p = bulkAssignSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const ids = await resolveTargets(tx, p.data);
  if (!ids.length) return err("No current employees match that selection.");
  return createAssignments(tx, ctx, { employeeIds: ids, courseId: p.data.courseId, dueDate: p.data.dueDate, reason: p.data.reason || null, source: p.data.mode === "employees" && ids.length === 1 ? "MANUAL" : "BULK" });
}

export async function closeAssignment(tx: Tx, ctx: Ctx, id: string, status: "WAIVED" | "CANCELLED", reason: string): Promise<ServiceResult<null>> {
  const r = reason.trim();
  if (r.length < 10) return err("Explain the reason (at least 10 characters).");
  if (status === "WAIVED" && !can(ctx.access, "training.records.approve")) return err("Waiving required training needs the training-records approval permission.");
  const [a] = await tx.select().from(trainingAssignments).where(eq(trainingAssignments.id, id));
  if (!a) return err("Assignment not found.");
  if (!OPEN.includes(a.status as (typeof OPEN)[number])) return err("Only open assignments can be waived or cancelled.");
  const upd = await tx
    .update(trainingAssignments)
    .set({ status, statusReason: r, closedById: ctx.userId, closedAt: new Date() })
    .where(eq(trainingAssignments.id, id))
    .returning({ id: trainingAssignments.id });
  if (!upd.length) return err("You are not authorized to change this assignment.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: status === "WAIVED" ? "assignment.waived" : "assignment.cancelled", entityType: "training_assignment", entityId: id, before: { status: a.status }, after: { status, reason: r } });
  return { ok: true, data: null };
}

/**
 * Authorized administrative correction of a due date (spec §13). Audited with a reason;
 * an overdue assignment whose new date is in the future returns to its working status.
 */
export async function changeDueDate(tx: Tx, ctx: Ctx, id: string, dueDate: string, reason: string): Promise<ServiceResult<null>> {
  const r = reason.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return err("Choose a valid date.");
  if (r.length < 10) return err("Explain the reason for the change (at least 10 characters).");
  const today = todayIso();
  if (dueDate < today) return err("The new due date cannot be in the past.");
  const [a] = await tx.select().from(trainingAssignments).where(eq(trainingAssignments.id, id));
  if (!a) return err("Assignment not found.");
  if (!OPEN.includes(a.status as (typeof OPEN)[number])) return err("Only open assignments can be rescheduled.");
  let status = a.status;
  if (a.status === "OVERDUE") {
    const [started] = await tx
      .select({ id: enrollments.id })
      .from(enrollments)
      .innerJoin(employees, eq(employees.userId, enrollments.userId))
      .where(and(eq(employees.id, a.employeeId), eq(enrollments.courseId, a.courseId), inArray(enrollments.status, ["IN_PROGRESS", "AWAITING_ASSESSMENT", "FAILED"])))
      .limit(1);
    status = started ? "IN_PROGRESS" : "ASSIGNED";
  }
  const upd = await tx.update(trainingAssignments).set({ dueDate, status, statusReason: r }).where(eq(trainingAssignments.id, id)).returning({ id: trainingAssignments.id });
  if (!upd.length) return err("You are not authorized to change this assignment.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "assignment.due_date_changed", entityType: "training_assignment", entityId: id, before: { dueDate: a.dueDate, status: a.status }, after: { dueDate, status, reason: r } });
  return { ok: true, data: null };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const assignmentFilterSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "OVERDUE", "COMPLETED", "WAIVED", "CANCELLED", "DUE_SOON", "ALL"]).optional(),
  facilityId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  q: z.string().trim().max(100).optional(),
});

export async function listAssignments(tx: Tx, f: z.infer<typeof assignmentFilterSchema> = {}, limit = 1000) {
  const status = f.status ?? "OPEN";
  const today = todayIso();
  return tx
    .select({
      id: trainingAssignments.id,
      status: trainingAssignments.status,
      source: trainingAssignments.source,
      dueDate: trainingAssignments.dueDate,
      completedAt: trainingAssignments.completedAt,
      reason: trainingAssignments.reason,
      statusReason: trainingAssignments.statusReason,
      createdAt: trainingAssignments.createdAt,
      employeeId: employees.id,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeNumber: employees.employeeNumber,
      jobTitle: employees.jobTitle,
      hasAccount: sql<boolean>`${employees.userId} is not null`,
      facilityName: facilities.name,
      courseId: courses.id,
      courseTitle: courses.title,
      courseCode: courses.code,
      progressPct: sql<number | null>`(select en.progress_pct from enrollments en where en.user_id = ${employees.userId} and en.course_id = ${courses.id} order by en.created_at desc limit 1)`,
    })
    .from(trainingAssignments)
    .innerJoin(employees, eq(employees.id, trainingAssignments.employeeId))
    .innerJoin(courses, eq(courses.id, trainingAssignments.courseId))
    .leftJoin(facilities, eq(facilities.id, employees.primaryFacilityId))
    .where(
      and(
        status === "ALL"
          ? undefined
          : status === "OPEN"
            ? inArray(trainingAssignments.status, [...OPEN])
            : status === "DUE_SOON"
              ? and(inArray(trainingAssignments.status, ["ASSIGNED", "IN_PROGRESS"]), sql`${trainingAssignments.dueDate} between ${today}::date and ${addDays(today, 30)}::date`)
              : eq(trainingAssignments.status, status),
        f.employeeId ? eq(trainingAssignments.employeeId, f.employeeId) : undefined,
        f.courseId ? eq(trainingAssignments.courseId, f.courseId) : undefined,
        f.facilityId ? sql`exists (select 1 from employee_facilities ef where ef.employee_id = ${employees.id} and ef.facility_id = ${f.facilityId}::uuid)` : undefined,
        f.q ? or(ilike(courses.title, `%${f.q}%`), sql`(${employees.firstName} || ' ' || ${employees.lastName}) ilike ${"%" + f.q + "%"}`, ilike(employees.employeeNumber, `%${f.q}%`)) : undefined,
      ),
    )
    .orderBy(sql`${trainingAssignments.dueDate} asc nulls last`, asc(employees.lastName))
    .limit(limit);
}

export async function assignmentStats(tx: Tx) {
  const today = todayIso();
  const r = await tx.execute<{ open: number; overdue: number; due_soon: number; completed_30: number }>(sql`
    select count(*) filter (where status in ('ASSIGNED','IN_PROGRESS','OVERDUE'))::int open,
           count(*) filter (where status = 'OVERDUE' or (status in ('ASSIGNED','IN_PROGRESS') and due_date < ${today}::date))::int overdue,
           count(*) filter (where status in ('ASSIGNED','IN_PROGRESS') and due_date between ${today}::date and ${addDays(today, 30)}::date)::int due_soon,
           count(*) filter (where status = 'COMPLETED' and completed_at >= now() - interval '30 days')::int completed_30
      from training_assignments`);
  return r.rows[0];
}

/** The signed-in learner's assignments with their latest enrollment for the course. */
export async function myAssignments(tx: Tx, userId: string) {
  return tx
    .select({
      id: trainingAssignments.id,
      status: trainingAssignments.status,
      dueDate: trainingAssignments.dueDate,
      completedAt: trainingAssignments.completedAt,
      source: trainingAssignments.source,
      courseId: courses.id,
      courseTitle: courses.title,
      courseCode: courses.code,
      estimatedMinutes: courses.estimatedMinutes,
      enrollmentId: sql<string | null>`(select en.id from enrollments en where en.user_id = ${userId}::uuid and en.course_id = ${courses.id} and en.status in ('NOT_STARTED','IN_PROGRESS','AWAITING_ASSESSMENT','FAILED') order by en.created_at desc limit 1)`,
      progressPct: sql<number | null>`(select en.progress_pct from enrollments en where en.user_id = ${userId}::uuid and en.course_id = ${courses.id} order by en.created_at desc limit 1)`,
    })
    .from(trainingAssignments)
    .innerJoin(employees, eq(employees.id, trainingAssignments.employeeId))
    .innerJoin(courses, eq(courses.id, trainingAssignments.courseId))
    .where(eq(employees.userId, userId))
    .orderBy(sql`case when ${trainingAssignments.status} in ('ASSIGNED','IN_PROGRESS','OVERDUE') then 0 else 1 end`, sql`${trainingAssignments.dueDate} asc nulls last`, desc(trainingAssignments.createdAt))
    .limit(200);
}

/** Courses that can be assigned (published, visible to the tenant). */
export async function assignableCourses(tx: Tx) {
  return tx.select({ id: courses.id, title: courses.title, code: courses.code }).from(courses).where(eq(courses.status, "PUBLISHED")).orderBy(asc(courses.title));
}
