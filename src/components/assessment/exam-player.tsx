"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAnswerAction, submitExamAction } from "@/app/(app)/learning/exam-actions";
import { Alert, Button, Input, Select, cn } from "@/components/ui";
import type { PublicExamQuestion } from "@/lib/assessment/grading";

type Opt = { id: string; text: string };
type Answers = Record<string, unknown>;

/**
 * Exam taking UI: one question per screen with a navigator, autosave on every change,
 * countdown when a time limit applies (auto-submits at zero), and a submit review.
 */
export function ExamPlayer({
  enrollmentId,
  attemptId,
  questions,
  initial,
  expiresAt,
  passingScore,
}: {
  enrollmentId: string;
  attemptId: string;
  questions: PublicExamQuestion[];
  initial: Answers;
  expiresAt: string | null;
  passingScore: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initial);
  const [i, setI] = useState(0);
  const [saving, setSaving] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const submitted = useRef(false);

  const deadline = expiresAt ? new Date(expiresAt).getTime() : null;
  const left = deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : null;

  const answered = (q: PublicExamQuestion) => {
    const a = answers[q.id];
    if (a === undefined || a === null || a === "") return false;
    if (Array.isArray(a)) return a.length > 0;
    if (typeof a === "object") return Object.keys(a as object).length > 0;
    return true;
  };
  const unanswered = useMemo(() => questions.filter((q) => !answered(q)).length, [answers, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSubmit = () => {
    if (submitted.current) return;
    submitted.current = true;
    start(async () => {
      const r = await submitExamAction({ enrollmentId, attemptId, answers });
      if (!r.ok) {
        submitted.current = false;
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  useEffect(() => {
    if (left === 0) doSubmit();
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAnswer = (qid: string, value: unknown) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setSaving((s) => ({ ...s, [qid]: "saving" }));
    void saveAnswerAction({ attemptId, questionId: qid, response: value }).then((r) => setSaving((s) => ({ ...s, [qid]: r.ok ? "saved" : "error" })));
  };

  const q = questions[i];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Question {i + 1} of {questions.length} · {q.points} point{q.points > 1 ? "s" : ""}</span>
            <span aria-live="polite">{saving[q.id] === "saving" ? "Saving…" : saving[q.id] === "saved" ? "Saved" : saving[q.id] === "error" ? "Not saved" : ""}</span>
          </div>
          <QuestionView q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Button type="button" variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>← Previous</Button>
          {i < questions.length - 1 ? (
            <Button type="button" variant="secondary" onClick={() => setI(i + 1)}>Next →</Button>
          ) : (
            <Button type="button" variant="teal" onClick={() => setConfirming(true)}>Review and submit</Button>
          )}
        </div>
        {error && <div className="mt-4"><Alert>{error}</Alert></div>}
        {confirming && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-5" role="dialog" aria-label="Submit examination">
            <p className="text-sm text-amber-900">
              {unanswered > 0 ? <><strong>{unanswered} question(s) unanswered.</strong> Unanswered questions are scored as incorrect. </> : "All questions answered. "}
              You need {passingScore}% to pass. Submitted answers cannot be changed.
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="teal" onClick={doSubmit} disabled={pending}>{pending ? "Submitting…" : "Submit examination"}</Button>
              <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>Keep working</Button>
            </div>
          </div>
        )}
      </div>
      <aside className="space-y-4">
        {left !== null && (
          <div className={cn("rounded-xl border p-4 text-center", left < 120 ? "border-red-300 bg-red-50" : "border-slate-200 bg-white")} role="timer" aria-label="Time remaining">
            <div className="text-xs uppercase tracking-wide text-slate-500">Time remaining</div>
            <div className="text-2xl font-bold tabular-nums text-navy-900">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>
          </div>
        )}
        <nav aria-label="Questions" className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 text-xs text-slate-500">{questions.length - unanswered} of {questions.length} answered</div>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((x, n) => (
              <button key={x.id} type="button" onClick={() => setI(n)} aria-label={`Question ${n + 1}${answered(x) ? ", answered" : ""}`} aria-current={n === i}
                className={cn("h-8 rounded text-xs font-semibold", n === i ? "ring-2 ring-teal-500" : "", answered(x) ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                {n + 1}
              </button>
            ))}
          </div>
          <Button type="button" variant="teal" className="mt-4 w-full" onClick={() => setConfirming(true)}>Submit</Button>
        </nav>
      </aside>
    </div>
  );
}

function QuestionView({ q, value, onChange }: { q: PublicExamQuestion; value: unknown; onChange: (v: unknown) => void }) {
  const opts = Array.isArray(q.options) ? (q.options as Opt[]) : [];
  return (
    <fieldset className="mt-3">
      <legend className="whitespace-pre-line text-base font-medium text-slate-900">{q.prompt}</legend>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {q.imageUrl && <img src={q.imageUrl} alt="Question image" className="mt-3 max-h-80 rounded border border-slate-200" />}
      <div className="mt-4 space-y-2">
        {(q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" || q.type === "SCENARIO" || q.type === "CASE_STUDY" || q.type === "IMAGE_IDENTIFICATION") &&
          opts.map((o) => (
            <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm", value === o.id ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50")}>
              <input type="radio" name={q.id} checked={value === o.id} onChange={() => onChange(o.id)} className="mt-0.5" />
              <span>{o.text}</span>
            </label>
          ))}
        {q.type === "MULTIPLE_SELECT" && (
          <>
            <p className="text-xs text-slate-500">Select all that apply.</p>
            {opts.map((o) => {
              const cur = new Set(Array.isArray(value) ? (value as string[]) : []);
              return (
                <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm", cur.has(o.id) ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50")}>
                  <input type="checkbox" checked={cur.has(o.id)} onChange={(e) => { if (e.target.checked) cur.add(o.id); else cur.delete(o.id); onChange([...cur]); }} className="mt-0.5" />
                  <span>{o.text}</span>
                </label>
              );
            })}
          </>
        )}
        {q.type === "MATCHING" && (() => {
          const m = q.options as { left: Opt[]; right: Opt[] };
          const cur = (value && typeof value === "object" ? value : {}) as Record<string, string>;
          return (
            <div className="space-y-3">
              {m.left.map((l) => (
                <div key={l.id} className="grid items-center gap-2 sm:grid-cols-2">
                  <span className="text-sm">{l.text}</span>
                  <Select aria-label={`Match for ${l.text}`} value={cur[l.id] ?? ""} onChange={(e) => onChange({ ...cur, [l.id]: e.target.value })}>
                    <option value="">Choose…</option>
                    {m.right.map((r) => <option key={r.id} value={r.id}>{r.text}</option>)}
                  </Select>
                </div>
              ))}
            </div>
          );
        })()}
        {q.type === "FILL_IN_BLANK" && (
          <Input aria-label="Your answer" defaultValue={typeof value === "string" ? value : ""} onBlur={(e) => onChange(e.target.value)} placeholder="Type your answer" maxLength={200} />
        )}
        {q.type === "PRACTICAL" && (
          <>
            <p className="text-xs text-slate-500">This item is graded by an instructor. Describe your response or the steps you would take.</p>
            <textarea aria-label="Your response" className="block w-full rounded-md border border-slate-300 p-3 text-sm" rows={6} defaultValue={typeof value === "string" ? value : ""} onBlur={(e) => onChange(e.target.value)} maxLength={5000} />
          </>
        )}
      </div>
    </fieldset>
  );
}
