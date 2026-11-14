"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { knowledgeCheckAction, progressAction } from "@/app/(app)/learning/actions";
import { Alert, Button, cn } from "@/components/ui";
import type { CheckQuestion } from "@/content/types";

/** Sends time-on-lesson heartbeats every 60 s while the tab is visible. */
export function TimeTracker({ enrollmentId, lessonId }: { enrollmentId: string; lessonId: string }) {
  useEffect(() => {
    let last = Date.now();
    const flush = () => {
      const secs = Math.round((Date.now() - last) / 1000);
      last = Date.now();
      if (secs >= 5) void progressAction({ enrollmentId, lessonId, secondsSpent: secs });
    };
    const id = setInterval(() => document.visibilityState === "visible" && flush(), 60_000);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [enrollmentId, lessonId]);
  return null;
}

/** Slide deck for PRESENTATION lessons (slides separated by `---`). Rendered slides come from the server. */
export function SlideDeck({ slides }: { slides: React.ReactNode[] }) {
  const [i, setI] = useState(0);
  const total = slides.length;
  return (
    <div>
      <div className="min-h-[18rem] rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-live="polite" aria-roledescription="slide" aria-label={`Slide ${i + 1} of ${total}`}>
        {slides[i]}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Button type="button" variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>← Previous</Button>
        <div className="flex items-center gap-1.5" aria-hidden>
          {slides.map((_, n) => (
            <span key={n} className={cn("h-2 w-2 rounded-full", n === i ? "bg-teal-500" : n < i ? "bg-navy-600" : "bg-slate-300")} />
          ))}
        </div>
        <Button type="button" variant="secondary" disabled={i === total - 1} onClick={() => setI(i + 1)}>Next →</Button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">Slide {i + 1} of {total}</p>
    </div>
  );
}

/**
 * Tracked video. Direct media files report real playback position; embedded players
 * (YouTube/Vimeo) fall back to time-on-lesson because their position is not exposed.
 */
export function VideoLesson({
  enrollmentId,
  lessonId,
  src,
  embed,
  durationSeconds,
  resumeAt,
  alreadyComplete,
}: {
  enrollmentId: string;
  lessonId: string;
  src: string;
  embed: boolean;
  durationSeconds: number;
  resumeAt: number;
  alreadyComplete: boolean;
}) {
  const router = useRouter();
  const ref = useRef<HTMLVideoElement>(null);
  const [pos, setPos] = useState(resumeAt);
  const [dur, setDur] = useState(durationSeconds);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const lastSent = useRef(0);
  const opened = useRef(Date.now());

  useEffect(() => {
    if (!embed) return;
    const id = setInterval(() => setPos(resumeAt + Math.round((Date.now() - opened.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [embed, resumeAt]);

  const canComplete = alreadyComplete || (dur > 0 && pos >= dur * 0.9);
  const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl bg-black">
        {embed ? (
          <iframe src={toEmbedUrl(src)} title="Lesson video" className="aspect-video w-full" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <video
            ref={ref}
            src={src}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.duration && Number.isFinite(v.duration)) setDur(Math.round(v.duration));
              if (resumeAt > 5 && resumeAt < v.duration - 5) v.currentTime = resumeAt;
            }}
            onTimeUpdate={(e) => {
              const t = Math.round(e.currentTarget.currentTime);
              setPos((p) => Math.max(p, t));
              if (t - lastSent.current >= 15) {
                lastSent.current = t;
                void progressAction({ enrollmentId, lessonId, videoPositionS: t, videoDurationS: dur });
              }
            }}
          />
        )}
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-600"><span>{embed ? "Time on lesson" : "Watched"}</span><span>{pct}%</span></div>
        <div className="mt-1 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${pct}%` }} /></div>
      </div>
      {error && <Alert>{error}</Alert>}
      {!alreadyComplete && (
        <Button
          type="button"
          variant="teal"
          disabled={!canComplete || pending}
          onClick={() =>
            start(async () => {
              const r = await progressAction({ enrollmentId, lessonId, videoPositionS: pos, videoDurationS: dur, complete: true });
              if (!r.ok) setError(r.error ?? "Could not save progress");
              else router.refresh();
            })
          }
        >
          {canComplete ? "Mark video complete" : "Watch at least 90% to complete"}
        </Button>
      )}
    </div>
  );
}

function toEmbedUrl(url: string) {
  const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/embed\/)([\w-]{6,})/.exec(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;
  const vm = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

/** Formative knowledge check graded on the server; retry until all answers are correct. */
export type PublicQuestion = Pick<CheckQuestion, "id" | "prompt" | "options"> & { multi: boolean };

export function KnowledgeCheck({ enrollmentId, lessonId, questions, alreadyComplete }: { enrollmentId: string; lessonId: string; questions: PublicQuestion[]; alreadyComplete: boolean }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [results, setResults] = useState<Record<string, { correct: boolean; explanation: string }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allCorrect, setAllCorrect] = useState(alreadyComplete);
  const [pending, start] = useTransition();
  const qs = questions;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await knowledgeCheckAction({ enrollmentId, lessonId, answers });
          if (!r.ok) return setError(r.error);
          setResults(Object.fromEntries(r.data.results.map((x) => [x.id, x])));
          setAllCorrect(r.data.allCorrect);
          if (r.data.allCorrect) router.refresh();
        });
      }}
    >
      {qs.map((q, n) => {
        const res = results?.[q.id];
        return (
          <fieldset key={q.id} className={cn("rounded-xl border p-5", res ? (res.correct ? "border-emerald-300 bg-emerald-50/40" : "border-red-300 bg-red-50/40") : "border-slate-200 bg-white")}>
            <legend className="px-1 text-sm font-semibold text-navy-900">Question {n + 1}</legend>
            <p className="mb-3 text-slate-800">{q.prompt}</p>
            {q.multi && <p className="mb-2 text-xs text-slate-500">Select all that apply.</p>}
            <div className="space-y-2">
              {q.options.map((o) => {
                const checked = q.multi ? ((answers[q.id] as string[] | undefined) ?? []).includes(o.id) : answers[q.id] === o.id;
                return (
                  <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm", checked ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50")}>
                    <input
                      type={q.multi ? "checkbox" : "radio"}
                      name={q.id}
                      value={o.id}
                      checked={checked}
                      className="mt-0.5"
                      onChange={(e) =>
                        setAnswers((a) => {
                          if (!q.multi) return { ...a, [q.id]: o.id };
                          const cur = new Set((a[q.id] as string[] | undefined) ?? []);
                          if (e.target.checked) cur.add(o.id);
                          else cur.delete(o.id);
                          return { ...a, [q.id]: [...cur] };
                        })
                      }
                    />
                    <span>{o.text}</span>
                  </label>
                );
              })}
            </div>
            {res && (
              <p className={cn("mt-3 text-sm", res.correct ? "text-emerald-800" : "text-red-800")} role="status">
                <strong>{res.correct ? "Correct. " : "Not quite. "}</strong>
                {res.correct ? res.explanation : "Review the lesson and try again."}
              </p>
            )}
          </fieldset>
        );
      })}
      {error && <Alert>{error}</Alert>}
      {allCorrect ? (
        <Alert tone="green">Knowledge check complete. Continue to the next lesson.</Alert>
      ) : (
        <Button type="submit" variant="teal" disabled={pending || qs.some((q) => !answers[q.id] || (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0))}>
          {pending ? "Checking…" : results ? "Check again" : "Check answers"}
        </Button>
      )}
    </form>
  );
}
