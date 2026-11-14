import { Markdown } from "./markdown";
import { KnowledgeCheck, SlideDeck, VideoLesson, type PublicQuestion } from "./player-widgets";
import type { CheckQuestion } from "@/content/types";
import { isEmbed } from "@/lib/learning/builder";

interface LessonRow {
  id: string;
  type: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  mediaMeta: unknown;
  durationMinutes: number;
}

export function splitSlides(body: string): string[] {
  return body.split(/\n-{3,}\n/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Renders a lesson. `learner` enables tracked/interactive behavior; without it
 * (builder preview) the lesson renders read-only and knowledge-check answers are shown.
 */
export function LessonContent({
  lesson,
  learner,
}: {
  lesson: LessonRow;
  learner?: { enrollmentId: string; completed: boolean; videoPositionS: number };
}) {
  const meta = (lesson.mediaMeta ?? {}) as { questions?: CheckQuestion[]; durationSeconds?: number };
  switch (lesson.type) {
    case "PRESENTATION":
      return <SlideDeck slides={splitSlides(lesson.body).map((s, i) => <Markdown key={i}>{s}</Markdown>)} />;
    case "VIDEO":
      return (
        <div className="space-y-4">
          {lesson.mediaUrl &&
            (learner ? (
              <VideoLesson
                enrollmentId={learner.enrollmentId}
                lessonId={lesson.id}
                src={lesson.mediaUrl}
                embed={isEmbed(lesson.mediaUrl)}
                durationSeconds={meta.durationSeconds ?? lesson.durationMinutes * 60}
                resumeAt={learner.videoPositionS}
                alreadyComplete={learner.completed}
              />
            ) : (
              <p className="text-sm text-slate-600">Video: <a className="text-teal-700 underline" href={lesson.mediaUrl} target="_blank" rel="noopener noreferrer">{lesson.mediaUrl}</a></p>
            ))}
          {lesson.body && <Markdown>{lesson.body}</Markdown>}
        </div>
      );
    case "KNOWLEDGE_CHECK": {
      const qs = meta.questions ?? [];
      if (!learner) {
        return (
          <ol className="list-decimal space-y-4 pl-5 text-sm">
            {qs.map((q) => (
              <li key={q.id}>
                <p className="font-medium">{q.prompt}</p>
                <ul className="mt-1 space-y-0.5">
                  {q.options.map((o) => {
                    const ok = Array.isArray(q.correct) ? q.correct.includes(o.id) : q.correct === o.id;
                    return <li key={o.id} className={ok ? "font-semibold text-emerald-700" : ""}>{o.id}. {o.text}{ok ? " ✓" : ""}</li>;
                  })}
                </ul>
                <p className="mt-1 text-slate-600">Explanation: {q.explanation}</p>
              </li>
            ))}
          </ol>
        );
      }
      // Correct answers never leave the server.
      const publicQs: PublicQuestion[] = qs.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, multi: Array.isArray(q.correct) }));
      return (
        <div className="space-y-4">
          {lesson.body && <Markdown>{lesson.body}</Markdown>}
          <KnowledgeCheck enrollmentId={learner.enrollmentId} lessonId={lesson.id} questions={publicQs} alreadyComplete={learner.completed} />
        </div>
      );
    }
    case "DOWNLOAD":
      return (
        <div className="space-y-4">
          {lesson.body && <Markdown>{lesson.body}</Markdown>}
          {lesson.mediaUrl && (
            <a href={lesson.mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50">
              Download material
            </a>
          )}
        </div>
      );
    default:
      return <Markdown>{lesson.body}</Markdown>;
  }
}
