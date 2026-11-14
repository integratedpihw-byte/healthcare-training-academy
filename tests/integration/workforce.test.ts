/**
 * Phase 4 — workforce management: facility/team scoping in the database, employee
 * profiles, onboarding, assignments and their integrity rules, the renewal engine,
 * notifications privacy and email delivery.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import {
  certificates,
  competencies,
  courseCategories,
  emailOutbox,
  employeeFacilities,
  employees,
  enrollments,
  facilities,
  licenses,
  notificationPreferences,
  notifications,
  onboardingRuns,
  trainingAssignments,
  users,
} from "@/db/schema";
import { addLesson, addModule, createCourse, decide, getBuilderCourse, setObjectives, submitForReview, type AuthorScope } from "@/lib/learning/builder";
import { enroll, getPlayer, recordProgress } from "@/lib/learning/learner";
import { issueForEnrollment } from "@/lib/certificates/service";
import { can, loadAccess } from "@/lib/rbac/access";
import { addEmployeeFacility, createEmployee, provisionEmployeeAccount, updateEmployee } from "@/lib/workforce/employees";
import { saveLicense, verifyLicense } from "@/lib/workforce/licenses";
import { saveRequirement } from "@/lib/workforce/requirements";
import { runOnboarding, onboardingChecklist } from "@/lib/workforce/onboarding";
import { bulkAssign, changeDueDate, closeAssignment, createAssignments, listAssignments } from "@/lib/workforce/assignments";
import { complianceFor } from "@/lib/workforce/compliance";
import { runRenewalEngine } from "@/lib/workforce/renewal";
import { saveOrgPrefs, saveUserSettings, sendAnnouncement } from "@/lib/workforce/communication";
import { deliverPendingEmails } from "@/lib/notify/delivery";
import { consoleOutbox } from "@/lib/notify/email";
import { notify } from "@/lib/notify/notifications";
import { addDays, todayIso } from "@/lib/workforce/rules";
import { addMember, createTenant, expectPgError, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
let O: TenantFixture;
let facB: string;
let director: { userId: string };
let reviewer: { userId: string };
let facAdminA: { userId: string };
let supervisorUser: { userId: string };
let courseId: string; // no expiry
let renewCourseId: string; // 12-month renewal
let supEmpId: string;
let reportEmpId: string;
let otherEmpId: string;
let empB: string;
let reportUser: string;

const today = todayIso();
/** Test-only data surgery as the table owner (e.g. backdating identity columns guarded by triggers). */
async function asOwner(sqlText: string) {
  const { Client } = await import("pg");
  const c = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
  await c.connect();
  try {
    await c.query(sqlText);
  } finally {
    await c.end();
  }
}
const as = (userId: string, t: TenantFixture = T) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: t.tenantId, userId }, fn);
async function ctxFor(userId: string, t: TenantFixture = T) {
  const access = (await as(userId, t)((tx) => loadAccess(tx, t.tenantId, userId)))!;
  return { tenantId: t.tenantId, userId, access };
}
async function scope<R>(userId: string, fn: (s: AuthorScope) => Promise<R>) {
  return as(userId)(async (tx) => {
    const access = await loadAccess(tx, T.tenantId, userId);
    return fn({ db: tx, tenantId: T.tenantId, userId, can: (p) => can(access, p) });
  });
}

async function buildCourse(code: string, renewalMonths: string | null) {
  const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "facility-programs"));
  const r = await scope(director.userId, (s) => createCourse(s, { code, title: `Course ${code}`, categoryId: cat.id, passingScore: 80, estimatedMinutes: 15, renewalMonths, description: "Course used by workforce integration tests.", targetAudience: "All", certificateEligible: true }));
  if (!r.ok) throw new Error(r.error);
  const id = r.data.courseId;
  const b = (await scope(director.userId, (s) => getBuilderCourse(s, id)))!;
  await scope(director.userId, (s) => setObjectives(s, b.working.id, "Complete the lesson"));
  const m = await scope(director.userId, (s) => addModule(s, b.working.id, { title: "Module" }));
  if (!m.ok) throw new Error(m.error);
  await scope(director.userId, (s) => addLesson(s, m.data.id, { title: "Lesson", type: "TEXT", body: "Read this lesson body.", durationMinutes: 5 }));
  expect((await scope(director.userId, (s) => submitForReview(s, id))).ok).toBe(true);
  for (let i = 0; i < 3; i++) {
    const d = await scope(reviewer.userId, (s) => decide(s, id, { decision: "APPROVED", comments: "ok" }));
    if (!d.ok) throw new Error(d.error);
  }
  return id;
}

async function completeCourse(userId: string, cid: string) {
  const enrollmentId = await as(userId)(async (tx) => {
    const e = await enroll(tx, { tenantId: T.tenantId, userId }, cid);
    if (!e.ok) throw new Error(e.error);
    const p = (await getPlayer(tx, e.data.enrollmentId, userId))!;
    for (const l of p.flat) {
      const r = await recordProgress(tx, { tenantId: T.tenantId, userId }, { enrollmentId: e.data.enrollmentId, lessonId: l.id, complete: true });
      if (!r.ok) throw new Error(r.error);
    }
    return e.data.enrollmentId;
  });
  await issueForEnrollment(systemDb(), enrollmentId);
  return enrollmentId;
}

async function newEmployee(actor: string, values: Record<string, unknown>) {
  const ctx = await ctxFor(actor);
  const r = await as(actor)((tx) => createEmployee(tx, ctx, { jobTitle: "Caregiver", positionCode: "CAREGIVER", hireDate: today, primaryFacilityId: T.facilityId, ...values }));
  if (!r.ok) throw new Error(`${r.error} ${JSON.stringify(r.fieldErrors)}`);
  return r.data.id;
}

beforeAll(async () => {
  T = await createTenant("work");
  O = await createTenant("workother");
  const sys = systemDb();
  const [org] = await sys.select({ id: facilities.organizationId }).from(facilities).where(eq(facilities.id, T.facilityId));
  [{ id: facB }] = await sys.insert(facilities).values({ tenantId: T.tenantId, organizationId: org.id, name: "Clinic B", facilityType: "CLINIC" }).returning({ id: facilities.id });
  director = await addMember(T, "training_director");
  reviewer = await addMember(T, "org_admin");
  facAdminA = await addMember(T, "facility_admin", T.facilityId);
  supervisorUser = await addMember(T, "supervisor");
  courseId = await buildCourse("WF-ORIENT", null);
  renewCourseId = await buildCourse("WF-ANNUAL", "12");

  supEmpId = await newEmployee(T.adminUserId, { employeeNumber: "S-1", firstName: "Sue", lastName: "Pervisor", positionCode: "SUPERVISOR" });
  await sys.update(employees).set({ userId: supervisorUser.userId }).where(eq(employees.id, supEmpId));
  reportEmpId = await newEmployee(T.adminUserId, { employeeNumber: "R-1", firstName: "Rita", lastName: "Report", email: `rita-${Date.now()}@test.example`, supervisorId: supEmpId, clinicalExposure: true, bloodborneExposure: true });
  otherEmpId = await newEmployee(T.adminUserId, { employeeNumber: "O-1", firstName: "Otto", lastName: "Other" });
  empB = await newEmployee(T.adminUserId, { employeeNumber: "B-1", firstName: "Bea", lastName: "Clinic", primaryFacilityId: facB, positionCode: "MEDICAL_ASSISTANT" });
});
afterAll(() => closePools());

describe("facility and team scoping (database)", () => {
  it("a Facility Administrator sees only employees assigned to their facility", async () => {
    const ids = await as(facAdminA.userId)(async (tx) => (await tx.select({ id: employees.id }).from(employees)).map((r) => r.id));
    expect(ids).toContain(reportEmpId);
    expect(ids).not.toContain(empB);
    // Multi-facility assignment by an org admin makes Bea visible.
    const ctx = await ctxFor(T.adminUserId);
    expect((await as(T.adminUserId)((tx) => addEmployeeFacility(tx, ctx, empB, T.facilityId))).ok).toBe(true);
    const after = await as(facAdminA.userId)(async (tx) => (await tx.select({ id: employees.id }).from(employees)).map((r) => r.id));
    expect(after).toContain(empB);
    await systemDb().delete(employeeFacilities).where(and(eq(employeeFacilities.employeeId, empB), eq(employeeFacilities.facilityId, T.facilityId)));
  });

  it("a Facility Administrator cannot create or move employees into another facility", async () => {
    const ctx = await ctxFor(facAdminA.userId);
    const svc = await as(facAdminA.userId)((tx) => createEmployee(tx, ctx, { employeeNumber: "X-1", firstName: "X", lastName: "Y", jobTitle: "MA", positionCode: "MA", hireDate: today, primaryFacilityId: facB }));
    expect(svc.ok).toBe(false);
    const [org] = await systemDb().select({ id: facilities.organizationId }).from(facilities).where(eq(facilities.id, T.facilityId));
    const e = await expectPgError(as(facAdminA.userId)((tx) => tx.insert(employees).values({ tenantId: T.tenantId, organizationId: org.id, employeeNumber: "X-2", firstName: "X", lastName: "Y", jobTitle: "MA", positionCode: "MA", hireDate: today, primaryFacilityId: facB })));
    expect(e.message).toMatch(/row-level security/);
    const moved = await as(facAdminA.userId)((tx) => tx.update(employees).set({ primaryFacilityId: facB }).where(eq(employees.id, otherEmpId)).returning({ id: employees.id })).catch((x) => x as Error);
    expect(moved instanceof Error || (Array.isArray(moved) && moved.length === 0)).toBe(true);
    const updated = await as(facAdminA.userId)((tx) => tx.update(employees).set({ jobTitle: "Lead" }).where(eq(employees.id, empB)).returning({ id: employees.id }));
    expect(updated).toHaveLength(0); // invisible → not updatable
  });

  it("a Supervisor sees direct reports only (team.view), not other staff", async () => {
    const ids = await as(supervisorUser.userId)(async (tx) => (await tx.select({ id: employees.id }).from(employees)).map((r) => r.id));
    expect(ids.sort()).toEqual([supEmpId, reportEmpId].sort());
    const access = (await ctxFor(supervisorUser.userId)).access;
    expect(can(access, "team.view")).toBe(true);
    expect(can(access, "employees.view")).toBe(false);
  });

  it("other tenants never see this tenant's employees", async () => {
    const n = await as(O.adminUserId, O)(async (tx) => (await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, reportEmpId))).length);
    expect(n).toBe(0);
  });
});

describe("employee profiles and accounts", () => {
  it("validates duplicate employee IDs and circular reporting lines", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const dup = await as(T.adminUserId)((tx) => createEmployee(tx, ctx, { employeeNumber: "R-1", firstName: "A", lastName: "B", jobTitle: "x", positionCode: "CNA", hireDate: today, primaryFacilityId: T.facilityId }));
    expect(dup.ok).toBe(false);
    const [sup] = await systemDb().select().from(employees).where(eq(employees.id, supEmpId));
    const cyc = await as(T.adminUserId)((tx) => updateEmployee(tx, ctx, supEmpId, { ...sup, email: sup.email ?? "", phone: "", terminationDate: "", departmentId: "", trainingPathway: "", supervisorId: reportEmpId }));
    expect(cyc.ok).toBe(false);
    if (!cyc.ok) expect(cyc.error).toMatch(/circular/);
    const term = await as(T.adminUserId)((tx) => createEmployee(tx, ctx, { employeeNumber: "T-9", firstName: "A", lastName: "B", jobTitle: "x", positionCode: "CNA", hireDate: today, primaryFacilityId: T.facilityId, employmentStatus: "TERMINATED" }));
    expect(term.ok).toBe(false);
  });

  it("a Facility Administrator can provision a learner account for their staff (least privilege)", async () => {
    const ctx = await ctxFor(facAdminA.userId);
    const r = await as(facAdminA.userId)((tx) => provisionEmployeeAccount(systemDb(), tx, ctx, reportEmpId));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    reportUser = r.data.userId;
    const roles = await systemDb().execute<{ key: string }>(sql`select r.key from membership_roles mr join memberships m on m.id = mr.membership_id join roles r on r.id = mr.role_id where m.user_id = ${reportUser}::uuid and m.tenant_id = ${T.tenantId}::uuid`);
    expect(roles.rows.map((x) => x.key)).toEqual(["learner"]);
    const again = await as(facAdminA.userId)((tx) => provisionEmployeeAccount(systemDb(), tx, ctx, reportEmpId));
    expect(again.ok).toBe(false);
  });
});

describe("licenses", () => {
  it("verification requires a source; a new expiration date resets verification", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const r = await as(T.adminUserId)((tx) => saveLicense(tx, ctx, reportEmpId, { kind: "STATE_PROFESSIONAL_LICENSE", name: "CNA", licenseNumber: "CNA1", issuingAuthority: "Board", state: "FL", issuedOn: "2025-01-01", expiresOn: addDays(today, 100) }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((await as(T.adminUserId)((tx) => verifyLicense(tx, ctx, r.data.id, "VERIFIED", ""))).ok).toBe(false);
    const e = await expectPgError(as(T.adminUserId)((tx) => tx.update(licenses).set({ verificationStatus: "VERIFIED", verifiedAt: new Date(), verifiedById: T.adminUserId }).where(eq(licenses.id, r.data.id))));
    expect(e.message).toMatch(/verification source/);
    expect((await as(T.adminUserId)((tx) => verifyLicense(tx, ctx, r.data.id, "VERIFIED", "State board online lookup"))).ok).toBe(true);
    await as(T.adminUserId)((tx) => tx.update(licenses).set({ expiresOn: addDays(today, 800) }).where(eq(licenses.id, r.data.id)));
    const [l] = await systemDb().select().from(licenses).where(eq(licenses.id, r.data.id));
    expect(l.verificationStatus).toBe("UNVERIFIED");
    // Supervisor sees the report's license; facility admin of another facility would not.
    const seen = await as(supervisorUser.userId)(async (tx) => (await tx.select().from(licenses).where(eq(licenses.employeeId, reportEmpId))).length);
    expect(seen).toBe(1);
  });
});

describe("onboarding and requirements", () => {
  it("assigns applicable courses with deadlines, flags review items and competency requirements, and is idempotent", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const [hh] = await systemDb().select().from(competencies).where(eq(competencies.code, "COMP-HH"));
    const reqs = [
      { title: "Orientation — all staff", target: "course", courseId, source: "ORGANIZATIONAL_POLICY", dueWithinDaysOfHire: "14" },
      { title: "Annual — bloodborne exposure", target: "course", courseId: renewCourseId, source: "ORGANIZATIONAL_POLICY", requiresBloodborneExposure: true, needsAdminReview: true },
      { title: "Hand hygiene skills — clinical", target: "competency", competencyId: hh.id, source: "ORGANIZATIONAL_POLICY", requiresClinicalExposure: true },
      { title: "Clinic only", target: "course", courseId, source: "ORGANIZATIONAL_POLICY", facilityTypes: ["CLINIC"] },
    ];
    for (const r of reqs) expect((await as(director.userId)((tx) => saveRequirement(tx, ctx, r))).ok).toBe(true);
    const learnerReq = await as(reportUser)(async (tx) => saveRequirement(tx, await ctxFor(reportUser), reqs[0]));
    expect(learnerReq.ok).toBe(false);

    const run = await as(T.adminUserId)((tx) => runOnboarding(tx, ctx, reportEmpId));
    expect(run.ok).toBe(true);
    if (!run.ok) return;
    const byTitle = Object.fromEntries(run.data.results.map((r) => [r.title, r]));
    expect(byTitle["Orientation — all staff"].action).toBe("ASSIGNED");
    expect(byTitle["Orientation — all staff"].dueDate).toBe(addDays(today, 14));
    expect(byTitle["Annual — bloodborne exposure"].action).toBe("NEEDS_REVIEW");
    expect(byTitle["Hand hygiene skills — clinical"].action).toBe("COMPETENCY_REQUIRED");
    expect(byTitle["Clinic only"]).toBeUndefined(); // ALF employee
    expect(run.data.assigned).toBe(1);
    // Employee notified once with a summary (not per assignment).
    const notes = await systemDb().select().from(notifications).where(and(eq(notifications.userId, reportUser), eq(notifications.tenantId, T.tenantId)));
    expect(notes.filter((n) => n.type === "assignment.onboarding")).toHaveLength(1);
    expect(notes.filter((n) => n.type === "assignment.new")).toHaveLength(0);

    const again = await as(T.adminUserId)((tx) => runOnboarding(tx, ctx, reportEmpId));
    expect(again.ok && again.data.assigned).toBe(0);
    if (again.ok) expect(again.data.results.find((r) => r.title === "Orientation — all staff")?.action).toBe("ALREADY_ASSIGNED");

    const list = await as(T.adminUserId)((tx) => onboardingChecklist(tx, reportEmpId));
    expect(list?.steps).toHaveLength(11);
    expect(list?.steps[6].state).toBe("done"); // notified
    // Snapshots are immutable.
    const upd = await expectPgError(as(T.adminUserId)((tx) => tx.update(onboardingRuns).set({ assignedCount: 99 }).where(eq(onboardingRuns.employeeId, reportEmpId))));
    expect(upd.code).toBe("42501");
  });

  it("a Facility Administrator cannot assign training to employees outside their facility", async () => {
    const ctx = await ctxFor(facAdminA.userId);
    const r = await as(facAdminA.userId)((tx) => createAssignments(tx, ctx, { employeeIds: [empB], courseId, dueDate: addDays(today, 10), source: "MANUAL" }));
    expect(r.ok ? r.data.created.length : 0).toBe(0); // empB invisible → nothing assigned
    const e = await expectPgError(as(facAdminA.userId)((tx) => tx.insert(trainingAssignments).values({ tenantId: T.tenantId, employeeId: empB, courseId, dueDate: addDays(today, 10) })));
    expect(e.message).toMatch(/row-level security/);
  });
});

describe("assignment lifecycle and integrity", () => {
  it("follows the enrollment: in progress when started, completed only by a completed enrollment", async () => {
    const [a] = await systemDb().select().from(trainingAssignments).where(and(eq(trainingAssignments.employeeId, reportEmpId), eq(trainingAssignments.courseId, courseId)));
    expect(a.status).toBe("ASSIGNED");
    // Manual completion is refused by the database.
    const e = await expectPgError(as(T.adminUserId)((tx) => tx.update(trainingAssignments).set({ status: "COMPLETED" }).where(eq(trainingAssignments.id, a.id))));
    expect(e.message).toMatch(/completed only by a completed course enrollment/);
    await completeCourse(reportUser, courseId);
    const [done] = await systemDb().select().from(trainingAssignments).where(eq(trainingAssignments.id, a.id));
    expect(done.status).toBe("COMPLETED");
    expect(done.completedAt).not.toBeNull();
    // Closed assignments cannot be reopened or deleted.
    const r = await expectPgError(as(T.adminUserId)((tx) => tx.update(trainingAssignments).set({ status: "ASSIGNED", completedAt: null }).where(eq(trainingAssignments.id, a.id))));
    expect(r.message).toMatch(/closed training assignments cannot be changed/);
    const del = await as(T.adminUserId)((tx) => tx.delete(trainingAssignments).where(eq(trainingAssignments.id, a.id)).returning({ id: trainingAssignments.id }));
    expect(del).toHaveLength(0);
    // Supervisor sees the report's completed assignment and enrollment; not Otto's.
    const sees = await as(supervisorUser.userId)(async (tx) => ({
      a: (await tx.select().from(trainingAssignments).where(eq(trainingAssignments.employeeId, reportEmpId))).length,
      e: (await tx.select().from(enrollments).where(eq(enrollments.userId, reportUser))).length,
      c: (await tx.select().from(certificates).where(eq(certificates.userId, reportUser))).length,
    }));
    expect(sees.a).toBeGreaterThan(0);
    expect(sees.e).toBe(1);
    expect(sees.c).toBe(1);
  });

  it("bulk assigns by facility, skips duplicates, and requires reasons for waive/cancel; only published courses", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const r = await as(T.adminUserId)((tx) => bulkAssign(tx, ctx, { courseId: renewCourseId, mode: "facility", facilityId: T.facilityId, dueDate: addDays(today, 20), reason: "Annual in-service" }));
    expect(r.ok).toBe(true);
    const again = await as(T.adminUserId)((tx) => bulkAssign(tx, ctx, { courseId: renewCourseId, mode: "facility", facilityId: T.facilityId, dueDate: addDays(today, 20) }));
    expect(again.ok && again.data.created.length).toBe(0);
    const [a] = await systemDb().select().from(trainingAssignments).where(and(eq(trainingAssignments.employeeId, otherEmpId), eq(trainingAssignments.courseId, renewCourseId)));
    expect((await as(T.adminUserId)((tx) => closeAssignment(tx, ctx, a.id, "CANCELLED", "short"))).ok).toBe(false);
    const raw = await expectPgError(as(T.adminUserId)((tx) => tx.update(trainingAssignments).set({ status: "CANCELLED" }).where(eq(trainingAssignments.id, a.id))));
    expect(raw.message).toMatch(/requires a reason/);
    expect((await as(T.adminUserId)((tx) => closeAssignment(tx, ctx, a.id, "CANCELLED", "Assigned in error during test"))).ok).toBe(true);
    const past = await as(T.adminUserId)((tx) => createAssignments(tx, ctx, { employeeIds: [otherEmpId], courseId, dueDate: addDays(today, -1), source: "MANUAL" }));
    expect(past.ok).toBe(false);
  });

  it("an overdue assignment returns to its working status after an audited due-date correction", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const [a] = await systemDb().select().from(trainingAssignments).where(and(eq(trainingAssignments.employeeId, reportEmpId), eq(trainingAssignments.courseId, renewCourseId)));
    await systemDb().update(trainingAssignments).set({ dueDate: addDays(today, -3) }).where(eq(trainingAssignments.id, a.id));
    await runRenewalEngine(systemDb());
    const [over] = await systemDb().select().from(trainingAssignments).where(eq(trainingAssignments.id, a.id));
    expect(over.status).toBe("OVERDUE");
    expect((await as(T.adminUserId)((tx) => changeDueDate(tx, ctx, a.id, addDays(today, 10), "x"))).ok).toBe(false);
    expect((await as(T.adminUserId)((tx) => changeDueDate(tx, ctx, a.id, addDays(today, 10), "Approved leave of absence"))).ok).toBe(true);
    const [fixed] = await systemDb().select().from(trainingAssignments).where(eq(trainingAssignments.id, a.id));
    expect(fixed.status).toBe("ASSIGNED");
    const audit = await systemDb().execute<{ n: number }>(sql`select count(*)::int n from audit_logs where entity_id = ${a.id} and action = 'assignment.due_date_changed'`);
    expect(audit.rows[0].n).toBe(1);
  });
});

describe("renewal and expiration engine", () => {
  it("notifies the employee and supervisor when overdue, escalates after the delay, and never duplicates", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const r = await as(T.adminUserId)((tx) => createAssignments(tx, ctx, { employeeIds: [reportEmpId], courseId: renewCourseId, dueDate: addDays(today, 5), source: "MANUAL" }));
    // Already open from the bulk assignment → skipped; use that one.
    expect(r.ok).toBe(true);
    const [a] = await systemDb().select().from(trainingAssignments).where(and(eq(trainingAssignments.employeeId, reportEmpId), eq(trainingAssignments.courseId, renewCourseId), eq(trainingAssignments.status, "ASSIGNED")));
    await systemDb().update(trainingAssignments).set({ dueDate: addDays(today, -8) }).where(eq(trainingAssignments.id, a.id));
    await runRenewalEngine(systemDb());
    await runRenewalEngine(systemDb());
    const keyed = await systemDb().select({ key: notifications.dedupeKey, userId: notifications.userId }).from(notifications).where(sql`${notifications.dedupeKey} like ${"%" + a.id + "%"}`);
    expect(keyed.filter((k) => k.key === `overdue:${a.id}` && k.userId === reportUser)).toHaveLength(1);
    expect(keyed.filter((k) => k.key === `overdue-sup:${a.id}` && k.userId === supervisorUser.userId)).toHaveLength(1);
    const esc = keyed.filter((k) => k.key?.startsWith(`escalate:${a.id}:`));
    expect(esc.map((e) => e.userId)).toEqual(expect.arrayContaining([T.adminUserId, director.userId, facAdminA.userId]));
    expect(new Set(esc.map((e) => e.key)).size).toBe(esc.length);
    const comp = await as(T.adminUserId)((tx) => complianceFor(tx, [reportEmpId]));
    expect(comp.get(reportEmpId)!.status).toBe("NON_COMPLIANT");
  });

  it("sends due reminders at configured thresholds only once per threshold", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const r = await as(T.adminUserId)((tx) => createAssignments(tx, ctx, { employeeIds: [supEmpId], courseId, dueDate: addDays(today, 40), source: "MANUAL" }));
    expect(r.ok && r.data.created.length).toBe(1);
    if (!r.ok) return;
    const id = r.data.created[0].id;
    // Pretend it was assigned 60 days ago, now due in 6 days → threshold 7 reached.
    await asOwner(`ALTER TABLE training_assignments DISABLE TRIGGER training_assignments_guard;
      UPDATE training_assignments SET created_at = now() - interval '60 days', due_date = '${addDays(today, 6)}' WHERE id = '${id}';
      ALTER TABLE training_assignments ENABLE TRIGGER training_assignments_guard;`);
    await runRenewalEngine(systemDb());
    await runRenewalEngine(systemDb());
    const n = await systemDb().select().from(notifications).where(sql`${notifications.dedupeKey} like ${"due:" + id + ":%"}`);
    expect(n.map((x) => x.dedupeKey)).toEqual([`due:${id}:7`]);
  });

  it("creates one renewal assignment when a certificate enters the renewal window, without extending its expiry", async () => {
    const enrollmentId = await completeCourse(supervisorUser.userId, renewCourseId);
    const [cert] = await systemDb().select().from(certificates).where(eq(certificates.enrollmentId, enrollmentId));
    expect(cert.expiresOn).not.toBeNull();
    const soon = addDays(today, 20);
    await systemDb().update(certificates).set({ expiresOn: soon }).where(eq(certificates.id, cert.id)); // shortening is allowed; extension is not
    const ext = await expectPgError(systemDb().update(certificates).set({ expiresOn: addDays(today, 900) }).where(eq(certificates.id, cert.id)));
    expect(ext.message).toMatch(/expir/i);
    await runRenewalEngine(systemDb());
    await runRenewalEngine(systemDb());
    const ren = await systemDb().select().from(trainingAssignments).where(eq(trainingAssignments.renewsCertificateId, cert.id));
    expect(ren).toHaveLength(1);
    expect(ren[0].source).toBe("RENEWAL");
    expect(ren[0].dueDate).toBe(soon);
    const [c2] = await systemDb().select().from(certificates).where(eq(certificates.id, cert.id));
    expect(c2.expiresOn).toBe(soon);
    const warn = await systemDb().select().from(notifications).where(sql`${notifications.dedupeKey} like ${"cert-exp:" + cert.id + ":%"}`);
    expect(warn).toHaveLength(1);
  });

  it("marks expired licenses EXPIRED and warns the employee and managers", async () => {
    const ctx = await ctxFor(T.adminUserId);
    const r = await as(T.adminUserId)((tx) => saveLicense(tx, ctx, reportEmpId, { kind: "THIRD_PARTY_CERTIFICATION", name: "BLS", licenseNumber: "BLS-1", issuingAuthority: "Provider", state: "", issuedOn: "2024-01-01", expiresOn: addDays(today, 3) }));
    if (!r.ok) throw new Error(r.error);
    await runRenewalEngine(systemDb());
    const w = await systemDb().select().from(notifications).where(sql`${notifications.dedupeKey} like ${"lic:" + r.data.id + ":%"}`);
    expect(w.map((x) => x.userId)).toEqual(expect.arrayContaining([reportUser, supervisorUser.userId, facAdminA.userId]));
    await systemDb().update(licenses).set({ expiresOn: addDays(today, -1), issuedOn: "2024-01-01" }).where(eq(licenses.id, r.data.id));
    await runRenewalEngine(systemDb());
    const [l] = await systemDb().select().from(licenses).where(eq(licenses.id, r.data.id));
    expect(l.verificationStatus).toBe("EXPIRED");
  });
});

describe("notifications and email", () => {
  it("notifications are private to the recipient and only reach members of the tenant", async () => {
    const mine = await as(supervisorUser.userId)(async (tx) => (await tx.select().from(notifications)).every((n) => n.userId === supervisorUser.userId));
    expect(mine).toBe(true);
    const [outsider] = await systemDb().select({ id: users.id }).from(users).where(eq(users.id, O.adminUserId));
    const n = await as(T.adminUserId)((tx) => notify(tx, { tenantId: T.tenantId, userId: outsider.id, type: "announcement", title: "x", body: "y" }));
    expect(n).toBe(0);
  });

  it("applies organization and personal email preferences; critical alerts cannot be muted", async () => {
    const before = await systemDb().select().from(emailOutbox).where(eq(emailOutbox.userId, reportUser));
    await as(reportUser)((tx) => saveUserSettings(tx, { tenantId: T.tenantId, userId: reportUser }, { emailAssignments: false, emailResults: true, emailAnnouncements: true }));
    await systemDb().transaction(async (tx) => {
      await notify(tx as never, [
        { tenantId: T.tenantId, userId: reportUser, type: "assignment.new", title: "muted", body: "b", dedupeKey: "t-mute" },
        { tenantId: T.tenantId, userId: reportUser, type: "training.overdue", title: "critical", body: "b", dedupeKey: "t-crit" },
      ]);
    });
    const after = await systemDb().select().from(emailOutbox).where(eq(emailOutbox.userId, reportUser));
    const added = after.filter((a) => !before.some((b) => b.id === a.id)).map((a) => a.subject);
    expect(added).toEqual(["critical"]);
    // Organization switch off → nothing queued.
    const ctx = await ctxFor(T.adminUserId);
    expect((await as(T.adminUserId)((tx) => saveOrgPrefs(tx, ctx, { expiryLeadDays: "60, 30, 7", emailEnabled: false, escalateAfterDays: 7, renewalWindowDays: 60, defaultDueDays: 30 }))).ok).toBe(true);
    await notify(systemDb(), { tenantId: T.tenantId, userId: reportUser, type: "training.overdue", title: "off", body: "b", dedupeKey: "t-off" });
    const off = await systemDb().select().from(emailOutbox).where(and(eq(emailOutbox.userId, reportUser), eq(emailOutbox.subject, "off")));
    expect(off).toHaveLength(0);
    const [p] = await systemDb().select().from(notificationPreferences).where(eq(notificationPreferences.tenantId, T.tenantId));
    expect(p.expiryLeadDays).toEqual([60, 30, 7]);
    await as(T.adminUserId)((tx) => saveOrgPrefs(tx, ctx, { expiryLeadDays: "90, 60, 30, 15, 7", emailEnabled: true, escalateAfterDays: 7, renewalWindowDays: 60, defaultDueDays: 30 }));
    // The application role cannot read or write the outbox directly.
    const denied = await expectPgError(as(T.adminUserId)((tx) => tx.select().from(emailOutbox)));
    expect(denied.code).toBe("42501");
  });

  it("delivers queued email, and retries with backoff when the provider fails", async () => {
    consoleOutbox.length = 0;
    const s = await deliverPendingEmails(systemDb(), 500);
    expect(s.sent).toBeGreaterThan(0);
    expect(consoleOutbox.some((m) => m.subject.includes("critical") && m.text.includes("/settings/notifications"))).toBe(true);
    await notify(systemDb(), { tenantId: T.tenantId, userId: reportUser, type: "training.overdue", title: "retry", body: "b", dedupeKey: "t-retry" });
    const prev = process.env.EMAIL_PROVIDER;
    process.env.EMAIL_PROVIDER = "resend"; // no API key configured → send throws
    delete process.env.RESEND_API_KEY;
    try {
      await systemDb().update(emailOutbox).set({ toEmail: "rita@valid-domain.org" }).where(eq(emailOutbox.subject, "retry"));
      const f = await deliverPendingEmails(systemDb(), 500);
      expect(f.retried).toBeGreaterThan(0);
    } finally {
      process.env.EMAIL_PROVIDER = prev;
    }
    const [row] = await systemDb().select().from(emailOutbox).where(eq(emailOutbox.subject, "retry"));
    expect(row.status).toBe("PENDING");
    expect(row.attempts).toBe(1);
    expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("sends facility-scoped announcements; facility administrators cannot address the whole organization", async () => {
    const ctx = await ctxFor(facAdminA.userId);
    const all = await as(facAdminA.userId)((tx) => sendAnnouncement(tx, ctx, { title: "Hello", body: "Everyone", audience: "all" }));
    expect(all.ok).toBe(false);
    const fac = await as(facAdminA.userId)((tx) => sendAnnouncement(tx, ctx, { title: "Fire drill", body: "Drill on Friday at 10am.", audience: "facility", facilityId: T.facilityId }));
    expect(fac.ok).toBe(true);
    const got = await systemDb().select().from(notifications).where(and(eq(notifications.type, "announcement"), eq(notifications.title, "Fire drill")));
    expect(got.map((g) => g.userId)).toContain(reportUser);
    expect(got.every((g) => g.category === "announcements")).toBe(true);
  });
});

describe("listing", () => {
  it("assignment lists respect facility scope", async () => {
    const ctx = await ctxFor(T.adminUserId);
    await as(T.adminUserId)((tx) => createAssignments(tx, ctx, { employeeIds: [empB], courseId, dueDate: addDays(today, 10), source: "MANUAL" }));
    const forFac = await as(facAdminA.userId)((tx) => listAssignments(tx, { status: "ALL" }));
    expect(forFac.some((a) => a.employeeId === empB)).toBe(false);
    const forAdmin = await as(T.adminUserId)((tx) => listAssignments(tx, { status: "ALL" }));
    expect(forAdmin.some((a) => a.employeeId === empB)).toBe(true);
  });
});
