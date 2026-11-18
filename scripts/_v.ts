import { LIBRARY } from "../src/content";
import { COURSE_CATEGORIES } from "../src/db/seed/reference";
import { COMPETENCY_TEMPLATES } from "../src/content/competencies";
const cats = new Set(COURSE_CATEGORIES.map((c: any) => c.slug));
const comps = new Set(COMPETENCY_TEMPLATES.map((c) => c.code));
const codes = new Set<string>(); const errs: string[] = [];
for (const c of LIBRARY as any[]) {
  if (codes.has(c.code)) errs.push(`dup ${c.code}`); codes.add(c.code);
  if (!cats.has(c.categorySlug)) errs.push(`${c.code} cat`);
  for (const p of c.prerequisites) if (!LIBRARY.some((x: any) => x.code === p)) errs.push(`${c.code} prereq ${p}`);
  for (const k of c.competencyCodes ?? []) if (!comps.has(k)) errs.push(`${c.code} competency ${k}`);
  if (c.modules.length < 5) errs.push(`${c.code} modules ${c.modules.length}`);
  if (c.finalExam.questions.length < c.finalExam.questionCount) errs.push(`${c.code} exam`);
  const sum = c.modules.flatMap((m: any) => m.lessons).reduce((s: number, l: any) => s + l.durationMinutes, 0);
  const chk = (q: any, w: string) => { const ids = new Set(q.options.map((o: any) => o.id)); for (const id of [].concat(q.correct)) if (!ids.has(id)) errs.push(`${w} bad answer`); };
  c.finalExam.questions.forEach((q: any, i: number) => chk(q, `${c.code} q${i + 1}`));
  for (const m of c.modules) for (const l of m.lessons) for (const q of l.mediaMeta?.questions ?? []) chk(q, `${c.code} ${q.id}`);
  if (c.code.startsWith("CHITA-HH") || c.code.startsWith("CHITA-MH")) console.log(c.code, "modules", c.modules.length, "lesson minutes", sum, "estimated", c.estimatedMinutes);
}
console.log(LIBRARY.length, "courses;", errs.length, "errors"); errs.forEach((e) => console.log(e));
