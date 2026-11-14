/**
 * Employee onboarding (spec §12, steps 1–11).
 *
 * runOnboarding() performs steps 1–7: identify facility and position, determine the
 * applicable requirements, generate the checklist, assign required courses with
 * deadlines and notify the employee. It is idempotent — re-running after a change of
 * position or facility assigns only what is newly required — and every run is stored
 * as an immutable snapshot for audit.
 *
 * onboardingChecklist() reports all 11 steps live, including progress (8), validated
 * assessments (9), competency approvals (10) and compliance status (11).
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { certificates, employees, enrollments, facilities, notificationPreferences, onboardingRuns, trainingAssignments } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import type { ServiceResult } from "@/lib/tenancy/service";
import { createAssignments } from "./assignments";
import { complianceFor } from "./compliance";
import type { Ctx } from "./employees";
import { applicableRequirements } from "./requirements";
import { COMPLIANCE_LABEL, DUE_SOON_DAYS, addDays, onboardingDueDate, todayIso } from "./rules";

export type OnboardingAction = "ASSIGNED" | "ALREADY_ASSIGNED" | "SATISFIED" | "NEEDS_REVIEW" | "COURSE_UNAVAILABLE" | "COMPETENCY_REQUIRED" | "COMPETENCY_CURRENT";
export interface OnboardingResult {
  requirementId: string;
  title: string;
  kind: "course" | "competency";
  targetId: string;
  targetName: string;
  action: OnboardingAction;
  assignmentId?: string;
  dueDate?: string;
  note?: string;
}

export const ACTION_LABELS: Record<OnboardingAction, { label: string; tone: "green" | "amber" | "red" | "blue" | "gray" | "teal" }> = {
  ASSIGNED: { label: "Assigned", tone: "blue" },
  ALREADY_ASSIGNED: { label: "Already assigned", tone: "teal" },
  SATISFIED: { label: "Satisfied (current certificate)", tone: "green" },
  NEEDS_REVIEW: { label: "Needs administrator review", tone: "amber" },
  COURSE_UNAVAILABLE: { label: "Course not published", tone: "red" },
  COMPETENCY_REQUIRED: { label: "Skills evaluation required", tone: "amber" },
  COMPETENCY_CURRENT: { label: "Skills evaluation current", tone: "green" },
};

export async function tenantSettings(tx: Tx) {
  const [p] = await tx.select().from(notificationPreferences).limit(1);
  return {
    expiryLeadDays: p?.expiryLeadDays ?? [90, 60, 30, 15, 7],
    emailEnabled: p?.emailEnabled ?? true,
    escalateAfterDays: p?.escalateAfterDays ?? 7,
    renewalWindowDays: p?.renewalWindowDays ?? 60,
    defaultDueDays: p?.defaultDueDays ?? 30,
  };
}

export async function runOnboarding(tx: Tx, ctx: Ctx, employeeId: string): Promise<ServiceResult<{ runId: string; results: OnboardingResult[]; assigned: number }>> {
  const { facts, requirements } = await applicableRequirements(tx, employeeId);
  if (!facts) return { ok: false, error: "Employee not found." };
  if (facts.employmentStatus === "TERMINATED") return { ok: false, error: "Terminated employees are not onboarded." };
  if (!facts.primaryFacilityId) return { ok: false, error: "Set the employee's primary facility first (step 1)." };
  const settings = await tenantSettings(tx);
  const today = todayIso();
  const results: OnboardingResult[] = [];

  for (const { r, courseTitle, courseStatus, competencyName } of requirements) {
    if (r.competencyId) {
      const latest = await tx.execute<{ result: string; next_due: string | null }>(sql`
        select result::text, next_assessment_due::text next_due from competency_assessments
         where employee_id = ${employeeId}::uuid and competency_id = ${r.competencyId}::uuid and status = 'SIGNED'
         order by assessed_on desc, signed_at desc limit 1`);
      const l = latest.rows[0];
      const current = l && l.result === "PASS" && (!l.next_due || l.next_due >= today);
      results.push({ requirementId: r.id, title: r.title ?? competencyName ?? "Skills evaluation", kind: "competency", targetId: r.competencyId, targetName: competencyName ?? "", action: current ? "COMPETENCY_CURRENT" : "COMPETENCY_REQUIRED" });
      continue;
    }
    const courseId = r.courseId!;
    const base = { requirementId: r.id, title: r.title ?? courseTitle ?? "Course", kind: "course" as const, targetId: courseId, targetName: courseTitle ?? "" };
    if (courseStatus !== "PUBLISHED") {
      results.push({ ...base, action: "COURSE_UNAVAILABLE", note: "The course must be published before it can be assigned." });
      continue;
    }
    if (facts.userId) {
      const [cert] = await tx
        .select({ id: certificates.id, expiresOn: certificates.expiresOn })
        .from(certificates)
        .where(and(eq(certificates.userId, facts.userId), eq(certificates.courseId, courseId), eq(certificates.status, "ACTIVE"), sql`(${certificates.expiresOn} is null or ${certificates.expiresOn} > ${addDays(today, DUE_SOON_DAYS)}::date)`))
        .limit(1);
      if (cert) {
        results.push({ ...base, action: "SATISFIED", note: cert.expiresOn ? `Certificate valid until ${cert.expiresOn}.` : "Certificate does not expire." });
        continue;
      }
    }
    const [open] = await tx
      .select({ id: trainingAssignments.id, dueDate: trainingAssignments.dueDate })
      .from(trainingAssignments)
      .where(and(eq(trainingAssignments.employeeId, employeeId), eq(trainingAssignments.courseId, courseId), inArray(trainingAssignments.status, ["ASSIGNED", "IN_PROGRESS", "OVERDUE"])));
    if (open) {
      results.push({ ...base, action: "ALREADY_ASSIGNED", assignmentId: open.id, dueDate: open.dueDate ?? undefined });
      continue;
    }
    if (r.needsAdminReview) {
      results.push({ ...base, action: "NEEDS_REVIEW", note: "Flagged for administrator review before assignment." });
      continue;
    }
    const due = onboardingDueDate(facts.hireDate, r.dueWithinDaysOfHire, settings.defaultDueDays, today);
    const c = await createAssignments(tx, ctx, { employeeIds: [employeeId], courseId, dueDate: due.dueDate, reason: `Required: ${base.title}`, source: "ONBOARDING", requirementId: r.id, notifyEach: false });
    if (!c.ok) return c;
    if (!c.data.created.length) {
      results.push({ ...base, action: c.data.denied.length ? "NEEDS_REVIEW" : "ALREADY_ASSIGNED", note: c.data.denied.length ? "You are not authorized to assign training to this employee." : undefined });
      continue;
    }
    results.push({ ...base, action: "ASSIGNED", assignmentId: c.data.created[0].id, dueDate: due.dueDate, note: due.note });
  }

  const assigned = results.filter((x) => x.action === "ASSIGNED").length;
  let notifiedAt: Date | null = null;
  if (facts.userId && assigned > 0) {
    await notify(tx, {
      tenantId: ctx.tenantId,
      userId: facts.userId,
      type: "assignment.onboarding",
      title: "Your required training plan is ready",
      body: `${assigned} required course${assigned === 1 ? " has" : "s have"} been assigned to you. Open My Learning to see due dates.`,
      link: "/learning",
    });
    notifiedAt = new Date();
  }
  const [row] = await tx
    .insert(onboardingRuns)
    .values({ tenantId: ctx.tenantId, employeeId, runById: ctx.userId, results, assignedCount: assigned, notifiedAt })
    .returning({ id: onboardingRuns.id });
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "employee.onboarding_run", entityType: "employee", entityId: employeeId, after: { runId: row.id, applicable: results.length, assigned } });
  return { ok: true, data: { runId: row.id, results, assigned } };
}

export type StepState = "done" | "in_progress" | "pending" | "attention";
export interface ChecklistStep {
  n: number;
  title: string;
  state: StepState;
  detail: string;
}

/** Live 11-step onboarding checklist (spec §12). */
export async function onboardingChecklist(tx: Tx, employeeId: string): Promise<{ steps: ChecklistStep[]; lastRun: typeof onboardingRuns.$inferSelect | null } | null> {
  const [e] = await tx.select().from(employees).where(eq(employees.id, employeeId));
  if (!e) return null;
  const [fac] = e.primaryFacilityId ? await tx.select({ name: facilities.name }).from(facilities).where(eq(facilities.id, e.primaryFacilityId)) : [];
  const [lastRun] = await tx.select().from(onboardingRuns).where(eq(onboardingRuns.employeeId, employeeId)).orderBy(desc(onboardingRuns.createdAt)).limit(1);
  const results = (lastRun?.results ?? []) as OnboardingResult[];
  const courseReqs = results.filter((r) => r.kind === "course");
  const compReqs = results.filter((r) => r.kind === "competency");

  const required = await tx
    .select({ id: trainingAssignments.id, status: trainingAssignments.status, dueDate: trainingAssignments.dueDate, courseId: trainingAssignments.courseId })
    .from(trainingAssignments)
    .where(and(eq(trainingAssignments.employeeId, employeeId), inArray(trainingAssignments.status, ["ASSIGNED", "IN_PROGRESS", "OVERDUE", "COMPLETED"])));
  const open = required.filter((a) => a.status !== "COMPLETED");
  const completed = required.filter((a) => a.status === "COMPLETED");
  const reqCourseIds = new Set(courseReqs.map((r) => r.targetId));
  const passedForRequired = e.userId && reqCourseIds.size
    ? (await tx.select({ courseId: enrollments.courseId }).from(enrollments).where(and(eq(enrollments.userId, e.userId), eq(enrollments.status, "COMPLETED"), inArray(enrollments.courseId, [...reqCourseIds])))).map((x) => x.courseId)
    : [];
  const passedSet = new Set(passedForRequired);
  const today = todayIso();
  const compRows = compReqs.length
    ? (await tx.execute<{ competency_id: string; result: string; next_due: string | null }>(sql`
        select distinct on (competency_id) competency_id, result::text, next_assessment_due::text next_due from competency_assessments
         where employee_id = ${employeeId}::uuid and status = 'SIGNED'
         order by competency_id, assessed_on desc, signed_at desc`)).rows
    : [];
  const compCurrent = compRows.filter((x) => x.result === "PASS" && (!x.next_due || x.next_due >= today)).map((x) => x.competency_id);
  const compSet = new Set(compCurrent);
  const status = (await complianceFor(tx, [employeeId])).get(employeeId)!;

  const steps: ChecklistStep[] = [];
  steps.push({ n: 1, title: "Identify the facility", state: fac ? "done" : "attention", detail: fac ? fac.name : "No primary facility set." });
  steps.push({ n: 2, title: "Identify the job position", state: e.positionCode ? "done" : "attention", detail: `${e.jobTitle} (${e.positionCode})${e.clinicalExposure ? " · clinical exposure" : ""}${e.bloodborneExposure ? " · bloodborne exposure" : ""}` });
  steps.push({ n: 3, title: "Determine applicable training requirements", state: lastRun ? "done" : "pending", detail: lastRun ? `${results.length} requirement${results.length === 1 ? "" : "s"} apply (evaluated ${lastRun.createdAt.toISOString().slice(0, 10)}).` : "Requirements not evaluated yet — run onboarding." });
  steps.push({ n: 4, title: "Generate the training checklist", state: lastRun ? "done" : "pending", detail: lastRun ? `${courseReqs.length} course${courseReqs.length === 1 ? "" : "s"}, ${compReqs.length} skills evaluation${compReqs.length === 1 ? "" : "s"}.` : "Pending." });
  const unassigned = courseReqs.filter((r) => r.action === "NEEDS_REVIEW" || r.action === "COURSE_UNAVAILABLE");
  steps.push({ n: 5, title: "Assign required courses", state: !lastRun ? "pending" : unassigned.length ? "attention" : "done", detail: !lastRun ? "Pending." : unassigned.length ? `${unassigned.length} requirement(s) need review before assignment.` : `${courseReqs.filter((r) => r.action === "ASSIGNED" || r.action === "ALREADY_ASSIGNED").length} assigned, ${courseReqs.filter((r) => r.action === "SATISFIED").length} already satisfied.` });
  const noDue = open.filter((a) => !a.dueDate).length;
  steps.push({ n: 6, title: "Set deadlines", state: !required.length ? "pending" : noDue ? "attention" : "done", detail: !required.length ? "No assignments yet." : noDue ? `${noDue} open assignment(s) without a due date.` : "Every open assignment has a due date." });
  steps.push({
    n: 7,
    title: "Notify the employee",
    state: !e.userId ? "attention" : lastRun?.notifiedAt || (lastRun && lastRun.assignedCount === 0) ? "done" : "pending",
    detail: !e.userId ? "The employee has no academy account yet — provision one so they can be notified and start training." : lastRun?.notifiedAt ? `Notified ${lastRun.notifiedAt.toISOString().slice(0, 10)} (in-app and email per preferences).` : lastRun ? "No new assignments to announce." : "Pending.",
  });
  const total = open.length + completed.length;
  steps.push({ n: 8, title: "Monitor progress", state: !total ? "pending" : open.length === 0 ? "done" : "in_progress", detail: total ? `${completed.length} of ${total} assignment(s) completed${status.counts.overdueAssignments ? `, ${status.counts.overdueAssignments} overdue` : ""}.` : "No assignments yet." });
  const reqCourses = courseReqs.filter((r) => r.action !== "COURSE_UNAVAILABLE");
  steps.push({ n: 9, title: "Validate assessments", state: !reqCourses.length ? "pending" : reqCourses.every((r) => passedSet.has(r.targetId) || r.action === "SATISFIED") ? "done" : "in_progress", detail: reqCourses.length ? `${reqCourses.filter((r) => passedSet.has(r.targetId) || r.action === "SATISFIED").length} of ${reqCourses.length} required course(s) completed with all mandatory exams passed.` : "No required courses." });
  steps.push({ n: 10, title: "Record competency approvals", state: !compReqs.length ? "done" : compReqs.every((r) => compSet.has(r.targetId)) ? "done" : "in_progress", detail: compReqs.length ? `${compReqs.filter((r) => compSet.has(r.targetId)).length} of ${compReqs.length} required skills evaluation(s) signed and current.` : "No skills evaluations required by the organization's requirements." });
  const st = COMPLIANCE_LABEL[status.status];
  steps.push({ n: 11, title: "Update compliance status", state: status.status === "COMPLIANT" ? "done" : status.status === "NON_COMPLIANT" ? "attention" : status.status === "AT_RISK" ? "in_progress" : "pending", detail: `${st.label}.` });
  return { steps, lastRun: lastRun ?? null };
}
