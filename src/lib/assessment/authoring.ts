/**
 * Exam configuration and question-bank authoring (used by the course builder in both
 * organization and platform scopes).
 *
 * Integrity rules:
 *  - Exam settings live on a course version and are frozen once that version is
 *    published (database trigger); change them in a new version.
 *  - A question that has been answered in any attempt is never edited in place —
 *    retire it and add a replacement, so historical attempts stay accurate.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { courseVersions, courses, examinationAnswers, examinations, questionBanks, questions } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { AuthorScope } from "@/lib/learning/builder";
import type { ServiceResult } from "@/lib/tenancy/service";
import { questionInputSchema } from "./grading";

const err = (error: string): ServiceResult<never> => ({ ok: false, error });

async function ownedCourse(scope: AuthorScope, courseId: string) {
  const [c] = await scope.db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), scope.tenantId ? eq(courses.tenantId, scope.tenantId) : sql`${courses.tenantId} is null`));
  return c ?? null;
}

export async function getExamAuthoring(scope: AuthorScope, courseId: string) {
  const course = await ownedCourse(scope, courseId);
  if (!course) return null;
  const [working] = await scope.db.select().from(courseVersions).where(eq(courseVersions.courseId, courseId)).orderBy(sql`${courseVersions.versionNumber} desc`).limit(1);
  const exams = await scope.db.select().from(examinations).where(eq(examinations.courseVersionId, working.id));
  const [bank] = await scope.db.select().from(questionBanks).where(eq(questionBanks.courseId, courseId)).limit(1);
  const qs = bank
    ? await scope.db
        .select({
          q: questions,
          answered: sql<number>`(select count(*)::int from examination_answers ea where ea.question_id = "questions"."id")`,
          correctPct: sql<number | null>`(select round(100.0 * count(*) filter (where ea.is_correct) / nullif(count(*), 0))::int from examination_answers ea where ea.question_id = "questions"."id")`,
        })
        .from(questions)
        .where(eq(questions.bankId, bank.id))
        .orderBy(asc(questions.createdAt))
    : [];
  return { course, working, exam: exams.find((e) => e.isFinal) ?? exams[0] ?? null, bank: bank ?? null, questions: qs };
}

export const examSettingsSchema = z.object({
  title: z.string().trim().min(3).max(200),
  passingScore: z.coerce.number().int().min(50).max(100),
  questionCount: z.coerce.number().int().min(1).max(200),
  maxAttempts: z.coerce.number().int().min(1).max(10),
  timeLimitMinutes: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(5).max(480).nullable()),
  randomize: z.coerce.boolean().default(true),
  isMandatory: z.coerce.boolean().default(true),
});

async function ensureBank(scope: AuthorScope, courseId: string, title: string) {
  const [bank] = await scope.db.select().from(questionBanks).where(eq(questionBanks.courseId, courseId)).limit(1);
  if (bank) return bank;
  const [b] = await scope.db.insert(questionBanks).values({ tenantId: scope.tenantId, courseId, name: `${title} — question bank` }).returning();
  return b;
}

export async function saveExamSettings(scope: AuthorScope, courseId: string, raw: unknown): Promise<ServiceResult<{ examId: string }>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const a = await getExamAuthoring(scope, courseId);
  if (!a) return err("Course not found.");
  if (a.working.status !== "DRAFT") return err("Exam settings can only be changed on a draft version. Create a new version first.");
  const p = examSettingsSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const bank = await ensureBank(scope, courseId, a.course.title);
  if (a.exam) {
    await scope.db.update(examinations).set(p.data).where(eq(examinations.id, a.exam.id));
    await writeAudit(scope.db, { tenantId: scope.tenantId, actorUserId: scope.userId, action: "exam.settings_updated", entityType: "examination", entityId: a.exam.id, after: p.data });
    return { ok: true, data: { examId: a.exam.id } };
  }
  const [x] = await scope.db
    .insert(examinations)
    .values({ ...p.data, tenantId: scope.tenantId, courseVersionId: a.working.id, questionBankId: bank.id, isFinal: true })
    .returning({ id: examinations.id });
  await writeAudit(scope.db, { tenantId: scope.tenantId, actorUserId: scope.userId, action: "exam.created", entityType: "examination", entityId: x.id, after: p.data });
  return { ok: true, data: { examId: x.id } };
}

/** Parses "id | text" lines. Lines without an id get a, b, c… */
export function parseOptionLines(text: string): { id: string; text: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const m = /^([A-Za-z0-9]{1,10})\s*[|)]\s*(.+)$/.exec(l);
      return m ? { id: m[1], text: m[2].trim() } : { id: String.fromCharCode(97 + i), text: l };
    });
}

/** Converts the builder's plain-text question form into the stored option/answer shapes. */
export function parseQuestionForm(fd: Record<string, unknown>) {
  const str = (k: string) => (typeof fd[k] === "string" ? (fd[k] as string) : "");
  const type = str("type");
  let options: unknown = [];
  let correctAnswer: unknown;
  if (type === "TRUE_FALSE") {
    options = [{ id: "t", text: "True" }, { id: "f", text: "False" }];
    correctAnswer = str("correct").trim().toLowerCase().startsWith("f") ? "f" : str("correct").trim() ? "t" : undefined;
  } else if (["MULTIPLE_CHOICE", "SCENARIO", "CASE_STUDY", "IMAGE_IDENTIFICATION"].includes(type)) {
    options = parseOptionLines(str("optionsText"));
    correctAnswer = str("correct").trim() || undefined;
  } else if (type === "MULTIPLE_SELECT") {
    options = parseOptionLines(str("optionsText"));
    correctAnswer = str("correct").split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
  } else if (type === "MATCHING") {
    options = { left: parseOptionLines(str("matchLeft")), right: parseOptionLines(str("matchRight")) };
    correctAnswer = Object.fromEntries(
      str("matchKey").split(/[,\n]+/).map((p) => p.split("=").map((x) => x.trim())).filter((p) => p.length === 2 && p[0] && p[1]),
    );
  } else if (type === "FILL_IN_BLANK") {
    correctAnswer = str("accepted").split("\n").map((x) => x.trim()).filter(Boolean);
  } else if (type === "PRACTICAL") {
    correctAnswer = { rubric: str("rubric").trim() };
  }
  return { type, prompt: str("prompt"), options, correctAnswer, explanation: str("explanation"), imageUrl: str("imageUrl"), points: fd.points ?? 1, difficulty: fd.difficulty ?? 2 };
}

/** Inverse of parseQuestionForm for editing. */
export function questionToForm(q: { type: string; options: unknown; correctAnswer: unknown }) {
  const lines = (o: unknown) => (Array.isArray(o) ? (o as { id: string; text: string }[]).map((x) => `${x.id} | ${x.text}`).join("\n") : "");
  const f: Record<string, string> = { optionsText: "", correct: "", matchLeft: "", matchRight: "", matchKey: "", accepted: "", rubric: "" };
  if (q.type === "MATCHING") {
    const m = q.options as { left: unknown; right: unknown };
    f.matchLeft = lines(m?.left);
    f.matchRight = lines(m?.right);
    f.matchKey = Object.entries((q.correctAnswer ?? {}) as Record<string, string>).map(([k, v]) => `${k}=${v}`).join(", ");
  } else if (q.type === "FILL_IN_BLANK") f.accepted = Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\n") : "";
  else if (q.type === "PRACTICAL") f.rubric = (q.correctAnswer as { rubric?: string })?.rubric ?? "";
  else {
    f.optionsText = lines(q.options);
    f.correct = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : String(q.correctAnswer ?? "");
  }
  return f;
}

export async function addQuestion(scope: AuthorScope, courseId: string, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const course = await ownedCourse(scope, courseId);
  if (!course) return err("Course not found.");
  const p = questionInputSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the question.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const bank = await ensureBank(scope, courseId, course.title);
  const [q] = await scope.db
    .insert(questions)
    .values({ tenantId: scope.tenantId, bankId: bank.id, type: p.data.type, prompt: p.data.prompt, options: p.data.options ?? [], correctAnswer: p.data.correctAnswer, explanation: p.data.explanation, imageUrl: p.data.imageUrl || null, points: p.data.points, difficulty: p.data.difficulty })
    .returning({ id: questions.id });
  await writeAudit(scope.db, { tenantId: scope.tenantId, actorUserId: scope.userId, action: "question.created", entityType: "question", entityId: q.id });
  return { ok: true, data: { id: q.id } };
}

async function ownedQuestion(scope: AuthorScope, questionId: string) {
  const [row] = await scope.db
    .select({ q: questions, courseId: questionBanks.courseId })
    .from(questions)
    .innerJoin(questionBanks, eq(questionBanks.id, questions.bankId))
    .innerJoin(courses, eq(courses.id, questionBanks.courseId))
    .where(and(eq(questions.id, questionId), scope.tenantId ? eq(courses.tenantId, scope.tenantId) : sql`${courses.tenantId} is null`));
  return row ?? null;
}

export async function updateQuestion(scope: AuthorScope, questionId: string, raw: unknown): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const row = await ownedQuestion(scope, questionId);
  if (!row) return err("Question not found.");
  const [{ n }] = await scope.db.select({ n: sql<number>`count(*)::int` }).from(examinationAnswers).where(eq(examinationAnswers.questionId, questionId));
  if (n > 0) return err("This question has been used in examinations and cannot be edited. Retire it and add a replacement so past results remain accurate.");
  const p = questionInputSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the question.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  await scope.db
    .update(questions)
    .set({ type: p.data.type, prompt: p.data.prompt, options: p.data.options ?? [], correctAnswer: p.data.correctAnswer, explanation: p.data.explanation, imageUrl: p.data.imageUrl || null, points: p.data.points, difficulty: p.data.difficulty })
    .where(eq(questions.id, questionId));
  await writeAudit(scope.db, { tenantId: scope.tenantId, actorUserId: scope.userId, action: "question.updated", entityType: "question", entityId: questionId });
  return { ok: true, data: null };
}

export async function setQuestionActive(scope: AuthorScope, questionId: string, active: boolean): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const row = await ownedQuestion(scope, questionId);
  if (!row) return err("Question not found.");
  await scope.db.update(questions).set({ isActive: active }).where(eq(questions.id, questionId));
  await writeAudit(scope.db, { tenantId: scope.tenantId, actorUserId: scope.userId, action: active ? "question.reactivated" : "question.retired", entityType: "question", entityId: questionId });
  return { ok: true, data: null };
}
