import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { examOverview, getAttemptForLearner } from "@/lib/assessment/engine";
import { ExamPlayer } from "@/components/assessment/exam-player";
import { AttemptReview } from "@/components/assessment/attempt-review";
import { Alert, ButtonLink, PageHeader } from "@/components/ui";

export const metadata = { title: "Examination" };

export default async function AttemptPage({ params }: { params: Promise<{ enrollmentId: string; attemptId: string }> }) {
  const { enrollmentId, attemptId } = await params;
  if (![enrollmentId, attemptId].every((x) => /^[0-9a-f-]{36}$/i.test(x))) notFound();
  const ctx = await requirePermission("learning.self");
  const c = { tenantId: ctx.tenant.id, userId: ctx.user.id };
  const data = await ctx.tx(async (tx) => ({ att: await getAttemptForLearner(tx, c, attemptId), o: await examOverview(tx, c, enrollmentId) }));
  if (!data.att || !data.o || data.att.a.enrollmentId !== enrollmentId) notFound();
  const { att, o } = data;
  const back = <Link href={`/learning/${enrollmentId}/exam`} className="text-sm font-semibold text-teal-700 hover:underline">← Examination</Link>;

  if (!att.a.submittedAt) {
    const initial = Object.fromEntries([...att.answers.entries()].map(([k, v]) => [k, v.response]));
    return (
      <>
        <PageHeader title={att.exam.title} description={`Attempt ${att.a.attemptNumber} · ${o.courseTitle}`} actions={back} />
        <ExamPlayer enrollmentId={enrollmentId} attemptId={attemptId} questions={att.publicQuestions} initial={initial} expiresAt={att.a.expiresAt?.toISOString() ?? null} passingScore={att.exam.passingScore} />
      </>
    );
  }
  const reveal = !!att.a.passed || o.remaining === 0;
  return (
    <>
      <PageHeader title={`Attempt ${att.a.attemptNumber} results`} description={`${att.exam.title} · ${o.courseTitle}`} actions={back} />
      <div className="space-y-6">
        {att.a.gradingStatus === "PENDING_INSTRUCTOR" ? (
          <Alert tone="amber">Submitted. Some answers are graded by an instructor — you will be notified when your result is final.</Alert>
        ) : att.a.passed ? (
          <Alert tone="green"><strong>Passed — {att.a.scorePct}%.</strong> {o.e.status === "COMPLETED" ? "Your course is complete and your certificate is ready." : ""}</Alert>
        ) : (
          <Alert><strong>Not passed — {att.a.scorePct}%</strong> (passing score {att.exam.passingScore}%). {o.remaining > 0 ? `${o.remaining} attempt(s) remain. Review the explanations and the course lessons, then try again.` : "No attempts remain; your training administrator has been notified."}</Alert>
        )}
        <div className="flex gap-2">
          {att.a.passed && o.e.status === "COMPLETED" && <ButtonLink href="/certificates" variant="teal">View certificate</ButtonLink>}
          {!att.a.passed && o.remaining > 0 && att.a.gradingStatus !== "PENDING_INSTRUCTOR" && <ButtonLink href={`/learning/${enrollmentId}?done=1`} variant="secondary">Review lessons</ButtonLink>}
        </div>
        <AttemptReview questions={att.questions} answers={att.answers} revealCorrect={reveal} explainBase={ctx.has("aiAssistant") ? `/learning/assistant?mode=explain_answer&attemptId=${attemptId}` : undefined} />
      </div>
    </>
  );
}
