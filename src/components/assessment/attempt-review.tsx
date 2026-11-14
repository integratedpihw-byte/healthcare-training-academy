import { Badge } from "@/components/ui";

type Q = { id: string; type: string; prompt: string; options: unknown; correctAnswer: unknown; explanation: string; points: number };
type A = { response: unknown; isCorrect: boolean | null; pointsAwarded: string | null; instructorComment: string | null };
type Opt = { id: string; text: string };

function describe(q: Q, value: unknown): string {
  if (value === null || value === undefined || value === "") return "No answer";
  if (q.type === "MATCHING") {
    const m = q.options as { left: Opt[]; right: Opt[] };
    const v = value as Record<string, string>;
    return m.left.map((l) => `${l.text} → ${m.right.find((r) => r.id === v[l.id])?.text ?? "—"}`).join("; ");
  }
  if (q.type === "FILL_IN_BLANK" || q.type === "PRACTICAL") return Array.isArray(value) ? value.join(" / ") : typeof value === "object" ? "" : String(value);
  const opts = Array.isArray(q.options) ? (q.options as Opt[]) : [];
  const ids = Array.isArray(value) ? (value as string[]) : [String(value)];
  return ids.map((id) => opts.find((o) => o.id === id)?.text ?? id).join("; ");
}

/** Post-submission review with explanations. Correct answers are revealed only after passing or the final attempt. */
export function AttemptReview({ questions, answers, revealCorrect, explainBase }: { questions: Q[]; answers: Map<string, A>; revealCorrect: boolean; explainBase?: string }) {
  return (
    <ol className="space-y-4">
      {questions.map((q, n) => {
        const a = answers.get(q.id);
        const tone = a?.isCorrect === null || a?.isCorrect === undefined ? (a?.pointsAwarded && Number(a.pointsAwarded) > 0 ? "amber" : "gray") : a.isCorrect ? "green" : "red";
        return (
          <li key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-line text-sm font-medium text-slate-900">{n + 1}. {q.prompt}</p>
              <Badge tone={tone as "green"}>{a?.pointsAwarded === null || a?.pointsAwarded === undefined ? "Pending" : `${Number(a.pointsAwarded)} / ${q.points}`}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-700"><span className="text-slate-500">Your answer:</span> {describe(q, a?.response)}</p>
            {revealCorrect && q.type !== "PRACTICAL" && <p className="mt-1 text-sm text-emerald-800"><span className="text-slate-500">Correct answer:</span> {describe(q, q.correctAnswer)}</p>}
            <p className="mt-2 rounded bg-sky-50 px-3 py-2 text-sm text-navy-900"><strong>Explanation:</strong> {q.explanation}</p>
            {explainBase && revealCorrect && a?.isCorrect === false && <a href={`${explainBase}&questionId=${q.id}`} className="mt-1 inline-block text-xs font-semibold text-teal-700 hover:underline">Explain this answer with the AI assistant</a>}
            {a?.instructorComment && <p className="mt-2 text-sm text-slate-700"><strong>Instructor:</strong> {a.instructorComment}</p>}
          </li>
        );
      })}
    </ol>
  );
}
