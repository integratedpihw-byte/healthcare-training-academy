import Link from "next/link";
import type { getPlayer } from "@/lib/learning/learner";
import { ENROLLMENT_LABEL } from "@/lib/learning/labels";
import { Alert, Badge, ButtonLink, Card, PageHeader, fmtDate } from "@/components/ui";
import { ReviewForm } from "./review-form";

type P = NonNullable<Awaited<ReturnType<typeof getPlayer>>>;

export function CourseOverview({ p }: { p: P }) {
  const st = ENROLLMENT_LABEL[p.e.status];
  const firstIncomplete = p.flat.find((l) => p.progress.get(l.id)?.status !== "COMPLETED");
  return (
    <>
      <PageHeader title={p.course.title} description={`${p.course.code} · version ${p.version.versionNumber}`} actions={<Link href="/learning" className="text-sm font-semibold text-teal-700 hover:underline">← My Learning</Link>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {p.e.status === "COMPLETED" && <Alert tone="green">Course completed on {fmtDate(p.e.completedAt)}. Your completion is recorded in your training history.</Alert>}
          {p.e.status === "AWAITING_ASSESSMENT" && (
            <Alert tone="amber">
              All lessons are complete. Pass the final examination to complete the course.{" "}
              <Link className="font-semibold underline" href={`/learning/${p.e.id}/exam`}>Go to the final examination</Link>
            </Alert>
          )}
          {p.e.status === "FAILED" && <Alert>All examination attempts were used. Your training administrator can authorize a retake. <Link className="font-semibold underline" href={`/learning/${p.e.id}/exam`}>View attempts</Link></Alert>}
          {p.e.status === "COMPLETED" && <p className="text-sm"><Link className="font-semibold text-teal-700 underline" href="/certificates">View your certificate</Link>{p.exams.length > 0 && <> · <Link className="text-teal-700 underline" href={`/learning/${p.e.id}/exam`}>Exam results</Link></>}</p>}
          {p.e.status === "IN_PROGRESS" && firstIncomplete && <Alert tone="blue">You have lessons remaining. <Link className="font-semibold underline" href={`/learning/${p.e.id}/${firstIncomplete.id}`}>Continue</Link></Alert>}
          <Card title="Lessons">
            <ol className="space-y-4">
              {p.outline.map((m) => (
                <li key={m.id}>
                  <div className="font-medium text-navy-900">{m.title}</div>
                  <ul className="mt-1 space-y-1 text-sm">
                    {m.lessons.map((l) => {
                      const done = p.progress.get(l.id)?.status === "COMPLETED";
                      return (
                        <li key={l.id} className="flex items-center gap-2">
                          <span aria-hidden className={done ? "text-emerald-600" : "text-slate-300"}>{done ? "✓" : "○"}</span>
                          <Link href={`/learning/${p.e.id}/${l.id}`} className="text-slate-700 hover:text-teal-700 hover:underline">{l.title}</Link>
                          <span className="sr-only">{done ? "completed" : "not completed"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Status</span><Badge tone={st.tone}>{st.label}</Badge></div>
            <div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${p.e.progressPct}%` }} /></div>
            <p className="mt-1 text-right text-xs text-slate-500">{p.e.progressPct}% complete</p>
            <ButtonLink href={`/learning/${p.e.id}/materials`} variant="secondary" className="mt-4 w-full">Course materials (print / save as PDF)</ButtonLink>
          </Card>
          {p.e.status !== "NOT_STARTED" && (
            <Card title="Course feedback"><ReviewForm courseId={p.course.id} /></Card>
          )}
        </div>
      </div>
    </>
  );
}
