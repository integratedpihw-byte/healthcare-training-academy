import type { getExamAuthoring } from "@/lib/assessment/authoring";
import { questionToForm } from "@/lib/assessment/authoring";
import { QUESTION_TYPES } from "@/lib/assessment/grading";
import { Alert, Badge, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { examSettingsAction, questionAction, questionActiveAction } from "@/app/(app)/builder-actions";
import { ScopeInput } from "./views";

type Kind = "tenant" | "platform";
type A = NonNullable<Awaited<ReturnType<typeof getExamAuthoring>>>;

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / false",
  MULTIPLE_SELECT: "Multiple select",
  MATCHING: "Matching",
  FILL_IN_BLANK: "Fill in the blank",
  SCENARIO: "Scenario",
  IMAGE_IDENTIFICATION: "Image identification",
  CASE_STUDY: "Case study",
  PRACTICAL: "Practical (instructor-graded)",
};

export function ExamAuthoring({ a, kind, canAuthor, error }: { a: A; kind: Kind; canAuthor: boolean; error?: string }) {
  const draft = a.working.status === "DRAFT";
  const active = a.questions.filter((q) => q.q.isActive).length;
  const x = a.exam;
  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <Card title={`Final examination — version ${a.working.versionNumber}`}>
          {!draft && <p className="mb-4 text-sm text-slate-600">Settings are frozen on {a.working.status.toLowerCase().replace("_", " ")} versions. Create a new course version to change them. The question bank below can still be maintained.</p>}
          {x && x.questionCount > active && <div className="mb-4"><Alert tone="amber">The exam asks for {x.questionCount} questions but only {active} are active; learners will receive {active}.</Alert></div>}
          {canAuthor && draft ? (
            <ActionForm action={examSettingsAction} submitLabel={x ? "Save exam settings" : "Create final examination"} variant="teal">
              <ScopeInput kind={kind} />
              <input type="hidden" name="courseId" value={a.course.id} />
              <Field label="Exam title" name="title"><Input id="title" name="title" defaultValue={x?.title ?? `${a.course.title} — Final Examination`} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Passing score (%)" name="passingScore"><Input id="passingScore" name="passingScore" type="number" min={50} max={100} defaultValue={x?.passingScore ?? a.course.passingScore} required /></Field>
                <Field label="Questions per attempt" name="questionCount"><Input id="questionCount" name="questionCount" type="number" min={1} max={200} defaultValue={x?.questionCount ?? 15} required /></Field>
                <Field label="Attempts allowed" name="maxAttempts"><Input id="maxAttempts" name="maxAttempts" type="number" min={1} max={10} defaultValue={x?.maxAttempts ?? 3} required /></Field>
                <Field label="Time limit (minutes)" name="timeLimitMinutes" hint="Blank = untimed"><Input id="timeLimitMinutes" name="timeLimitMinutes" type="number" min={5} max={480} defaultValue={x?.timeLimitMinutes ?? ""} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="randomize" defaultChecked={x?.randomize ?? true} /> Randomize question selection and order</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isMandatory" defaultChecked={x?.isMandatory ?? true} /> Mandatory — course completion and certificate require a pass</label>
            </ActionForm>
          ) : x ? (
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt>Passing score</dt><dd>{x.passingScore}%</dd></div>
              <div className="flex justify-between"><dt>Questions per attempt</dt><dd>{x.questionCount}</dd></div>
              <div className="flex justify-between"><dt>Attempts</dt><dd>{x.maxAttempts}</dd></div>
              <div className="flex justify-between"><dt>Time limit</dt><dd>{x.timeLimitMinutes ? `${x.timeLimitMinutes} min` : "None"}</dd></div>
              <div className="flex justify-between"><dt>Mandatory</dt><dd>{x.isMandatory ? "Yes" : "No"}</dd></div>
            </dl>
          ) : <p className="text-sm text-slate-600">No examination on this version.</p>}
        </Card>
        <Card title={`Question bank (${active} active of ${a.questions.length})`}>
          <ol className="space-y-3">
            {a.questions.map(({ q, answered, correctPct }, n) => (
              <li key={q.id} className={`rounded-lg border p-4 ${q.isActive ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50 opacity-70"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{n + 1}. {q.prompt}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="blue">{QUESTION_TYPE_LABEL[q.type]}</Badge>
                    {!q.isActive && <Badge>Retired</Badge>}
                    {answered > 0 && <Badge tone="teal">{answered} answers · {correctPct ?? 0}% correct</Badge>}
                  </div>
                </div>
                {canAuthor && (
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <form action={questionActiveAction}>
                      <ScopeInput kind={kind} />
                      <input type="hidden" name="courseId" value={a.course.id} />
                      <input type="hidden" name="questionId" value={q.id} />
                      <input type="hidden" name="active" value={String(!q.isActive)} />
                      <button type="submit" className="text-xs font-semibold text-slate-600 hover:underline">{q.isActive ? "Retire" : "Reactivate"}</button>
                    </form>
                    {answered === 0 ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-teal-700">Edit</summary>
                        <div className="mt-3"><QuestionForm kind={kind} courseId={a.course.id} q={q} idPrefix={`q${n}-`} /></div>
                      </details>
                    ) : <span className="text-xs text-slate-500">Used in exams — retire and add a replacement to change it.</span>}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {canAuthor && (
            <details className="mt-6 rounded-lg border border-teal-200 bg-teal-50/40 p-4" open={a.questions.length === 0}>
              <summary className="cursor-pointer text-sm font-semibold text-teal-700">Add a question</summary>
              <div className="mt-4"><QuestionForm kind={kind} courseId={a.course.id} idPrefix="new-" /></div>
            </details>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuestionForm({ kind, courseId, q, idPrefix }: { kind: Kind; courseId: string; q?: A["questions"][number]["q"]; idPrefix: string }) {
  const f = q ? questionToForm(q) : { optionsText: "", correct: "", matchLeft: "", matchRight: "", matchKey: "", accepted: "", rubric: "" };
  const fid = (n: string) => `${idPrefix}${n}`;
  return (
    <ActionForm action={questionAction} submitLabel={q ? "Save question" : "Add question"} variant={q ? "secondary" : "teal"} resetOnSuccess={!q}>
      <ScopeInput kind={kind} />
      <input type="hidden" name="courseId" value={courseId} />
      {q && <input type="hidden" name="questionId" value={q.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Question type" name="type" htmlFor={fid("type")}>
          <Select id={fid("type")} name="type" defaultValue={q?.type ?? "MULTIPLE_CHOICE"}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>)}
          </Select>
        </Field>
        <Field label="Points" name="points" htmlFor={fid("points")}><Input id={fid("points")} name="points" type="number" min={1} max={10} defaultValue={q?.points ?? 1} /></Field>
        <Field label="Difficulty (1–3)" name="difficulty" htmlFor={fid("difficulty")}><Input id={fid("difficulty")} name="difficulty" type="number" min={1} max={3} defaultValue={q?.difficulty ?? 2} /></Field>
      </div>
      <Field label="Question (scenario or case text may be included)" name="prompt" htmlFor={fid("prompt")}><Textarea id={fid("prompt")} name="prompt" rows={3} defaultValue={q?.prompt} required /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Options — choice types" name="optionsText" htmlFor={fid("optionsText")} hint="One per line: a | option text"><Textarea id={fid("optionsText")} name="optionsText" rows={4} defaultValue={f.optionsText} className="font-mono text-xs" /></Field>
        <Field label="Correct option(s)" name="correct" htmlFor={fid("correct")} hint="e.g. b — multiple select: a, c — true/false: true or false"><Input id={fid("correct")} name="correct" defaultValue={f.correct} /></Field>
        <Field label="Matching — left items" name="matchLeft" htmlFor={fid("matchLeft")} hint="1 | Lavender top"><Textarea id={fid("matchLeft")} name="matchLeft" rows={3} defaultValue={f.matchLeft} className="font-mono text-xs" /></Field>
        <Field label="Matching — right items" name="matchRight" htmlFor={fid("matchRight")} hint="a | EDTA"><Textarea id={fid("matchRight")} name="matchRight" rows={3} defaultValue={f.matchRight} className="font-mono text-xs" /></Field>
        <Field label="Matching — answer key" name="matchKey" htmlFor={fid("matchKey")} hint="1=a, 2=c"><Input id={fid("matchKey")} name="matchKey" defaultValue={f.matchKey} /></Field>
        <Field label="Fill in the blank — accepted answers" name="accepted" htmlFor={fid("accepted")} hint="One per line; case-insensitive"><Textarea id={fid("accepted")} name="accepted" rows={2} defaultValue={f.accepted} /></Field>
        <Field label="Practical — grading rubric" name="rubric" htmlFor={fid("rubric")}><Textarea id={fid("rubric")} name="rubric" rows={2} defaultValue={f.rubric} /></Field>
        <Field label="Image link (image identification)" name="imageUrl" htmlFor={fid("imageUrl")}><Input id={fid("imageUrl")} name="imageUrl" defaultValue={q?.imageUrl ?? ""} placeholder="https://" /></Field>
      </div>
      <Field label="Explanation (shown after submission)" name="explanation" htmlFor={fid("explanation")}><Textarea id={fid("explanation")} name="explanation" rows={2} defaultValue={q?.explanation} required /></Field>
    </ActionForm>
  );
}
