/**
 * AI-powered education assistant (spec §16).
 *
 * - Grounded: every request retrieves approved, published course content and/or
 *   platform regulatory rules, numbered as sources [S1]..[Sn]; the model must cite them.
 * - Distinguishes verified regulations (rule status VERIFIED with a verified date) from
 *   educational content and from items still under review.
 * - Guardrails: no diagnosis, prescribing, patient-specific advice, competency approval,
 *   certificate creation or compliance changes; PHI-like input is refused before any
 *   model call; the assistant has no write tools at all.
 * - Exam integrity: content questions are refused while the learner has an exam attempt
 *   in progress; incorrect answers are explained only once the attempt's answers are
 *   revealed to the learner (passed, or no attempts remain).
 * - Privacy: ai_interactions stores mode, source ids, refusal and token counts — never
 *   the prompt or the answer.
 */
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { aiInteractions } from "@/db/schema";
import { can, type Access } from "@/lib/rbac/access";
import { checkInput, DISCLAIMER, type Refusal } from "./guardrails";
import { AiUnavailableError, aiProvider, type AiProvider } from "./provider";

export const MODES = {
  ask: { label: "Ask about a topic", hint: "Explain a healthcare training topic using approved course content." },
  study_guide: { label: "Study guide", hint: "A structured study guide for a course or topic." },
  practice: { label: "Practice questions", hint: "New practice questions with answers (not the real exam questions)." },
  explain_answer: { label: "Explain an exam answer", hint: "Why an answer on a reviewed exam attempt was incorrect." },
  case_study: { label: "Case study", hint: "A fictional, de-identified clinical case study for discussion." },
  lesson_draft: { label: "Draft a lesson", hint: "For instructors: an outline or draft lesson for human review." },
  recommend: { label: "Course recommendations", hint: "Courses that fit a job role." },
  regulatory: { label: "Regulatory summary", hint: "Summarize regulations in the compliance library, with citations." },
  gaps: { label: "Training gaps", hint: "For administrators: where training is behind, from aggregate data." },
} as const;
export type Mode = keyof typeof MODES;

export function modesFor(access: Access): Mode[] {
  const out: Mode[] = ["ask", "study_guide", "practice", "explain_answer", "case_study", "recommend", "regulatory"];
  if (can(access, "courses.author")) out.splice(5, 0, "lesson_draft");
  if (can(access, "training.view_all") || can(access, "compliance.view")) out.push("gaps");
  return out;
}

export const requestSchema = z.object({
  mode: z.enum(Object.keys(MODES) as [Mode, ...Mode[]]),
  input: z.string().max(4000).default(""),
  courseId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined),
  position: z.string().max(80).optional().or(z.literal("")).transform((v) => v || undefined),
  attemptId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined),
  questionId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined),
});

export interface Source {
  id: string; // S1..
  kind: "LESSON" | "RULE" | "COURSE" | "DATA";
  title: string;
  ref: string; // lesson/course id, rule citation
  url?: string;
  /** For RULE: verified regulation vs not yet verified. */
  verified?: boolean;
  text: string;
}

export interface AssistantResult {
  ok: boolean;
  answer?: string;
  sources?: Omit<Source, "text">[];
  refusal?: Refusal | { code: "RATE" | "UNAVAILABLE" | "NOT_ALLOWED" | "INTEGRITY"; message: string };
  disclaimer: string;
}

export const HOURLY_LIMIT = Number(process.env.AI_HOURLY_LIMIT ?? 30);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);
const stripMd = (s: string) => s.replace(/!\[[^\]]*]\([^)]*\)/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// Retrieval (RLS applies: only platform and own-tenant published content)
// ---------------------------------------------------------------------------

async function lessonSources(tx: Tx, query: string, courseId: string | undefined, limit: number): Promise<Omit<Source, "id">[]> {
  const q = query.trim() || "overview";
  const rows = (
    await tx.execute<{ id: string; title: string; course: string; course_id: string; body: string; rank: number }>(sql`
    select l.id, l.title, c.title course, c.id course_id, l.body,
           ts_rank(to_tsvector('english', l.title || ' ' || l.body), websearch_to_tsquery('english', ${q})) rank
      from lessons l
      join modules m on m.id = l.module_id
      join courses c on c.current_version_id = m.course_version_id
     where c.status = 'PUBLISHED'
       and (${courseId ?? null}::uuid is null or c.id = ${courseId ?? null}::uuid)
       and (${courseId ?? null}::uuid is not null or to_tsvector('english', l.title || ' ' || l.body) @@ websearch_to_tsquery('english', ${q}))
     order by rank desc, m.sort_order, l.sort_order
     limit ${limit}`)
  ).rows;
  return rows.map((r) => ({ kind: "LESSON", title: `${r.course} — ${r.title}`, ref: r.course_id, text: clip(stripMd(r.body), 1800) }));
}

async function ruleSources(tx: Tx, query: string, limit: number): Promise<Omit<Source, "id">[]> {
  const q = query.trim() || "training";
  const rows = (
    await tx.execute<{ citation: string; title: string; agency: string; requirement: string; audience: string | null; frequency: string | null; verified: boolean; url: string; status: string; pending: string | null }>(sql`
    select r.citation, r.title, r.agency, r.requirement_text requirement, r.audience_text audience, r.frequency_text frequency,
           (r.compliance_status = 'VERIFIED' and r.last_verified_at is not null) verified, s.url, r.compliance_status::text status, r.pending_change_note pending
      from regulatory_rules r join regulatory_sources s on s.id = r.source_id
     where r.is_active
       and to_tsvector('english', r.citation || ' ' || r.title || ' ' || r.requirement_text || ' ' || coalesce(r.audience_text, '')) @@ websearch_to_tsquery('english', ${q})
     order by ts_rank(to_tsvector('english', r.title || ' ' || r.requirement_text), websearch_to_tsquery('english', ${q})) desc
     limit ${limit}`)
  ).rows;
  return rows.map((r) => ({
    kind: "RULE",
    title: `${r.citation} — ${r.title}`,
    ref: r.citation,
    url: r.url,
    verified: r.verified,
    text: clip(`${r.agency}. Requirement: ${r.requirement}${r.audience ? ` Applies to: ${r.audience}.` : ""}${r.frequency ? ` Frequency per source: ${r.frequency}.` : " Frequency: not stated/verified."} Verification status: ${r.verified ? "VERIFIED against the official source" : `${r.status} — not yet verified; must be confirmed by a qualified reviewer`}.${r.pending ? ` Pending change: ${r.pending}` : ""}`, 1500),
  }));
}

async function courseCatalog(tx: Tx, position: string | undefined): Promise<Omit<Source, "id">[]> {
  const rows = (
    await tx.execute<{ id: string; title: string; code: string; category: string; required: boolean }>(sql`
    select c.id, c.title, c.code, cc.name category,
           exists (select 1 from training_requirements tr where tr.course_id = c.id and tr.is_active
                    and (cardinality(tr.position_codes) = 0 or ${position ?? null}::text = any(tr.position_codes))) required
      from courses c join course_categories cc on cc.id = c.category_id
     where c.status = 'PUBLISHED' order by cc.name, c.title limit 120`)
  ).rows;
  return [{ kind: "COURSE", title: "Published course catalog", ref: "catalog", text: rows.map((r) => `${r.code} | ${r.title} | ${r.category}${r.required ? " | REQUIRED for this role by an active training requirement" : ""}`).join("\n") }];
}

async function gapData(tx: Tx): Promise<Omit<Source, "id">[]> {
  const rows = (
    await tx.execute<{ course: string; overdue: number; open: number; done: number }>(sql`
    select c.title course, count(*) filter (where ta.status = 'OVERDUE')::int overdue,
           count(*) filter (where ta.status in ('ASSIGNED','IN_PROGRESS'))::int open,
           count(*) filter (where ta.status = 'COMPLETED')::int done
      from training_assignments ta join courses c on c.id = ta.course_id group by c.title order by 2 desc, 3 desc limit 25`)
  ).rows;
  const fac = (
    await tx.execute<{ facility: string; overdue: number; employees: number }>(sql`
    select coalesce(f.name, 'No facility') facility, count(distinct ta.employee_id) filter (where ta.status = 'OVERDUE')::int overdue, count(distinct e.id)::int employees
      from employees e left join facilities f on f.id = e.primary_facility_id left join training_assignments ta on ta.employee_id = e.id
     where e.employment_status <> 'TERMINATED' group by 1 order by 2 desc limit 20`)
  ).rows;
  // Aggregates only — no employee names leave the application.
  return [
    { kind: "DATA", title: "Assignments by course (your scope)", ref: "assignments", text: rows.map((r) => `${r.course}: ${r.overdue} overdue, ${r.open} open, ${r.done} completed`).join("\n") || "No assignments." },
    { kind: "DATA", title: "Employees with overdue training by facility (your scope)", ref: "facilities", text: fac.map((r) => `${r.facility}: ${r.overdue} of ${r.employees} employees have overdue training`).join("\n") || "No employees." },
  ];
}

async function answerSource(tx: Tx, userId: string, attemptId: string, questionId: string): Promise<Omit<Source, "id"> | AssistantResult["refusal"]> {
  const [r] = (
    await tx.execute<{ submitted: boolean; passed: boolean | null; enrollment_status: string; in_attempt: boolean; prompt: string; options: unknown; correct: unknown; explanation: string; response: unknown; is_correct: boolean | null }>(sql`
    select a.submitted_at is not null submitted, a.passed, e.status::text enrollment_status, ${questionId}::uuid = any(a.question_ids) in_attempt,
           q.prompt, q.options, q.correct_answer correct, q.explanation, ans.response, ans.is_correct
      from examination_attempts a join enrollments e on e.id = a.enrollment_id
      join questions q on q.id = ${questionId}::uuid
      left join examination_answers ans on ans.attempt_id = a.id and ans.question_id = q.id
     where a.id = ${attemptId}::uuid and a.user_id = ${userId}::uuid`)
  ).rows;
  if (!r || !r.in_attempt) return { code: "NOT_ALLOWED", message: "That exam question was not found in your attempts." };
  const revealed = r.submitted && (r.passed === true || ["FAILED", "COMPLETED"].includes(r.enrollment_status));
  if (!revealed) return { code: "INTEGRITY", message: "Answers are explained after correct answers are released for this attempt (once you pass, or have used all attempts). Review the lessons in the meantime." };
  return { kind: "DATA", title: "Your examination question", ref: questionId, text: `Question: ${r.prompt}\nOptions: ${JSON.stringify(r.options)}\nLearner's answer: ${JSON.stringify(r.response)} (${r.is_correct === false ? "incorrect" : r.is_correct ? "correct" : "not auto-graded"})\nCorrect answer: ${JSON.stringify(r.correct)}\nApproved explanation: ${r.explanation}` };
}

// ---------------------------------------------------------------------------
// Prompting
// ---------------------------------------------------------------------------

const TASK: Record<Mode, string> = {
  ask: "Explain the topic for a healthcare worker, using the sources.",
  study_guide: "Write a concise study guide: key concepts, definitions, common mistakes, and a short self-check list.",
  practice: "Write 5 new multiple-choice practice questions (4 options each) with the correct answer and a one-sentence rationale. Do not reproduce any real examination question.",
  explain_answer: "Explain kindly why the learner's answer was incorrect and why the correct answer is right, based on the approved explanation and lessons. Suggest what to review.",
  case_study: "Write a short FICTIONAL, fully de-identified case study for classroom discussion (no real names, dates or identifiers), followed by 3 discussion questions and teaching points. State clearly that it is fictional and for education only.",
  lesson_draft: "Draft a lesson outline with learning objectives, sections, key points and a knowledge check, for review and approval by a qualified instructor before use. Mark it DRAFT — REQUIRES INSTRUCTOR AND CLINICAL REVIEW.",
  recommend: "Recommend courses from the catalog source for the role described, prioritizing those marked REQUIRED. Explain briefly why each fits. Only recommend courses that appear in the catalog.",
  regulatory: "Summarize the regulatory requirements in the sources that match the request. For each, give the citation, what it requires, who it applies to, and frequency only if the source states it.",
  gaps: "Identify the most significant training gaps from the aggregate data and suggest practical, prioritized next steps for administrators.",
};

function systemPrompt(mode: Mode, sources: Source[]) {
  return `You are the Complete Healthcare Training Academy education assistant for healthcare workers in Florida, USA.

Rules you must always follow:
- You provide education only. Never diagnose patients, recommend treatment or medication for a specific patient, or present yourself as a substitute for licensed clinical judgment, facility policy or a prescriber.
- You cannot approve competencies, issue certificates or credentials, or change compliance status, and must not claim that a person is competent or compliant.
- Ground your answer in the numbered SOURCES. Cite them inline as [S1], [S2]. If the sources do not cover something, say so plainly and label any general knowledge as "General educational information (not from your organization's approved content)".
- Regulations: only sources marked "VERIFIED against the official source" may be described as verified requirements. Label every other regulatory item "Not yet verified — confirm with your compliance officer". Never invent citations, frequencies or deadlines.
- Separate clearly: "Verified regulatory requirement", "Approved course content", and "Educational suggestion".
- Never request or repeat personal or patient-identifying information.
- Be concise and use plain language and short headings or lists.

TASK: ${TASK[mode]}

SOURCES:
${sources.length ? sources.map((s) => `[${s.id}] (${s.kind === "RULE" ? (s.verified ? "Regulation — VERIFIED" : "Regulation — NOT YET VERIFIED") : s.kind === "LESSON" ? "Approved course content" : s.kind === "COURSE" ? "Course catalog" : "Organization data / exam record"}) ${s.title}\n${s.text}`).join("\n\n") : "(no matching sources were found)"}`;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export interface AiCtx {
  tenantId: string;
  userId: string;
  access: Access;
}

async function log(tx: Tx, ctx: AiCtx, mode: string, extra: Partial<typeof aiInteractions.$inferInsert>) {
  await tx.insert(aiInteractions).values({ tenantId: ctx.tenantId, userId: ctx.userId, mode, ...extra });
}

export async function runAssistant(tx: Tx, ctx: AiCtx, raw: unknown, provider: AiProvider | null = aiProvider()): Promise<AssistantResult> {
  const base = { disclaimer: DISCLAIMER };
  const p = requestSchema.safeParse(raw);
  if (!p.success) return { ...base, ok: false, refusal: { code: "NOT_ALLOWED", message: "Choose what you would like help with." } };
  const r = p.data;
  if (!modesFor(ctx.access).includes(r.mode)) return { ...base, ok: false, refusal: { code: "NOT_ALLOWED", message: "That assistant mode is not available for your role." } };
  if (!provider) return { ...base, ok: false, refusal: { code: "UNAVAILABLE", message: "The AI assistant is not configured on this platform." } };

  const [{ n }] = (await tx.select({ n: sql<number>`count(*)::int` }).from(aiInteractions).where(and(eq(aiInteractions.userId, ctx.userId), gt(aiInteractions.createdAt, sql`now() - interval '1 hour'`)))) as { n: number }[];
  if (n >= HOURLY_LIMIT) return { ...base, ok: false, refusal: { code: "RATE", message: `You have reached the limit of ${HOURLY_LIMIT} assistant requests per hour. Please try again later.` } };

  const needsText = !["recommend", "gaps", "explain_answer"].includes(r.mode) || (r.mode === "recommend" && !r.position);
  const refusal = needsText || r.input.trim() ? checkInput(r.input) : null;
  if (refusal && !(refusal.code === "EMPTY" && (r.courseId || r.mode === "gaps" || r.mode === "explain_answer"))) {
    await log(tx, ctx, r.mode, { refused: true, refusalReason: refusal.code });
    return { ...base, ok: false, refusal };
  }

  if (["ask", "study_guide", "practice"].includes(r.mode)) {
    const [busy] = (await tx.execute<{ x: number }>(sql`select 1 x from examination_attempts where user_id = ${ctx.userId}::uuid and submitted_at is null and (expires_at is null or expires_at > now()) limit 1`)).rows;
    if (busy) {
      await log(tx, ctx, r.mode, { refused: true, refusalReason: "INTEGRITY" });
      return { ...base, ok: false, refusal: { code: "INTEGRITY", message: "You have an examination in progress. The assistant is unavailable for course content until you submit it." } };
    }
  }

  let raws: Omit<Source, "id">[] = [];
  switch (r.mode) {
    case "ask":
    case "study_guide":
    case "practice":
    case "case_study":
    case "lesson_draft":
      raws = [...(await lessonSources(tx, r.input, r.courseId, 6)), ...(r.mode === "ask" ? await ruleSources(tx, r.input, 3) : [])];
      break;
    case "regulatory":
      raws = await ruleSources(tx, r.input, 8);
      break;
    case "recommend":
      raws = await courseCatalog(tx, r.position);
      break;
    case "gaps":
      raws = await gapData(tx);
      break;
    case "explain_answer": {
      if (!r.attemptId || !r.questionId) return { ...base, ok: false, refusal: { code: "NOT_ALLOWED", message: "Open the assistant from a reviewed exam question." } };
      const s = await answerSource(tx, ctx.userId, r.attemptId, r.questionId);
      if (!s || !("kind" in s)) {
        await log(tx, ctx, r.mode, { refused: true, refusalReason: s?.code ?? "NOT_ALLOWED" });
        return { ...base, ok: false, refusal: s ?? undefined };
      }
      raws = [s];
      break;
    }
  }
  const sources: Source[] = raws.map((s, i) => ({ ...s, id: `S${i + 1}` }));
  const userText = r.input.trim() || (r.mode === "recommend" ? `Role: ${r.position}` : r.mode === "gaps" ? "Summarize our training gaps." : r.mode === "explain_answer" ? "Explain this question." : "Give an overview of the selected course.");

  try {
    const out = await provider.complete({ system: systemPrompt(r.mode, sources), messages: [{ role: "user", content: userText }], maxTokens: r.mode === "lesson_draft" || r.mode === "study_guide" ? 1800 : 1000 });
    const pub = sources.map(({ text: _t, ...s }) => s);
    await log(tx, ctx, r.mode, { sources: pub.map((s) => ({ kind: s.kind, ref: s.ref, verified: s.verified ?? null })), model: out.model, inputTokens: out.inputTokens, outputTokens: out.outputTokens });
    return { ...base, ok: true, answer: out.text, sources: pub };
  } catch (e) {
    await log(tx, ctx, r.mode, { refused: true, refusalReason: "UNAVAILABLE" });
    return { ...base, ok: false, refusal: { code: "UNAVAILABLE", message: e instanceof AiUnavailableError ? e.message : "The assistant is temporarily unavailable." } };
  }
}
