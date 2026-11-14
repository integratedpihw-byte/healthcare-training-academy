import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { getAttempt } from "@/lib/assessment/engine";
import { INSTRUCTOR_GRADED, type QuestionType } from "@/lib/assessment/grading";
import { users } from "@/db/schema";
import { Badge, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { gradeAction } from "../../actions";

export const metadata = { title: "Grade examination" };

export default async function GradePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) notFound();
  const ctx = await requirePermission("assessments.grade");
  const data = await ctx.tx(async (tx) => {
    const a = await getAttempt(tx, attemptId);
    if (!a) return null;
    const [u] = await tx.select({ first: users.firstName, last: users.lastName }).from(users).where(eq(users.id, a.a.userId));
    return { a, u };
  });
  if (!data) notFound();
  const { a, u } = data;
  const manual = a.questions.filter((q) => INSTRUCTOR_GRADED.includes(q.type as QuestionType));
  return (
    <>
      <PageHeader title={`Grade: ${u?.first} ${u?.last}`} description={`${a.exam.title} · attempt ${a.a.attemptNumber}`} actions={<Link href="/instructor" className="text-sm font-semibold text-teal-700 hover:underline">← Instructor Portal</Link>} />
      <p className="mb-4 text-sm text-slate-600">Auto-graded items are already scored. Grade each instructor-graded item using its rubric; the result finalizes when all items are scored.</p>
      <div className="space-y-4">
        {manual.map((q) => {
          const ans = a.answers.get(q.id);
          const rubric = (q.correctAnswer as { rubric?: string })?.rubric;
          return (
            <Card key={q.id} title={<span className="flex items-center gap-2">{q.prompt.slice(0, 80)}{ans?.pointsAwarded !== null && ans?.pointsAwarded !== undefined && <Badge tone="green">Scored {Number(ans.pointsAwarded)}/{q.points}</Badge>}</span>}>
              <p className="whitespace-pre-line text-sm text-slate-800">{q.prompt}</p>
              <div className="mt-3 rounded bg-slate-50 p-3 text-sm"><div className="text-xs font-semibold text-slate-500">Learner response</div><p className="mt-1 whitespace-pre-line">{typeof ans?.response === "string" && ans.response ? ans.response : "No response"}</p></div>
              {rubric && <div className="mt-3 rounded bg-sky-50 p-3 text-sm"><div className="text-xs font-semibold text-slate-500">Rubric</div><p className="mt-1">{rubric}</p></div>}
              {a.a.gradingStatus === "PENDING_INSTRUCTOR" && (
                <div className="mt-4">
                  <ActionForm action={gradeAction} submitLabel="Save score" variant="teal">
                    <input type="hidden" name="attemptId" value={attemptId} />
                    <input type="hidden" name="questionId" value={q.id} />
                    <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
                      <Field label={`Points (max ${q.points})`} name="points" htmlFor={`p-${q.id}`}><Input id={`p-${q.id}`} name="points" type="number" min={0} max={q.points} step="0.5" defaultValue={ans?.pointsAwarded ?? ""} required /></Field>
                      <Field label="Feedback to learner" name="comment" htmlFor={`c-${q.id}`}><Textarea id={`c-${q.id}`} name="comment" rows={2} defaultValue={ans?.instructorComment ?? ""} /></Field>
                    </div>
                  </ActionForm>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
