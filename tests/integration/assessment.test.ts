import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import {
  certificateVerifications,
  certificates,
  competencies,
  competencyAssessments,
  courseCategories,
  employees,
  enrollments,
  examinationAnswers,
  examinationAttempts,
  examinations,
  notifications,
  questions,
} from "@/db/schema";
import { addLesson, addModule, createCourse, decide, getBuilderCourse, setObjectives, submitForReview, type AuthorScope } from "@/lib/learning/builder";
import { addQuestion, parseQuestionForm, saveExamSettings } from "@/lib/assessment/authoring";
import { applyExamOutcome, authorizeRetake, getAttempt, getAttemptForLearner, gradeAnswer, saveAnswer, startAttempt, submitAttempt } from "@/lib/assessment/engine";
import { enroll, getPlayer, recordProgress } from "@/lib/learning/learner";
import { expireDueCertificates, issueForEnrollment, revokeCertificate, verifyCertificate } from "@/lib/certificates/service";
import { saveDraft, signAssessment, verifySignature, voidAssessment } from "@/lib/competency/service";
import { can, loadAccess } from "@/lib/rbac/access";
import { PW, addMember, createTenant, expectPgError, setPassword, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
let author: { userId: string };
let reviewer: { userId: string };
let learner: { userId: string };
let other: { userId: string };
let supervisorUser: { userId: string };
let instructor: { userId: string };
let courseId: string;
let practicalCourseId: string;

const as = (userId: string) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: T.tenantId, userId }, fn);
const c = (userId: string) => ({ tenantId: T.tenantId, userId });
async function scope<R>(userId: string, fn: (s: AuthorScope) => Promise<R>) {
  return as(userId)(async (tx) => {
    const access = await loadAccess(tx, T.tenantId, userId);
    return fn({ db: tx, tenantId: T.tenantId, userId, can: (p) => can(access, p) });
  });
}

const QUESTIONS: Record<string, string>[] = [
  { type: "MULTIPLE_CHOICE", prompt: "Which tube top contains EDTA?", optionsText: "a | Red\nb | Lavender\nc | Light blue", correct: "b", explanation: "EDTA tubes are lavender." },
  { type: "MULTIPLE_SELECT", prompt: "Which are bloodborne pathogens?", optionsText: "a | HBV\nb | Influenza\nc | HIV", correct: "a, c", explanation: "HBV and HIV are bloodborne." },
  { type: "MATCHING", prompt: "Match the precaution to the PPE", matchLeft: "1 | Contact\n2 | Airborne", matchRight: "a | Gown and gloves\nb | N95 respirator", matchKey: "1=a, 2=b", explanation: "Standard pairings." },
  { type: "FILL_IN_BLANK", prompt: "PPE stands for personal protective ______", accepted: "equipment", explanation: "Personal protective equipment." },
];
const RIGHT = (prompt: string) => ({ "Which tube top contains EDTA?": "b", "Which are bloodborne pathogens?": ["a", "c"], "Match the precaution to the PPE": { "1": "a", "2": "b" }, "PPE stands for personal protective ______": "Equipment" } as Record<string, unknown>)[prompt];
const WRONG = (prompt: string) => ({ "Which tube top contains EDTA?": "a", "Which are bloodborne pathogens?": ["b"], "Match the precaution to the PPE": { "1": "b", "2": "a" }, "PPE stands for personal protective ______": "gear" } as Record<string, unknown>)[prompt];

async function buildCourse(code: string, qs: Record<string, string>[], exam: Record<string, unknown>, renewalMonths: string | null = null) {
  const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "facility-programs"));
  const r = await scope(author.userId, (s) => createCourse(s, { code, title: `Course ${code}`, categoryId: cat.id, passingScore: 75, estimatedMinutes: 45, renewalMonths, description: "Course used by assessment integration tests.", targetAudience: "All", certificateEligible: true }));
  if (!r.ok) throw new Error(r.error);
  const id = r.data.courseId;
  const b = (await scope(author.userId, (s) => getBuilderCourse(s, id)))!;
  await scope(author.userId, (s) => setObjectives(s, b.working.id, "Pass the exam"));
  const m = await scope(author.userId, (s) => addModule(s, b.working.id, { title: "Module" }));
  if (!m.ok) throw new Error(m.error);
  await scope(author.userId, (s) => addLesson(s, m.data.id, { title: "Lesson", type: "TEXT", body: "Read this lesson body.", durationMinutes: 5 }));
  for (const q of qs) {
    const a = await scope(author.userId, (s) => addQuestion(s, id, parseQuestionForm(q)));
    if (!a.ok) throw new Error(`${a.error} ${JSON.stringify(a.fieldErrors)}`);
  }
  const x = await scope(author.userId, (s) => saveExamSettings(s, id, { title: "Final", passingScore: 75, randomize: true, isMandatory: true, ...exam }));
  if (!x.ok) throw new Error(x.error);
  expect((await scope(author.userId, (s) => submitForReview(s, id))).ok).toBe(true);
  for (let i = 0; i < 3; i++) {
    const d = await scope(reviewer.userId, (s) => decide(s, id, { decision: "APPROVED", comments: "ok" }));
    if (!d.ok) throw new Error(d.error);
  }
  return id;
}

async function finishLessons(userId: string, cid: string) {
  return as(userId)(async (tx) => {
    const e = await enroll(tx, c(userId), cid);
    if (!e.ok) throw new Error(e.error);
    const p = (await getPlayer(tx, e.data.enrollmentId, userId))!;
    for (const l of p.flat) {
      const r = await recordProgress(tx, c(userId), { enrollmentId: e.data.enrollmentId, lessonId: l.id, complete: true });
      if (!r.ok) throw new Error(r.error);
    }
    return e.data.enrollmentId;
  });
}

async function takeExam(userId: string, enrollmentId: string, answerFor: (p: string) => unknown) {
  const attemptId = await as(userId)(async (tx) => {
    const s = await startAttempt(tx, c(userId), enrollmentId);
    if (!s.ok) throw new Error(s.error);
    const a = (await getAttempt(tx, s.data.attemptId))!;
    const r = await submitAttempt(tx, c(userId), s.data.attemptId, Object.fromEntries(a.questions.map((q) => [q.id, answerFor(q.prompt)])));
    if (!r.ok) throw new Error(r.error);
    return s.data.attemptId;
  });
  const outcome = await applyExamOutcome(systemDb(), attemptId);
  const [att] = await systemDb().select().from(examinationAttempts).where(eq(examinationAttempts.id, attemptId));
  return { attemptId, att, outcome };
}

beforeAll(async () => {
  T = await createTenant("assess");
  author = await addMember(T, "training_director");
  reviewer = await addMember(T, "org_admin");
  learner = await addMember(T, "learner");
  other = await addMember(T, "learner");
  supervisorUser = await addMember(T, "supervisor");
  instructor = await addMember(T, "instructor");
  for (const u of [supervisorUser, instructor]) await setPassword(u.userId);
  // Employee records: learner reports to the supervisor
  const [supEmp] = await systemDb().insert(employees).values({ tenantId: T.tenantId, organizationId: T.orgId, userId: supervisorUser.userId, employeeNumber: "SUP-1", firstName: "Sue", lastName: "Pervisor", jobTitle: "Supervisor", positionCode: "SUPERVISOR", hireDate: "2024-01-01", primaryFacilityId: T.facilityId }).returning();
  await systemDb().update(employees).set({ userId: learner.userId, supervisorId: supEmp.id }).where(eq(employees.id, T.employeeId));
  courseId = await buildCourse("ASSESS-1", QUESTIONS, { questionCount: 4, maxAttempts: 2 }, "12");
  practicalCourseId = await buildCourse("ASSESS-2", [
    QUESTIONS[0],
    { type: "PRACTICAL", prompt: "Describe the steps to remove PPE safely.", rubric: "Gloves first, then goggles, gown, mask; hand hygiene.", explanation: "CDC sequence." },
  ], { questionCount: 2, maxAttempts: 1 });
});
afterAll(() => closePools());

describe("examination engine", () => {
  let enrollmentId: string;

  it("is locked until every required lesson is complete (service and database)", async () => {
    const e = await as(learner.userId)((tx) => enroll(tx, c(learner.userId), courseId));
    if (!e.ok) throw new Error(e.error);
    enrollmentId = e.data.enrollmentId;
    const s = await as(learner.userId)((tx) => startAttempt(tx, c(learner.userId), enrollmentId));
    expect(s.ok).toBe(false);
    const [x] = await systemDb().select().from(examinations).innerJoin(enrollments, eq(enrollments.courseVersionId, examinations.courseVersionId)).where(eq(enrollments.id, enrollmentId));
    const err = await expectPgError(systemDb().insert(examinationAttempts).values({ tenantId: T.tenantId, examinationId: x.examinations.id, enrollmentId, userId: learner.userId, attemptNumber: 1, questionIds: [] }));
    expect(err.message).toMatch(/complete all required lessons/);
  });

  it("starts a randomized attempt, resumes it, autosaves, and never exposes answers to the learner", async () => {
    await finishLessons(learner.userId, courseId);
    const s1 = await as(learner.userId)((tx) => startAttempt(tx, c(learner.userId), enrollmentId));
    const s2 = await as(learner.userId)((tx) => startAttempt(tx, c(learner.userId), enrollmentId));
    if (!s1.ok || !s2.ok) throw new Error("start");
    expect(s2.data.attemptId).toBe(s1.data.attemptId);
    expect(s2.data.resumed).toBe(true);
    const view = (await as(learner.userId)((tx) => getAttemptForLearner(tx, c(learner.userId), s1.data.attemptId)))!;
    expect(view.publicQuestions).toHaveLength(4);
    expect(JSON.stringify(view.publicQuestions)).not.toMatch(/correctAnswer|explanation/);
    const q0 = view.questions[0];
    expect((await as(learner.userId)((tx) => saveAnswer(tx, c(learner.userId), s1.data.attemptId, q0.id, WRONG(q0.prompt)))).ok).toBe(true);
    // Another learner cannot see or write into this attempt
    expect(await as(other.userId)((tx) => tx.select().from(examinationAttempts).where(eq(examinationAttempts.id, s1.data.attemptId)))).toHaveLength(0);
    const r = await as(learner.userId)((tx) => submitAttempt(tx, c(learner.userId), s1.data.attemptId, Object.fromEntries(view.questions.map((q) => [q.id, WRONG(q.prompt)]))));
    expect(r.ok && r.data.passed).toBe(false);
    await applyExamOutcome(systemDb(), s1.data.attemptId);
    const n = await systemDb().select().from(notifications).where(and(eq(notifications.userId, learner.userId), eq(notifications.type, "exam.failed")));
    expect(n.length).toBe(1);
  });

  it("submitted answers and final grades are immutable; passes cannot be recorded below the passing score", async () => {
    const [a] = await systemDb().select().from(examinationAttempts).where(eq(examinationAttempts.enrollmentId, enrollmentId));
    expect((await expectPgError(systemDb().update(examinationAnswers).set({ response: "b" }).where(eq(examinationAnswers.attemptId, a.id)))).message).toMatch(/cannot be changed after submission/);
    expect((await expectPgError(systemDb().update(examinationAttempts).set({ scorePct: 100, passed: true }).where(eq(examinationAttempts.id, a.id)))).message).toMatch(/final/);
    expect((await expectPgError(systemDb().delete(examinationAttempts).where(eq(examinationAttempts.id, a.id)))).message).toMatch(/cannot be deleted/);
  });

  it("after the last failed attempt the enrollment fails, the supervisor is notified, and no further attempts are allowed", async () => {
    const { att } = await takeExam(learner.userId, enrollmentId, WRONG);
    expect(att.passed).toBe(false);
    const [e] = await systemDb().select().from(enrollments).where(eq(enrollments.id, enrollmentId));
    expect(e.status).toBe("FAILED");
    const supN = await systemDb().select().from(notifications).where(and(eq(notifications.userId, supervisorUser.userId), eq(notifications.type, "exam.failed.supervisor")));
    expect(supN.length).toBe(1);
    expect((await as(learner.userId)((tx) => startAttempt(tx, c(learner.userId), enrollmentId))).ok).toBe(false);
  });

  it("only training administrators can authorize retakes; learners cannot raise their own allowance", async () => {
    const self = await expectPgError(as(learner.userId)((tx) => tx.update(enrollments).set({ extraAttempts: 5 }).where(eq(enrollments.id, enrollmentId))));
    expect(self.code).toBe("42501");
    expect((await as(reviewer.userId)((tx) => authorizeRetake(tx, c(reviewer.userId), enrollmentId, 1, "x"))).ok).toBe(false); // reason required
    expect((await as(reviewer.userId)((tx) => authorizeRetake(tx, c(reviewer.userId), enrollmentId, 1, "Completed remediation"))).ok).toBe(true);
    const [e] = await systemDb().select().from(enrollments).where(eq(enrollments.id, enrollmentId));
    expect(e.status).toBe("AWAITING_ASSESSMENT");
    expect(e.extraAttempts).toBe(1);
  });

  it("passing completes the course and issues a certificate with the renewal-based expiration", async () => {
    const { att, outcome } = await takeExam(learner.userId, enrollmentId, RIGHT);
    expect(att.scorePct).toBe(100);
    expect(outcome.completed).toBe(true);
    const [cert] = await systemDb().select().from(certificates).where(eq(certificates.enrollmentId, enrollmentId));
    expect(cert.certificateNumber).toMatch(/^CHITA-\d{4}-[A-Z2-9]{8}$/);
    expect(cert.expiresOn).not.toBeNull();
    expect(cert.status).toBe("ACTIVE");
    expect((await issueForEnrollment(systemDb(), enrollmentId))?.created).toBe(false); // idempotent
  });

  it("renewal: completing the course again supersedes the previous certificate", async () => {
    const e2 = await finishLessons(learner.userId, courseId);
    expect(e2).not.toBe(enrollmentId);
    await takeExam(learner.userId, e2, RIGHT);
    const certs = await systemDb().select().from(certificates).where(and(eq(certificates.userId, learner.userId), eq(certificates.courseId, courseId)));
    expect(certs.map((x) => x.status).sort()).toEqual(["ACTIVE", "SUPERSEDED"]);
    expect(certs.find((x) => x.status === "ACTIVE")!.supersedesId).toBe(certs.find((x) => x.status === "SUPERSEDED")!.id);
  });

  it("time limits: answers cannot change after expiry, and an expired attempt is finalized with saved answers", async () => {
    const e = await finishLessons(other.userId, courseId);
    const [x] = await systemDb().select().from(examinations).innerJoin(enrollments, eq(enrollments.courseVersionId, examinations.courseVersionId)).where(eq(enrollments.id, e));
    const qids = (await systemDb().select({ id: questions.id }).from(questions).where(eq(questions.bankId, x.examinations.questionBankId))).map((q) => q.id);
    const [att] = await systemDb().insert(examinationAttempts).values({ tenantId: T.tenantId, examinationId: x.examinations.id, enrollmentId: e, userId: other.userId, attemptNumber: 1, questionIds: qids, startedAt: new Date(Date.now() - 3_600_000), expiresAt: new Date(Date.now() - 1_800_000) }).returning();
    const save = await as(other.userId)((tx) => saveAnswer(tx, c(other.userId), att.id, qids[0], "b"));
    expect(save.ok).toBe(false);
    const dbErr = await expectPgError(as(other.userId)((tx) => tx.insert(examinationAnswers).values({ tenantId: T.tenantId, attemptId: att.id, questionId: qids[0], response: "b" })));
    expect(dbErr.message).toMatch(/time limit expired/);
    const restart = await as(other.userId)((tx) => startAttempt(tx, c(other.userId), e));
    expect(restart.ok).toBe(false); // finalized instead
    const [fin] = await systemDb().select().from(examinationAttempts).where(eq(examinationAttempts.id, att.id));
    expect(fin.submittedAt).not.toBeNull();
    expect(fin.scorePct).toBe(0);
  });
});

describe("instructor grading", () => {
  it("practical items await an instructor; learners cannot grade themselves; grading finalizes and completes", async () => {
    const e = await finishLessons(learner.userId, practicalCourseId);
    const attemptId = await as(learner.userId)(async (tx) => {
      const s = await startAttempt(tx, c(learner.userId), e);
      if (!s.ok) throw new Error(s.error);
      const a = (await getAttempt(tx, s.data.attemptId))!;
      const r = await submitAttempt(tx, c(learner.userId), s.data.attemptId, Object.fromEntries(a.questions.map((q) => [q.id, q.type === "PRACTICAL" ? "Remove gloves, goggles, gown, mask, then hand hygiene." : "b"])));
      if (!r.ok) throw new Error(r.error);
      expect(r.data.gradingStatus).toBe("PENDING_INSTRUCTOR");
      return s.data.attemptId;
    });
    const practical = (await systemDb().select().from(questions).where(eq(questions.type, "PRACTICAL")))[0];
    expect((await as(learner.userId)((tx) => gradeAnswer(tx, c(learner.userId), attemptId, practical.id, { points: 1 }))).ok).toBe(false);
    const g = await as(instructor.userId)((tx) => gradeAnswer(tx, c(instructor.userId), attemptId, practical.id, { points: 1, comment: "Correct sequence" }));
    if (!g.ok) throw new Error(g.error);
    expect(g.data.finalized?.passed).toBe(true);
    const out = await applyExamOutcome(systemDb(), attemptId);
    expect(out.completed).toBe(true);
    expect(out.certificateId).not.toBeNull();
  });
});

describe("certificates", () => {
  it("learners see only their own certificates; verification is public and records lookups; revocation is permanent", async () => {
    const [mine] = await systemDb().select().from(certificates).where(and(eq(certificates.userId, learner.userId), eq(certificates.status, "ACTIVE")));
    expect(await as(other.userId)((tx) => tx.select().from(certificates).where(eq(certificates.id, mine.id)))).toHaveLength(0);
    expect(await as(learner.userId)((tx) => tx.select().from(certificates).where(eq(certificates.id, mine.id)))).toHaveLength(1);
    const v = await verifyCertificate(systemDb(), mine.verificationCode.toLowerCase(), { ip: "198.51.100.7" });
    expect(v.found && v.certificate?.status).toBe("ACTIVE");
    expect((await verifyCertificate(systemDb(), "ZZZZZZZZZZ", { ip: "198.51.100.7" })).found).toBe(false);
    const logged = await systemDb().select().from(certificateVerifications).where(eq(certificateVerifications.certificateId, mine.id));
    expect(logged.length).toBe(1);
    expect(logged[0].ipHash).not.toContain("198.51");
    const appWrite = await expectPgError(as(learner.userId)((tx) => tx.insert(certificateVerifications).values({ tenantId: T.tenantId, certificateId: mine.id })));
    expect(appWrite.code).toBe("42501");

    expect((await as(learner.userId)((tx) => revokeCertificate(tx, c(learner.userId), mine.id, "Trying to revoke my own"))).ok).toBe(false);
    expect((await as(reviewer.userId)((tx) => revokeCertificate(tx, c(reviewer.userId), mine.id, "short"))).ok).toBe(false);
    expect((await as(reviewer.userId)((tx) => revokeCertificate(tx, c(reviewer.userId), mine.id, "Exam integrity concern confirmed"))).ok).toBe(true);
    expect((await verifyCertificate(systemDb(), mine.verificationCode, { ip: "198.51.100.8" })).certificate?.status).toBe("REVOKED");
    const reinstate = await expectPgError(systemDb().update(certificates).set({ status: "ACTIVE" }).where(eq(certificates.id, mine.id)));
    expect(reinstate.message).toMatch(/cannot be reinstated/);
  });

  it("the scheduled job expires certificates past their expiration date", async () => {
    const [any] = await systemDb().select().from(certificates).where(and(eq(certificates.tenantId, T.tenantId), eq(certificates.status, "SUPERSEDED")));
    // Shorten (never extend) an expiration to simulate time passing.
    const [active] = await systemDb().select().from(certificates).where(and(eq(certificates.tenantId, T.tenantId), eq(certificates.status, "ACTIVE"), sql`${certificates.expiresOn} is not null`));
    expect(any).toBeDefined();
    if (active) {
      await systemDb().update(certificates).set({ expiresOn: "2020-01-01" }).where(eq(certificates.id, active.id));
      expect(await expireDueCertificates(systemDb())).toBeGreaterThanOrEqual(1);
      const [after] = await systemDb().select().from(certificates).where(eq(certificates.id, active.id));
      expect(after.status).toBe("EXPIRED");
    }
  });
});

describe("competency validation and electronic signatures", () => {
  let hh: typeof competencies.$inferSelect;
  beforeAll(async () => {
    [hh] = await systemDb().select().from(competencies).where(eq(competencies.code, "COMP-HH"));
  });
  const supCtx = async () => ({ tenantId: T.tenantId, userId: supervisorUser.userId, access: (await as(supervisorUser.userId)((tx) => loadAccess(tx, T.tenantId, supervisorUser.userId)))! });
  const allMet = () => (hh.criteria as { id: string }[]).map((x) => ({ id: x.id, outcome: "MET" }));
  const base = () => ({ employeeId: T.employeeId, facilityId: T.facilityId, competencyId: hh.id, assessedOn: "2026-11-10", criteriaResults: allMet(), evidenceUrls: [] });

  it("validates observations and derives the result", async () => {
    const ctx = await supCtx();
    const crit = hh.criteria as { id: string; critical: boolean }[];
    const naCritical = await as(supervisorUser.userId)((tx) => saveDraft(tx, ctx, { ...base(), criteriaResults: crit.map((x) => ({ id: x.id, outcome: x.critical ? "NA" : "MET" })) }));
    expect(naCritical.ok).toBe(false);
    const failNoRemediation = await as(supervisorUser.userId)((tx) => saveDraft(tx, ctx, { ...base(), criteriaResults: crit.map((x) => ({ id: x.id, outcome: x.critical ? "NOT_MET" : "MET" })) }));
    expect(failNoRemediation.ok).toBe(false);
    const future = await as(supervisorUser.userId)((tx) => saveDraft(tx, ctx, { ...base(), assessedOn: "2099-01-01" }));
    expect(future.ok).toBe(false);
  });

  it("evaluators cannot assess themselves", async () => {
    const [supEmp] = await systemDb().select().from(employees).where(eq(employees.userId, supervisorUser.userId));
    await systemDb().insert((await import("@/db/schema")).employeeFacilities).values({ tenantId: T.tenantId, employeeId: supEmp.id, facilityId: T.facilityId }).onConflictDoNothing();
    const r = await as(supervisorUser.userId)(async (tx) => saveDraft(tx, await supCtx(), { ...base(), employeeId: supEmp.id }));
    expect(r.ok).toBe(false);
  });

  it("signing requires the password, binds a verifiable hash, freezes the record, and allows only voiding with a reason", async () => {
    const ctx = await supCtx();
    const d = await as(supervisorUser.userId)((tx) => saveDraft(tx, ctx, base()));
    if (!d.ok) throw new Error(d.error);
    const bad = await as(supervisorUser.userId)((tx) => signAssessment(tx, systemDb(), ctx, d.data.id, { password: "wrong-password", credentials: "", attest: true }));
    expect(bad.ok).toBe(false);
    const noAttest = await as(supervisorUser.userId)((tx) => signAssessment(tx, systemDb(), ctx, d.data.id, { password: PW, credentials: "", attest: false }));
    expect(noAttest.ok).toBe(false);
    const ok = await as(supervisorUser.userId)((tx) => signAssessment(tx, systemDb(), ctx, d.data.id, { password: PW, credentials: "RN", attest: true }));
    if (!ok.ok) throw new Error(ok.error);
    const [rec] = await systemDb().select().from(competencyAssessments).where(eq(competencyAssessments.id, d.data.id));
    expect(rec.status).toBe("SIGNED");
    expect(verifySignature(rec)).toBe(true);
    expect(verifySignature({ ...rec, result: "FAIL" })).toBe(false);
    expect((await expectPgError(systemDb().update(competencyAssessments).set({ result: "FAIL" }).where(eq(competencyAssessments.id, rec.id)))).message).toMatch(/immutable/);
    // The learner (the evaluated employee) can read the record; another learner cannot.
    expect(await as(learner.userId)((tx) => tx.select().from(competencyAssessments).where(eq(competencyAssessments.id, rec.id)))).toHaveLength(1);
    expect(await as(other.userId)((tx) => tx.select().from(competencyAssessments).where(eq(competencyAssessments.id, rec.id)))).toHaveLength(0);
    expect((await as(supervisorUser.userId)((tx) => voidAssessment(tx, ctx, rec.id, "short"))).ok).toBe(false);
    expect((await as(supervisorUser.userId)((tx) => voidAssessment(tx, ctx, rec.id, "Recorded for the wrong employee"))).ok).toBe(true);
    expect((await expectPgError(systemDb().update(competencyAssessments).set({ status: "SIGNED" }).where(eq(competencyAssessments.id, rec.id)))).message).toMatch(/final/);
  });

  it("only users with competency.sign can sign, and only their own evaluation (database enforced)", async () => {
    const ctx = await supCtx();
    const d = await as(supervisorUser.userId)((tx) => saveDraft(tx, ctx, base()));
    if (!d.ok) throw new Error(d.error);
    const byOther = await expectPgError(as(instructor.userId)((tx) => tx.update(competencyAssessments).set({ status: "SIGNED", signatureHash: "x", signerName: "x" }).where(eq(competencyAssessments.id, d.data.id))));
    expect(byOther.message).toMatch(/only the evaluator may sign|permission/);
  });
});
