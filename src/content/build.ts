/**
 * Small helpers that keep course source files readable. They only build plain
 * CourseContent objects — the seeding, review workflow and exam engine are unchanged.
 */
import type { CheckQuestion, ExamQuestion, LessonContent } from "./types";

const IDS = ["a", "b", "c", "d", "e", "f"];
const opts = (texts: string[]) => texts.map((text, i) => ({ id: IDS[i], text }));

/** Multiple choice with one correct option (index into `options`). */
export const mc = (prompt: string, options: string[], correct: number, explanation: string, difficulty: 1 | 2 | 3 = 2): ExamQuestion => ({
  type: "MULTIPLE_CHOICE",
  prompt,
  options: opts(options),
  correct: IDS[correct],
  explanation,
  difficulty,
});

/** Scenario question (single correct option). */
export const sc = (prompt: string, options: string[], correct: number, explanation: string): ExamQuestion => ({ ...mc(prompt, options, correct, explanation, 3), type: "SCENARIO" });

/** Select all that apply. */
export const ms = (prompt: string, options: string[], correct: number[], explanation: string): ExamQuestion => ({
  type: "MULTIPLE_SELECT",
  prompt,
  options: opts(options),
  correct: correct.map((i) => IDS[i]),
  explanation,
  difficulty: 2,
});

export const tf = (prompt: string, answer: boolean, explanation: string): ExamQuestion => ({
  type: "TRUE_FALSE",
  prompt,
  options: [
    { id: "t", text: "True" },
    { id: "f", text: "False" },
  ],
  correct: answer ? "t" : "f",
  explanation,
  difficulty: 1,
});

export const kc = (id: string, prompt: string, options: string[], correct: number | number[], explanation: string): CheckQuestion => ({
  id,
  prompt,
  options: opts(options),
  correct: Array.isArray(correct) ? correct.map((i) => IDS[i]) : IDS[correct],
  explanation,
});

export const text = (title: string, durationMinutes: number, body: string): LessonContent => ({ title, type: "TEXT", durationMinutes, body });
export const caseStudy = (title: string, durationMinutes: number, body: string): LessonContent => ({ title, type: "CASE_STUDY", durationMinutes, body });
/** Slide presentation: slides separated by a line containing only `---`. */
export const slides = (title: string, durationMinutes: number, body: string): LessonContent => ({ title, type: "PRESENTATION", durationMinutes, body });
export const check = (title: string, questions: CheckQuestion[]): LessonContent => ({
  title,
  type: "KNOWLEDGE_CHECK",
  durationMinutes: Math.max(3, questions.length * 2),
  body: "Answer each question, then review the explanation. Knowledge checks do not count toward your final score.",
  mediaMeta: { questions },
});
