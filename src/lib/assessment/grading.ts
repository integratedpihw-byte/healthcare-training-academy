/**
 * Pure grading logic for all supported question types (spec §8).
 *
 * Answer formats (questions.options / questions.correct_answer / response):
 *  MULTIPLE_CHOICE, TRUE_FALSE, SCENARIO, CASE_STUDY, IMAGE_IDENTIFICATION
 *      options [{id,text}]          correct "id"                 response "id"
 *  MULTIPLE_SELECT
 *      options [{id,text}]          correct ["id",...]           response ["id",...]   (all-or-nothing)
 *  MATCHING
 *      options {left:[{id,text}], right:[{id,text}]}
 *                                   correct {leftId: rightId}    response {leftId: rightId} (partial credit)
 *  FILL_IN_BLANK
 *      options []                   correct ["accepted", ...]    response "text"  (case/space-insensitive)
 *  PRACTICAL
 *      options []                   correct {rubric: "..."}      response "text"  (instructor-graded)
 */
import { z } from "zod";

export const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MULTIPLE_SELECT",
  "MATCHING",
  "FILL_IN_BLANK",
  "SCENARIO",
  "IMAGE_IDENTIFICATION",
  "CASE_STUDY",
  "PRACTICAL",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SINGLE_CHOICE: QuestionType[] = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SCENARIO", "CASE_STUDY", "IMAGE_IDENTIFICATION"];
export const INSTRUCTOR_GRADED: QuestionType[] = ["PRACTICAL"];

export type Option = { id: string; text: string };
export type MatchingOptions = { left: Option[]; right: Option[] };

export interface GradableQuestion {
  type: QuestionType;
  options: unknown;
  correctAnswer: unknown;
  points: number;
}

export type GradeResult =
  | { status: "correct"; points: number }
  | { status: "incorrect"; points: 0 }
  | { status: "partial"; points: number }
  | { status: "pending"; points: null };

export function normalizeText(s: string) {
  return s.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/, "");
}

export function grade(q: GradableQuestion, response: unknown): GradeResult {
  if (INSTRUCTOR_GRADED.includes(q.type)) return { status: "pending", points: null };
  if (response === undefined || response === null || response === "") return { status: "incorrect", points: 0 };

  if (SINGLE_CHOICE.includes(q.type)) {
    return typeof response === "string" && response === q.correctAnswer ? { status: "correct", points: q.points } : { status: "incorrect", points: 0 };
  }
  if (q.type === "MULTIPLE_SELECT") {
    const want = new Set(Array.isArray(q.correctAnswer) ? (q.correctAnswer as string[]) : []);
    const got = new Set(Array.isArray(response) ? (response as string[]) : []);
    const ok = want.size === got.size && [...want].every((x) => got.has(x));
    return ok ? { status: "correct", points: q.points } : { status: "incorrect", points: 0 };
  }
  if (q.type === "MATCHING") {
    const key = (q.correctAnswer ?? {}) as Record<string, string>;
    const given = (typeof response === "object" ? response : {}) as Record<string, string>;
    const pairs = Object.keys(key);
    if (pairs.length === 0) return { status: "incorrect", points: 0 };
    const right = pairs.filter((l) => given[l] === key[l]).length;
    if (right === pairs.length) return { status: "correct", points: q.points };
    if (right === 0) return { status: "incorrect", points: 0 };
    return { status: "partial", points: Math.round((q.points * right * 100) / pairs.length) / 100 };
  }
  if (q.type === "FILL_IN_BLANK") {
    const accepted = (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]).filter((x): x is string => typeof x === "string").map(normalizeText);
    return typeof response === "string" && accepted.includes(normalizeText(response)) ? { status: "correct", points: q.points } : { status: "incorrect", points: 0 };
  }
  return { status: "incorrect", points: 0 };
}

/** Score as a whole-number percentage, rounded down (a 79.9% never rounds up to a pass). */
export function scorePct(earned: number, possible: number) {
  if (possible <= 0) return 0;
  return Math.floor((earned / possible) * 100 + 1e-9);
}

/** Cryptographically random selection of `count` items (Fisher–Yates with crypto RNG). */
export function pickRandom<T>(items: T[], count: number, shuffle = true): T[] {
  const a = items.slice();
  if (shuffle) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = cryptoInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a.slice(0, Math.min(count, a.length));
}

function cryptoInt(max: number) {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] % max;
}

/** Strips correct answers before questions are sent to the browser. */
export function publicQuestion(q: { id: string; type: QuestionType; prompt: string; options: unknown; imageUrl: string | null; points: number }) {
  return { id: q.id, type: q.type, prompt: q.prompt, options: q.options, imageUrl: q.imageUrl, points: q.points };
}
export type PublicExamQuestion = ReturnType<typeof publicQuestion>;

// ---------------------------------------------------------------------------
// Authoring validation
// ---------------------------------------------------------------------------

const opt = z.object({ id: z.string().trim().min(1).max(10), text: z.string().trim().min(1).max(1000) });

export const questionInputSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    prompt: z.string().trim().min(5).max(5000),
    options: z.unknown(),
    correctAnswer: z.unknown(),
    explanation: z.string().trim().min(5, "Add an explanation shown after the exam").max(3000),
    imageUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((u) => u === "" || u.startsWith("https://"), "Use an https:// image link")
      .optional(),
    points: z.coerce.number().int().min(1).max(10).default(1),
    difficulty: z.coerce.number().int().min(1).max(3).default(2),
  })
  .superRefine((q, ctx) => {
    const fail = (message: string, path = "options") => ctx.addIssue({ code: "custom", path: [path], message });
    if (SINGLE_CHOICE.includes(q.type) || q.type === "MULTIPLE_SELECT") {
      const parsed = z.array(opt).min(2).max(10).safeParse(q.options);
      if (!parsed.success) return fail("Provide 2–10 options, each with an id and text");
      const ids = new Set(parsed.data.map((o) => o.id));
      if (ids.size !== parsed.data.length) return fail("Option ids must be unique");
      if (q.type === "MULTIPLE_SELECT") {
        const c = z.array(z.string()).min(1).safeParse(q.correctAnswer);
        if (!c.success || !c.data.every((x) => ids.has(x))) fail("Select at least one correct option", "correctAnswer");
      } else if (typeof q.correctAnswer !== "string" || !ids.has(q.correctAnswer)) {
        fail("Choose the correct option", "correctAnswer");
      }
      if (q.type === "IMAGE_IDENTIFICATION" && !q.imageUrl) fail("Image identification questions need an image", "imageUrl");
    } else if (q.type === "MATCHING") {
      const parsed = z.object({ left: z.array(opt).min(2).max(10), right: z.array(opt).min(2).max(12) }).safeParse(q.options);
      if (!parsed.success) return fail("Provide at least two left items and two right items");
      const key = z.record(z.string()).safeParse(q.correctAnswer);
      const rightIds = new Set(parsed.data.right.map((r) => r.id));
      if (!key.success || !parsed.data.left.every((l) => key.data[l.id] && rightIds.has(key.data[l.id]))) fail("Match every left item to a right item", "correctAnswer");
    } else if (q.type === "FILL_IN_BLANK") {
      const c = z.array(z.string().trim().min(1)).min(1).safeParse(q.correctAnswer);
      if (!c.success) fail("List at least one accepted answer", "correctAnswer");
    } else if (q.type === "PRACTICAL") {
      const c = z.object({ rubric: z.string().trim().min(5) }).safeParse(q.correctAnswer);
      if (!c.success) fail("Describe the grading rubric for the instructor", "correctAnswer");
    }
  });
export type QuestionInput = z.infer<typeof questionInputSchema>;
