import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { getPlayer } from "@/lib/learning/learner";
import { learningObjectives, lessons } from "@/db/schema";
import { Markdown } from "@/components/learning/markdown";
import { splitSlides } from "@/components/learning/lesson-content";
import { PrintButton } from "./print-button";

export const metadata = { title: "Course materials" };

/** Printable / save-as-PDF course handout (downloadable course materials). Knowledge-check answers are excluded. */
export default async function MaterialsPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(enrollmentId)) notFound();
  const ctx = await requirePermission("learning.self");
  const data = await ctx.tx(async (tx) => {
    const p = await getPlayer(tx, enrollmentId, ctx.user.id);
    if (!p) return null;
    const ids = p.flat.map((l) => l.id);
    const bodies = ids.length ? await tx.select().from(lessons).where(inArray(lessons.id, ids)) : [];
    const objectives = await tx.select().from(learningObjectives).where(eq(learningObjectives.courseVersionId, p.version.id)).orderBy(asc(learningObjectives.sortOrder));
    return { p, bodies: new Map(bodies.map((b) => [b.id, b])), objectives };
  });
  if (!data) notFound();
  const { p, bodies, objectives } = data;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/learning/${enrollmentId}?done=1`} className="text-sm font-semibold text-teal-700 hover:underline">← Back to course</Link>
        <PrintButton />
      </div>
      <header className="border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-wider text-teal-700">Complete Healthcare Innovative Training Academy · Course materials</p>
        <h1 className="mt-1 text-2xl font-bold text-navy-900">{p.course.title}</h1>
        <p className="text-sm text-slate-600">{p.course.code} · Version {p.version.versionNumber} · Prepared for {ctx.user.firstName} {ctx.user.lastName}</p>
      </header>
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-navy-900">Learning objectives</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{objectives.map((o) => <li key={o.id}>{o.text}</li>)}</ol>
      </section>
      {p.outline.map((m) => (
        <section key={m.id} className="print-break mt-10">
          <h2 className="text-xl font-bold text-navy-900">{m.title}</h2>
          {m.lessons.map((l) => {
            const b = bodies.get(l.id);
            if (!b || b.type === "KNOWLEDGE_CHECK") return null;
            return (
              <div key={l.id} className="mt-6">
                <h3 className="text-base font-semibold text-teal-700">{l.title}</h3>
                <div className="mt-2">{b.type === "PRESENTATION" ? splitSlides(b.body).map((s, i) => <div key={i} className="mb-4 border-l-2 border-slate-200 pl-4"><Markdown>{s}</Markdown></div>) : <Markdown>{b.body}</Markdown>}</div>
                {b.mediaUrl && <p className="mt-2 text-xs text-slate-500">Media: {b.mediaUrl}</p>}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
