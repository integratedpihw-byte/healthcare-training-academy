"use client";
import { useActionState, useState } from "react";
import { Alert, Badge, Field, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { assistantAction, type AssistantState } from "./actions";

type ModeInfo = { key: string; label: string; hint: string };

export function AssistantForm({ modes, courses, positions, initial }: { modes: ModeInfo[]; courses: { id: string; title: string }[]; positions: { code: string; label: string }[]; initial: { mode?: string; attemptId?: string; questionId?: string; courseId?: string } }) {
  const [state, action] = useActionState<AssistantState, FormData>(assistantAction, undefined);
  const [mode, setMode] = useState(initial.mode && modes.some((m) => m.key === initial.mode) ? initial.mode : modes[0].key);
  const info = modes.find((m) => m.key === mode)!;
  const usesCourse = ["ask", "study_guide", "practice", "case_study", "lesson_draft"].includes(mode);
  const textOptional = ["recommend", "gaps", "explain_answer"].includes(mode) || usesCourse;
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <Field label="What would you like help with?" name="mode" htmlFor="ai-mode" hint={info.hint}>
          <Select id="ai-mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>{modes.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</Select>
        </Field>
        {usesCourse && (
          <Field label="Course (optional)" name="courseId" htmlFor="ai-course" hint="Limit answers to one course's approved content.">
            <Select id="ai-course" name="courseId" defaultValue={initial.courseId ?? ""}><option value="">Any published course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>
          </Field>
        )}
        {mode === "recommend" && (
          <Field label="Job role" name="position" htmlFor="ai-pos"><Select id="ai-pos" name="position" defaultValue="">{[{ code: "", label: "Describe the role below" }, ...positions].map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}</Select></Field>
        )}
        {mode === "explain_answer" && (
          <>
            <input type="hidden" name="attemptId" value={initial.attemptId ?? ""} />
            <input type="hidden" name="questionId" value={initial.questionId ?? ""} />
            {!initial.attemptId && <Alert tone="blue">Open this from a reviewed exam: My Learning → Examination history → an attempt → “Explain this answer”.</Alert>}
          </>
        )}
        <Field label={textOptional ? "Your question or topic (optional)" : "Your question or topic"} name="input" htmlFor="ai-input" hint="Do not include patient names, dates of birth, record numbers or other personal information.">
          <Textarea id="ai-input" name="input" rows={4} maxLength={4000} defaultValue={state && !state.ok ? state.input : ""} />
        </Field>
        <SubmitButton pendingText="Thinking…">Ask the assistant</SubmitButton>
      </form>
      {state?.refusal && <Alert tone={state.refusal.code === "UNAVAILABLE" || state.refusal.code === "RATE" ? "amber" : "red"}>{state.refusal.message}</Alert>}
      {state?.ok && (
        <section aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Answer</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{state.answer}</div>
          {state.sources && state.sources.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-3">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Sources</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {state.sources.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">[{s.id}]</span>
                    {s.kind === "RULE" ? <Badge tone={s.verified ? "green" : "amber"}>{s.verified ? "Verified regulation" : "Regulation — not yet verified"}</Badge> : s.kind === "LESSON" ? <Badge tone="teal">Approved course content</Badge> : <Badge tone="gray">{s.kind === "COURSE" ? "Course catalog" : "Your data"}</Badge>}
                    {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{s.title}</a> : <span>{s.title}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">{state.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
