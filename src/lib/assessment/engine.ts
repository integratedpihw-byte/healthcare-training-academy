/**
 * Examination engine (spec §8): attempts, randomized question selection, time limits,
 * autosave, automatic and instructor grading, retakes, outcomes and analytics.
 *
 * Learner operations run in the learner's RLS-scoped transaction. Outcome effects that
 * cross users (enrollment status, certificates, supervisor notifications) run through
 * `applyExamOutcome` on the platform client after the attempt is final.
 */
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import { courses, enrollments, examinationAnswers, examinationAttempts, examinations, questions, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import { issueForEnrollment } from "@/lib/certificates/service";
import type { ServiceResult } from "@/lib/tenancy/service";
import { INSTRUCTOR_GRADED, grade, pickRandom, publicQuestion, scorePct, type QuestionType } from "./grading";

export interface Ctx {
  tenantId: string;
  userId: string;
}

const err = (error: string) => ({ ok: false as const, error });
/** JSON null (the column is NOT NULL jsonb; "no answer" is stored as JSON null). */
const JSON_NULL = sql`'null'::jsonb`;

// ---------------------------------------------------------------------------
// Learner: exam overview, start, autosave, submit
// ---------------------------------------------------------------------------

export async function examOverview(tx: Tx, ctx: Ctx, enrollmentId: string) {
  const [e] = await tx
    .select({ e: enrollments, courseTitle: courses.title, courseId: courses.id })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, ctx.userId)));
  if (!e) return null;
  const exams = await tx.select().from(examinations).where(eq(examinations.courseVersionId, e.e.courseVersionId)).orderBy(asc(examinations.createdAt));
  const exam = exams.find((x) => x.isFinal) ?? exams[0] ?? null;
  if (!exam) return { ...e, exam: null, attempts: [], remaining: 0, open: null };
  const attempts = await tx
    .select()
    .from(examinationAttempts)
    .where(and(eq(examinationAttempts.enrollmentId, enrollmentId), eq(examinationAttempts.examinationId, exam.id)))
    .orderBy(asc(examinationAttempts.attemptNumber));
  const [{ available }] = await tx
    .select({ available: sql<number>`count(*)::int` })
    .from(questions)
    .where(and(eq(questions.bankId, exam.questionBankId), eq(questions.isActive, true)));
  const allowed = exam.maxAttempts + e.e.extraAttempts;
  return {
    ...e,
    exam,
    questionCount: Math.min(exam.questionCount, available),
    attempts,
    allowed,
    remaining: Math.max(0, allowed - attempts.length),
    open: attempts.find((a) => !a.submittedAt) ?? null,
    passed: attempts.some((a) => a.passed),
  };
}

export async function startAttempt(tx: Tx, ctx: Ctx, enrollmentId: string): Promise<ServiceResult<{ attemptId: string; resumed: boolean }>> {
  const o = await examOverview(tx, ctx, enrollmentId);
  if (!o || !o.exam) return err("This course has no examination.");
  if (o.passed) return err("You have already passed this examination.");
  if (o.open) {
    if (!o.open.expiresAt || o.open.expiresAt.getTime() + 60_000 > Date.now()) return { ok: true, data: { attemptId: o.open.id, resumed: true } };
    // Time ran out on an unfinished attempt: finalize it with saved answers first.
    await finalizeAttempt(tx, o.open.id, { submittedBy: ctx.userId });
    return err("Your previous attempt reached its time limit and was submitted with your saved answers. Review the result before starting again.");
  }
  if (o.e.status !== "AWAITING_ASSESSMENT") return err("Complete all required lessons before taking the final examination.");
  if (o.remaining <= 0) return err("No attempts remain. Ask your training administrator to authorize a retake.");

  const pool = await tx
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.bankId, o.exam.questionBankId), eq(questions.isActive, true)))
    .orderBy(asc(questions.createdAt));
  if (pool.length === 0) return err("The examination has no active questions. Contact your administrator.");
  const chosen = pickRandom(pool.map((p) => p.id), o.exam.questionCount, o.exam.randomize);
  const now = new Date();
  const [a] = await tx
    .insert(examinationAttempts)
    .values({
      tenantId: ctx.tenantId,
      examinationId: o.exam.id,
      enrollmentId,
      userId: ctx.userId,
      attemptNumber: o.attempts.length + 1,
      questionIds: chosen,
      startedAt: now,
      expiresAt: o.exam.timeLimitMinutes ? new Date(now.getTime() + o.exam.timeLimitMinutes * 60_000) : null,
    })
    .returning({ id: examinationAttempts.id });
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "exam.attempt_started", entityType: "examination_attempt", entityId: a.id, after: { examId: o.exam.id, attempt: o.attempts.length + 1, questions: chosen.length } });
  return { ok: true, data: { attemptId: a.id, resumed: false } };
}

/** Attempt with questions in the attempt's order; correct answers stripped unless `reveal`. */
export async function getAttempt(tx: Tx, attemptId: string, opts: { userId?: string } = {}) {
  const [a] = await tx
    .select({ a: examinationAttempts, exam: examinations })
    .from(examinationAttempts)
    .innerJoin(examinations, eq(examinations.id, examinationAttempts.examinationId))
    .where(and(eq(examinationAttempts.id, attemptId), opts.userId ? eq(examinationAttempts.userId, opts.userId) : undefined));
  if (!a) return null;
  const qs = await tx.select().from(questions).where(inArray(questions.id, a.a.questionIds));
  const byId = new Map(qs.map((q) => [q.id, q]));
  const ordered = a.a.questionIds.map((id) => byId.get(id)!).filter(Boolean);
  const answers = await tx.select().from(examinationAnswers).where(eq(examinationAnswers.attemptId, attemptId));
  return { ...a, questions: ordered, answers: new Map(answers.map((x) => [x.questionId, x])) };
}

export async function getAttemptForLearner(tx: Tx, ctx: Ctx, attemptId: string) {
  const r = await getAttempt(tx, attemptId, { userId: ctx.userId });
  if (!r) return null;
  return { ...r, publicQuestions: r.questions.map((q) => publicQuestion({ ...q, type: q.type as QuestionType })) };
}

const responseSchema = z.union([z.string().max(5000), z.array(z.string().max(20)).max(20), z.record(z.string(), z.string().max(20)), z.null()]);

export async function saveAnswer(tx: Tx, ctx: Ctx, attemptId: string, questionId: string, response: unknown): Promise<ServiceResult<{ savedAt: Date }>> {
  const p = responseSchema.safeParse(response);
  if (!p.success) return err("Invalid answer format.");
  const [a] = await tx.select().from(examinationAttempts).where(and(eq(examinationAttempts.id, attemptId), eq(examinationAttempts.userId, ctx.userId)));
  if (!a) return err("Attempt not found.");
  if (a.submittedAt) return err("This attempt has already been submitted.");
  if (!a.questionIds.includes(questionId)) return err("Question is not part of this attempt.");
  if (a.expiresAt && Date.now() > a.expiresAt.getTime() + 60_000) return err("The time limit has expired.");
  const now = new Date();
  await tx
    .insert(examinationAnswers)
    .values({ tenantId: ctx.tenantId, attemptId, questionId, response: p.data === null ? JSON_NULL : p.data, savedAt: now })
    .onConflictDoUpdate({ target: [examinationAnswers.attemptId, examinationAnswers.questionId], set: { response: p.data === null ? JSON_NULL : p.data, savedAt: now } });
  return { ok: true, data: { savedAt: now } };
}

export async function submitAttempt(tx: Tx, ctx: Ctx, attemptId: string, finalAnswers: Record<string, unknown> = {}): Promise<ServiceResult<AttemptOutcome>> {
  const [a] = await tx.select().from(examinationAttempts).where(and(eq(examinationAttempts.id, attemptId), eq(examinationAttempts.userId, ctx.userId)));
  if (!a) return err("Attempt not found.");
  if (a.submittedAt) return err("This attempt has already been submitted.");
  const withinTime = !a.expiresAt || Date.now() <= a.expiresAt.getTime() + 60_000;
  if (withinTime) {
    for (const [qid, resp] of Object.entries(finalAnswers)) {
      if (!a.questionIds.includes(qid)) continue;
      const r = await saveAnswer(tx, ctx, attemptId, qid, resp);
      if (!r.ok) return r;
    }
  }
  return { ok: true, data: await finalizeAttempt(tx, attemptId, { submittedBy: ctx.userId, late: !withinTime }) };
}

export interface AttemptOutcome {
  attemptId: string;
  enrollmentId: string;
  tenantId: string;
  userId: string;
  gradingStatus: "AUTO_GRADED" | "PENDING_INSTRUCTOR" | "GRADED";
  scorePct: number | null;
  passed: boolean | null;
}

/** Grades every question in the attempt (unanswered = incorrect) and records the result. */
async function finalizeAttempt(tx: Tx, attemptId: string, opts: { submittedBy: string; late?: boolean }): Promise<AttemptOutcome> {
  const full = (await getAttempt(tx, attemptId))!;
  let earned = 0;
  let possible = 0;
  let pending = false;
  for (const q of full.questions) {
    possible += q.points;
    const existing = full.answers.get(q.id);
    const g = grade({ type: q.type as QuestionType, options: q.options, correctAnswer: q.correctAnswer, points: q.points }, existing?.response);
    if (g.status === "pending") pending = true;
    else earned += g.points;
    const values = { isCorrect: g.status === "pending" ? null : g.status === "correct", pointsAwarded: g.points === null ? null : g.points.toFixed(2) };
    if (existing) await tx.update(examinationAnswers).set(values).where(eq(examinationAnswers.id, existing.id));
    else await tx.insert(examinationAnswers).values({ tenantId: full.a.tenantId, attemptId, questionId: q.id, response: JSON_NULL, ...values });
  }
  // Note: answers must be graded before submitted_at is set (submitted answers are frozen).
  const score = pending ? null : scorePct(earned, possible);
  const passed = pending ? null : score! >= full.exam.passingScore;
  const gradingStatus = pending ? "PENDING_INSTRUCTOR" : "AUTO_GRADED";
  await tx.update(examinationAttempts).set({ submittedAt: new Date(), scorePct: score, passed, gradingStatus }).where(eq(examinationAttempts.id, attemptId));
  await writeAudit(tx, {
    tenantId: full.a.tenantId,
    actorUserId: opts.submittedBy,
    action: "exam.attempt_submitted",
    entityType: "examination_attempt",
    entityId: attemptId,
    after: { scorePct: score, passed, gradingStatus, late: !!opts.late },
  });
  return { attemptId, enrollmentId: full.a.enrollmentId, tenantId: full.a.tenantId, userId: full.a.userId, gradingStatus, scorePct: score, passed };
}

// ---------------------------------------------------------------------------
// Outcome effects (platform client)
// ---------------------------------------------------------------------------

/**
 * Applies a final attempt result: completes the enrollment and issues the certificate
 * when every mandatory exam is passed; marks the enrollment FAILED and notifies the
 * learner and supervisor when no attempts remain. Idempotent.
 */
export async function applyExamOutcome(sys: Db, attemptId: string): Promise<{ completed: boolean; certificateId: string | null; failed: boolean }> {
  const [a] = await sys
    .select({ a: examinationAttempts, exam: examinations, e: enrollments, courseTitle: courses.title })
    .from(examinationAttempts)
    .innerJoin(examinations, eq(examinations.id, examinationAttempts.examinationId))
    .innerJoin(enrollments, eq(enrollments.id, examinationAttempts.enrollmentId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(examinationAttempts.id, attemptId));
  if (!a || !a.a.submittedAt || a.a.passed === null) return { completed: false, certificateId: null, failed: false };

  if (a.a.passed) {
    if (a.e.status !== "COMPLETED") {
      const unpassed = await sys.execute<{ n: number }>(sql`
        select count(*)::int n from examinations x
         where x.course_version_id = ${a.e.courseVersionId} and x.is_mandatory
           and not exists (select 1 from examination_attempts t where t.enrollment_id = ${a.e.id} and t.examination_id = x.id and t.passed)`);
      if (unpassed.rows[0].n > 0) return { completed: false, certificateId: null, failed: false };
      await sys.update(enrollments).set({ status: "COMPLETED" }).where(eq(enrollments.id, a.e.id)); // DB guard re-validates
      await writeAudit(sys, { tenantId: a.e.tenantId, actorUserId: a.a.userId, action: "enrollment.completed", entityType: "enrollment", entityId: a.e.id, after: { viaAttempt: attemptId, scorePct: a.a.scorePct } });
    }
    const cert = await issueForEnrollment(sys, a.e.id);
    return { completed: true, certificateId: cert?.id ?? null, failed: false };
  }

  const [{ used }] = await sys
    .select({ used: sql<number>`count(*)::int` })
    .from(examinationAttempts)
    .where(and(eq(examinationAttempts.enrollmentId, a.e.id), eq(examinationAttempts.examinationId, a.exam.id)));
  const remaining = a.exam.maxAttempts + a.e.extraAttempts - used;
  const msgs = [
    {
      tenantId: a.e.tenantId,
      userId: a.a.userId,
      type: "exam.failed",
      title: "Examination not passed",
      body: remaining > 0
        ? `You scored ${a.a.scorePct}% on ${a.courseTitle} (passing score ${a.exam.passingScore}%). ${remaining} attempt(s) remain — review the lessons and try again.`
        : `You scored ${a.a.scorePct}% on ${a.courseTitle}. No attempts remain; your training administrator has been notified and can authorize a retake.`,
      link: `/learning/${a.e.id}/exam`,
      dedupeKey: `exam-failed:${attemptId}`,
    },
  ];
  if (remaining <= 0) {
    if (a.e.status !== "FAILED") await sys.update(enrollments).set({ status: "FAILED" }).where(eq(enrollments.id, a.e.id));
    const supervisors = await sys.execute<{ user_id: string }>(sql`
      select s.user_id from employees e join employees s on s.id = e.supervisor_id
       where e.tenant_id = ${a.e.tenantId} and e.user_id = ${a.a.userId} and s.user_id is not null`);
    for (const s of supervisors.rows) {
      msgs.push({
        tenantId: a.e.tenantId,
        userId: s.user_id,
        type: "exam.failed.supervisor",
        title: "A team member needs a retake authorization",
        body: `A direct report used all examination attempts for ${a.courseTitle}. A training administrator can authorize a retake.`,
        link: `/instructor`,
        dedupeKey: `exam-failed-sup:${attemptId}:${s.user_id}`,
      });
    }
  }
  await notify(sys, msgs);
  return { completed: false, certificateId: null, failed: remaining <= 0 };
}

// ---------------------------------------------------------------------------
// Retakes (training administrators)
// ---------------------------------------------------------------------------

export async function authorizeRetake(tx: Tx, ctx: Ctx, enrollmentId: string, extra: number, reason: string): Promise<ServiceResult<null>> {
  if (!Number.isInteger(extra) || extra < 1 || extra > 3) return err("Authorize between 1 and 3 additional attempts.");
  if (reason.trim().length < 5) return err("Give a reason for the retake authorization.");
  const [e] = await tx.select().from(enrollments).where(eq(enrollments.id, enrollmentId));
  if (!e) return err("Enrollment not found.");
  if (e.status === "COMPLETED") return err("This enrollment is already completed.");
  const updated = await tx
    .update(enrollments)
    .set({ extraAttempts: e.extraAttempts + extra, status: e.status === "FAILED" ? "AWAITING_ASSESSMENT" : e.status })
    .where(eq(enrollments.id, enrollmentId))
    .returning({ id: enrollments.id });
  if (!updated.length) return err("You do not have permission to authorize retakes.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "exam.retake_authorized", entityType: "enrollment", entityId: enrollmentId, after: { extra, reason: reason.trim() } });
  return { ok: true, data: null };
}

// ---------------------------------------------------------------------------
// Instructor grading
// ---------------------------------------------------------------------------

export async function gradingQueue(tx: Tx) {
  return tx
    .select({
      attemptId: examinationAttempts.id,
      submittedAt: examinationAttempts.submittedAt,
      attemptNumber: examinationAttempts.attemptNumber,
      learnerFirst: users.firstName,
      learnerLast: users.lastName,
      courseTitle: courses.title,
      examTitle: examinations.title,
    })
    .from(examinationAttempts)
    .innerJoin(examinations, eq(examinations.id, examinationAttempts.examinationId))
    .innerJoin(enrollments, eq(enrollments.id, examinationAttempts.enrollmentId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(users, eq(users.id, examinationAttempts.userId))
    .where(eq(examinationAttempts.gradingStatus, "PENDING_INSTRUCTOR"))
    .orderBy(asc(examinationAttempts.submittedAt));
}

export const gradeSchema = z.object({ points: z.coerce.number().min(0).max(10), comment: z.string().trim().max(2000).optional().or(z.literal("")) });

export async function gradeAnswer(tx: Tx, ctx: Ctx, attemptId: string, questionId: string, raw: unknown): Promise<ServiceResult<{ finalized: AttemptOutcome | null }>> {
  const p = gradeSchema.safeParse(raw);
  if (!p.success) return err("Enter points between 0 and the question's value.");
  const full = await getAttempt(tx, attemptId);
  if (!full) return err("Attempt not found.");
  if (full.a.gradingStatus !== "PENDING_INSTRUCTOR") return err("This attempt is not awaiting instructor grading.");
  if (full.a.userId === ctx.userId) return err("You cannot grade your own examination.");
  const q = full.questions.find((x) => x.id === questionId);
  if (!q || !INSTRUCTOR_GRADED.includes(q.type as QuestionType)) return err("Only instructor-graded questions can be graded manually.");
  if (p.data.points > q.points) return err(`Maximum for this question is ${q.points} point(s).`);
  const ans = full.answers.get(questionId)!;
  await tx
    .update(examinationAnswers)
    .set({ pointsAwarded: p.data.points.toFixed(2), isCorrect: p.data.points >= q.points, instructorComment: p.data.comment || null, gradedById: ctx.userId })
    .where(eq(examinationAnswers.id, ans.id));

  // Finalize when nothing remains ungraded.
  const remaining = await tx
    .select({ id: examinationAnswers.id })
    .from(examinationAnswers)
    .where(and(eq(examinationAnswers.attemptId, attemptId), isNull(examinationAnswers.pointsAwarded)));
  if (remaining.length > 0) return { ok: true, data: { finalized: null } };
  const all = await tx.select({ points: examinationAnswers.pointsAwarded, qid: examinationAnswers.questionId }).from(examinationAnswers).where(eq(examinationAnswers.attemptId, attemptId));
  const earned = all.reduce((s, x) => s + Number(x.points ?? 0), 0);
  const possible = full.questions.reduce((s, x) => s + x.points, 0);
  const score = scorePct(earned, possible);
  const passed = score >= full.exam.passingScore;
  await tx.update(examinationAttempts).set({ scorePct: score, passed, gradingStatus: "GRADED", gradedById: ctx.userId, gradedAt: new Date() }).where(eq(examinationAttempts.id, attemptId));
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "exam.attempt_graded", entityType: "examination_attempt", entityId: attemptId, after: { scorePct: score, passed } });
  return { ok: true, data: { finalized: { attemptId, enrollmentId: full.a.enrollmentId, tenantId: full.a.tenantId, userId: full.a.userId, gradingStatus: "GRADED", scorePct: score, passed } } };
}

// ---------------------------------------------------------------------------
// History and analytics
// ---------------------------------------------------------------------------

export async function examHistory(tx: Tx, userId: string) {
  return tx
    .select({
      attemptId: examinationAttempts.id,
      enrollmentId: examinationAttempts.enrollmentId,
      attemptNumber: examinationAttempts.attemptNumber,
      submittedAt: examinationAttempts.submittedAt,
      scorePct: examinationAttempts.scorePct,
      passed: examinationAttempts.passed,
      gradingStatus: examinationAttempts.gradingStatus,
      courseTitle: courses.title,
    })
    .from(examinationAttempts)
    .innerJoin(enrollments, eq(enrollments.id, examinationAttempts.enrollmentId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(examinationAttempts.userId, userId))
    .orderBy(desc(examinationAttempts.startedAt));
}

/** Tenant-scoped exam analytics (requires assessments.review or training.view_all to see others' attempts). */
export async function examAnalytics(tx: Tx) {
  const byCourse = await tx.execute<{ course_id: string; title: string; attempts: number; learners: number; passed: number; avg_score: number | null; failed_out: number }>(sql`
    select c.id course_id, c.title,
           count(a.id)::int attempts,
           count(distinct a.user_id)::int learners,
           count(a.id) filter (where a.passed)::int passed,
           round(avg(a.score_pct))::int avg_score,
           (select count(*)::int from enrollments e2 where e2.course_id = c.id and e2.status = 'FAILED') failed_out
      from examination_attempts a
      join enrollments e on e.id = a.enrollment_id
      join courses c on c.id = e.course_id
     where a.submitted_at is not null
     group by c.id, c.title
     order by c.title`);
  const hardest = await tx.execute<{ question_id: string; prompt: string; course: string; answered: number; correct_pct: number }>(sql`
    select q.id question_id, left(q.prompt, 140) prompt, c.title course,
           count(ans.id)::int answered,
           round(100.0 * count(ans.id) filter (where ans.is_correct) / nullif(count(ans.id), 0))::int correct_pct
      from examination_answers ans
      join examination_attempts a on a.id = ans.attempt_id and a.submitted_at is not null
      join questions q on q.id = ans.question_id
      join enrollments e on e.id = a.enrollment_id
      join courses c on c.id = e.course_id
     group by q.id, q.prompt, c.title
    having count(ans.id) >= 1
     order by correct_pct asc nulls last, answered desc
     limit 10`);
  return { byCourse: byCourse.rows, hardest: hardest.rows };
}
