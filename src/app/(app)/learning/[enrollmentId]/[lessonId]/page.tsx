import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck, CheckCircle2, Circle } from "lucide-react";
import { requirePermission } from "@/lib/auth/context";
import { getLesson, getPlayer } from "@/lib/learning/learner";
import { LESSON_TYPE_LABEL } from "@/lib/learning/labels";
import { LessonContent } from "@/components/learning/lesson-content";
import { TimeTracker } from "@/components/learning/player-widgets";
import { Alert, Button, ButtonLink, cn } from "@/components/ui";
import { bookmarkAction, completeLessonAction } from "../../actions";

export const metadata = { title: "Lesson" };

export default async function LessonPage({ params, searchParams }: { params: Promise<{ enrollmentId: string; lessonId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { enrollmentId, lessonId } = await params;
  if (![enrollmentId, lessonId].every((x) => /^[0-9a-f-]{36}$/i.test(x))) notFound();
  const ctx = await requirePermission("learning.self");
  const data = await ctx.tx(async (tx) => {
    const p = await getPlayer(tx, enrollmentId, ctx.user.id);
    if (!p) return null;
    const l = await getLesson(tx, p.version.id, lessonId);
    return l ? { p, l } : null;
  });
  if (!data) notFound();
  const { p, l } = data;
  const { error } = await searchParams;
  const idx = p.flat.findIndex((x) => x.id === lessonId);
  const prev = p.flat[idx - 1];
  const next = p.flat[idx + 1];
  const prog = p.progress.get(lessonId);
  const completed = prog?.status === "COMPLETED";
  const finished = p.e.status === "COMPLETED";
  const selfCompletes = !["VIDEO", "KNOWLEDGE_CHECK"].includes(l.lesson.type);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <TimeTracker enrollmentId={enrollmentId} lessonId={lessonId} />
      <aside className="no-print order-2 lg:order-1">
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4">
          <Link href={`/learning/${enrollmentId}?done=1`} className="text-sm font-semibold text-navy-900 hover:underline">{p.course.title}</Link>
          <div className="mt-2 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${p.e.progressPct}%` }} /></div>
          <p className="mt-1 text-xs text-slate-500">{p.e.progressPct}% complete</p>
          <nav aria-label="Course outline" className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
            {p.outline.map((m) => (
              <div key={m.id}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{m.title}</div>
                <ul className="mt-1 space-y-0.5">
                  {m.lessons.map((x) => {
                    const done = p.progress.get(x.id)?.status === "COMPLETED";
                    return (
                      <li key={x.id}>
                        <Link href={`/learning/${enrollmentId}/${x.id}`} aria-current={x.id === lessonId ? "page" : undefined} className={cn("flex items-start gap-2 rounded px-2 py-1 text-sm", x.id === lessonId ? "bg-teal-50 font-medium text-teal-700" : "text-slate-700 hover:bg-slate-50")}>
                          {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="completed" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-label="not completed" />}
                          <span>{x.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <article className="order-1 min-w-0 lg:order-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{l.moduleTitle} · {LESSON_TYPE_LABEL[l.lesson.type]} · {l.lesson.durationMinutes} min</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-900">{l.lesson.title}</h1>
          </div>
          <form action={bookmarkAction} className="no-print">
            <input type="hidden" name="enrollmentId" value={enrollmentId} />
            <input type="hidden" name="lessonId" value={lessonId} />
            <Button type="submit" variant="ghost" aria-pressed={!!prog?.bookmarked}>
              {prog?.bookmarked ? <BookmarkCheck className="h-4 w-4 text-teal-600" /> : <Bookmark className="h-4 w-4" />}
              {prog?.bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
          </form>
        </div>
        {error && <div className="mt-4"><Alert>{error}</Alert></div>}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <LessonContent lesson={l.lesson} learner={{ enrollmentId, completed: completed || finished, videoPositionS: prog?.videoPositionS ?? 0 }} />
        </div>
        <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-3">
          {prev ? <ButtonLink href={`/learning/${enrollmentId}/${prev.id}`} variant="secondary">← {prev.title.length > 30 ? "Previous" : prev.title}</ButtonLink> : <span />}
          <div className="flex items-center gap-3">
            {completed && <span className="flex items-center gap-1 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Completed</span>}
            {selfCompletes && !completed && !finished ? (
              <form action={completeLessonAction}>
                <input type="hidden" name="enrollmentId" value={enrollmentId} />
                <input type="hidden" name="lessonId" value={lessonId} />
                <input type="hidden" name="next" value={next?.id ?? ""} />
                <Button type="submit" variant="teal">{next ? "Mark complete & continue →" : "Mark complete & finish"}</Button>
              </form>
            ) : next ? (
              <ButtonLink href={`/learning/${enrollmentId}/${next.id}`} variant={completed ? "teal" : "secondary"}>Next →</ButtonLink>
            ) : (
              <ButtonLink href={`/learning/${enrollmentId}?done=1`} variant="teal">Course summary</ButtonLink>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
