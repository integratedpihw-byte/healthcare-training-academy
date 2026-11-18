/**
 * Expansion (Home Health / Mental Health divisions) — platform features:
 * program classification guarded by the approvals register, certificate types and
 * printed fields, corrections, verification by certificate number with name privacy,
 * instructor certificates, and certificates of competency.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import { certificates, competencies, courseCategories, courses, employees, instructorCourses, instructors, organizations, programApprovals } from "@/db/schema";
import { addLesson, addModule, createCourse, decide, getBuilderCourse, setObjectives, submitForReview, type AuthorScope } from "@/lib/learning/builder";
import { enroll, getPlayer, recordProgress } from "@/lib/learning/learner";
import { correctCertificate, ensureCompetencyCertificates, initialsOf, issueForCompetency, issueForEnrollment, issueInstructorCertificate, verifyCertificate } from "@/lib/certificates/service";
import { enforceApprovalBackedClassifications, recordApproval, setClassification, withdrawApproval } from "@/lib/compliance/programs";
import { saveDraft, signAssessment, voidAssessment } from "@/lib/competency/service";
import { renderCertificatePdf } from "@/lib/certificates/pdf";
import { can, loadAccess } from "@/lib/rbac/access";
import { PW, addMember, createTenant, expectPgError, platformAdmin, setPassword, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
let director: { userId: string };
let reviewer: { userId: string };
let learner: { userId: string };
let supervisor: { userId: string };

const as = (userId: string) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: T.tenantId, userId }, fn);
async function scope<R>(userId: string, fn: (s: AuthorScope) => Promise<R>) {
  return as(userId)(async (tx) => {
    const access = await loadAccess(tx, T.tenantId, userId);
    return fn({ db: tx, tenantId: T.tenantId, userId, can: (p) => can(access, p) });
  });
}

async function buildCourse(code: string) {
  const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "home-health"));
  const r = await scope(director.userId, (s) => createCourse(s, { code, title: `Course ${code}`, categoryId: cat.id, passingScore: 80, estimatedMinutes: 90, renewalMonths: null, description: "Course used by expansion integration tests.", targetAudience: "All", certificateEligible: true }));
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

async function complete(userId: string, courseId: string) {
  const enrollmentId = await as(userId)(async (tx) => {
    const e = await enroll(tx, { tenantId: T.tenantId, userId }, courseId);
    if (!e.ok) throw new Error(e.error);
    const p = (await getPlayer(tx, e.data.enrollmentId, userId))!;
    for (const l of p.flat) {
      const r = await recordProgress(tx, { tenantId: T.tenantId, userId }, { enrollmentId: e.data.enrollmentId, lessonId: l.id, complete: true });
      if (!r.ok) throw new Error(r.error);
    }
    return e.data.enrollmentId;
  });
  const c = await issueForEnrollment(systemDb(), enrollmentId);
  const [cert] = await systemDb().select().from(certificates).where(eq(certificates.id, c!.id));
  return cert;
}

beforeAll(async () => {
  T = await createTenant("expansion");
  director = await addMember(T, "training_director");
  reviewer = await addMember(T, "org_admin");
  learner = await addMember(T, "learner");
  supervisor = await addMember(T, "facility_admin", T.facilityId);
  await setPassword(supervisor.userId);
  await systemDb().update(organizations).set({ certificateSignatoryName: "Grace Hopper", certificateSignatoryTitle: "Director of Nursing" }).where(eq(organizations.tenantId, T.tenantId));
});
afterAll(() => closePools());

async function libraryCourse(tag: string) {
  const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "home-health"));
  const [c] = await systemDb().insert(courses).values({ code: `LIB-${tag}-${Date.now().toString(36).toUpperCase()}`, title: `Library ${tag}`, categoryId: cat.id, status: "IN_REVIEW" }).returning();
  return c;
}

describe("program classification and the approvals register", () => {
  it("refuses a state-approved or continuing education claim without an active approval", async () => {
    const course = await libraryCourse("A");
    const err = await expectPgError(systemDb().update(courses).set({ programClassification: "STATE_APPROVED_PROGRAM" }).where(eq(courses.id, course.id)));
    expect(err.message).toMatch(/without an active approval/);
    const pa = await platformAdmin();
    const r = await setClassification(systemDb(), pa.id, { courseId: course.id, programClassification: "CONTINUING_EDUCATION", certificateType: "CONTINUING_EDUCATION", reason: "testing the guard" });
    expect(r.ok).toBe(false);
  });

  it("allows the claim while an approval is recorded and falls back when it is withdrawn", async () => {
    const pa = await platformAdmin();
    const course = await libraryCourse("B");
    const bad = await recordApproval(systemDb(), pa.id, { courseId: course.id, kind: "CE_PROVIDER_APPROVAL", approvingBody: "Test Board", approvalNumber: "X1", effectiveOn: "2026-01-01", sourceUrl: "http://insecure.example", verifiedOn: "2026-11-18" });
    expect(bad.ok).toBe(false);
    const a = await recordApproval(systemDb(), pa.id, { courseId: course.id, kind: "CE_PROVIDER_APPROVAL", approvingBody: "Test Board of Nursing", approvalNumber: "50-12345", effectiveOn: "2026-01-01", expiresOn: "2099-12-31", sourceUrl: "https://example.org/approval", verifiedOn: "2026-11-18" });
    if (!a.ok) throw new Error(a.error);
    const s = await setClassification(systemDb(), pa.id, { courseId: course.id, programClassification: "CONTINUING_EDUCATION", certificateType: "CONTINUING_EDUCATION", reason: "approval recorded" });
    expect(s.ok).toBe(true);
    const w = await withdrawApproval(systemDb(), pa.id, a.data.id, "Test withdrawal of approval");
    if (!w.ok) throw new Error(w.error);
    expect(w.data.downgraded).toContain(course.code);
    const [after] = await systemDb().select().from(courses).where(eq(courses.id, course.id));
    expect(after.programClassification).toBe("STATE_REGULATED_TRAINING");
    expect(after.certificateType).toBe("COURSE_COMPLETION");
    expect(await enforceApprovalBackedClassifications(systemDb(), null)).toEqual([]);
    // Approvals are never deleted.
    expect((await expectPgError(systemDb().delete(programApprovals).where(eq(programApprovals.id, a.data.id)))).message).toMatch(/cannot be deleted/);
  });
});

describe("certificate types, printed fields, corrections and verification", () => {
  let courseId: string;
  beforeAll(async () => {
    courseId = await buildCourse(`EXP-${Date.now().toString(36).toUpperCase()}`);
  });

  it("issues the course's certificate type with program type, signatory and notice", async () => {
    await systemDb().update(courses).set({ programClassification: "PROFESSION_SPECIFIC", certificateType: "SPECIALIZED_TRAINING" }).where(eq(courses.id, courseId));
    const cert = await complete(learner.userId, courseId);
    expect(cert.kind).toBe("SPECIALIZED_TRAINING");
    expect(cert.programClassification).toBe("PROFESSION_SPECIFIC");
    expect(cert.signatoryName).toBe("Grace Hopper");
    expect(cert.signatoryTitle).toBe("Director of Nursing");
    expect(Number(cert.trainingHours)).toBe(1.5);
    const pdf = await renderCertificatePdf({ ...cert, status: cert.status });
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
    // Printed fields are immutable once issued.
    expect((await expectPgError(systemDb().update(certificates).set({ signatoryName: "Someone Else" }).where(eq(certificates.id, cert.id)))).message).toMatch(/immutable/);
  });

  it("corrects a name by reissuing, and verifies by certificate number with name privacy", async () => {
    const [cert] = await systemDb().select().from(certificates).where(and(eq(certificates.courseId, courseId), eq(certificates.userId, learner.userId), eq(certificates.status, "ACTIVE")));
    const bad = await as(reviewer.userId)((tx) => correctCertificate(systemDb(), tx, { tenantId: T.tenantId, userId: reviewer.userId }, cert.id, { recipientName: "Maria L. Gomez", reason: "short" }));
    expect(bad.ok).toBe(false);
    const r = await as(reviewer.userId)((tx) => correctCertificate(systemDb(), tx, { tenantId: T.tenantId, userId: reviewer.userId }, cert.id, { recipientName: "Maria L. Gomez", reason: "Legal name misspelled at enrollment" }));
    if (!r.ok) throw new Error(r.error);
    const [old] = await systemDb().select().from(certificates).where(eq(certificates.id, cert.id));
    const [fresh] = await systemDb().select().from(certificates).where(eq(certificates.id, r.data.id));
    expect(old.status).toBe("SUPERSEDED");
    expect(fresh.recipientName).toBe("Maria L. Gomez");
    expect(fresh.supersedesId).toBe(cert.id);
    expect(fresh.kind).toBe("SPECIALIZED_TRAINING");

    const byNumber = await verifyCertificate(systemDb(), fresh.certificateNumber.toLowerCase(), { ip: "198.51.100.20" });
    expect(byNumber.found).toBe(true);
    expect(byNumber.certificate?.recipientName).toBe("Maria L. Gomez");
    expect(byNumber.certificate?.correctionReason).toBeTruthy();
    await systemDb().update(organizations).set({ certificateNameDisplay: "INITIALS" }).where(eq(organizations.tenantId, T.tenantId));
    const masked = await verifyCertificate(systemDb(), fresh.verificationCode, { ip: "198.51.100.20" });
    expect(masked.certificate?.recipientName).toBe("M. L. G.");
    expect(masked.certificate?.nameMasked).toBe(true);
    expect(initialsOf("ana  maría lópez")).toBe("A. M. L.");
    await systemDb().update(organizations).set({ certificateNameDisplay: "FULL" }).where(eq(organizations.tenantId, T.tenantId));
    // A certificate from another organization cannot be corrected (RLS hides it).
    const O = await createTenant("expansion-other");
    const outsider = await withTenant({ tenantId: O.tenantId, userId: O.adminUserId }, (tx) => correctCertificate(systemDb(), tx, { tenantId: O.tenantId, userId: O.adminUserId }, fresh.id, { recipientName: "X Y", reason: "cross-tenant attempt" }));
    expect(outsider.ok).toBe(false);
  });

  it("issues instructor certificates only for an assigned course", async () => {
    const [ins] = await systemDb().insert(instructors).values({ tenantId: T.tenantId, userId: director.userId, title: "RN Instructor" }).returning();
    const notAssigned = await issueInstructorCertificate(systemDb(), { tenantId: T.tenantId, userId: reviewer.userId }, { instructorId: ins.id, courseId, hours: 4 });
    expect(notAssigned.ok).toBe(false);
    await systemDb().insert(instructorCourses).values({ tenantId: T.tenantId, instructorId: ins.id, courseId });
    const ok = await issueInstructorCertificate(systemDb(), { tenantId: T.tenantId, userId: reviewer.userId }, { instructorId: ins.id, courseId, hours: 4 });
    if (!ok.ok) throw new Error(ok.error);
    const [c] = await systemDb().select().from(certificates).where(eq(certificates.id, ok.data.id));
    expect(c.kind).toBe("INSTRUCTOR");
    expect(c.enrollmentId).toBeNull();
    expect(c.userId).toBe(director.userId);
  });
});

describe("certificates of competency", () => {
  it("issues one on a signed PASS and revokes it when the evaluation is voided", async () => {
    await systemDb().update(employees).set({ userId: learner.userId }).where(eq(employees.id, T.employeeId));
    const [hh] = await systemDb().select().from(competencies).where(eq(competencies.code, "COMP-HH"));
    const access = (await as(supervisor.userId)((tx) => loadAccess(tx, T.tenantId, supervisor.userId)))!;
    const ctx = { tenantId: T.tenantId, userId: supervisor.userId, access };
    const criteriaResults = (hh.criteria as { id: string }[]).map((x) => ({ id: x.id, outcome: "MET" }));
    const d = await as(supervisor.userId)((tx) => saveDraft(tx, ctx, { employeeId: T.employeeId, facilityId: T.facilityId, competencyId: hh.id, assessedOn: "2026-11-10", criteriaResults, evidenceUrls: [] }));
    if (!d.ok) throw new Error(d.error);
    const s = await as(supervisor.userId)((tx) => signAssessment(tx, systemDb(), ctx, d.data.id, { password: PW, credentials: "RN", attest: true }));
    if (!s.ok) throw new Error(s.error);
    expect((await issueForCompetency(systemDb(), d.data.id))?.created).toBe(true);
    expect((await issueForCompetency(systemDb(), d.data.id))?.created).toBe(false);
    const [cert] = await systemDb().select().from(certificates).where(eq(certificates.competencyAssessmentId, d.data.id));
    expect(cert.kind).toBe("COMPETENCY_VERIFICATION");
    expect(cert.userId).toBe(learner.userId);
    expect(cert.instructorName).toMatch(/RN \(evaluator\)/);
    const v = await as(supervisor.userId)((tx) => voidAssessment(tx, ctx, d.data.id, "Recorded against the wrong checklist"));
    expect(v.ok).toBe(true);
    expect(await ensureCompetencyCertificates(systemDb())).toBe(0); // repair job revokes it too

    const [after] = await systemDb().select().from(certificates).where(eq(certificates.id, cert.id));
    expect(after.status).toBe("REVOKED");
  });
});
