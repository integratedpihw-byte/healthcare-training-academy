import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { examOverview } from "@/lib/assessment/engine";
import { Alert, Badge, Button, ButtonLink, Card, PageHeader, Table, Td } from "@/components/ui";
import { startExamAction } from "../../exam-actions";

export const metadata = { title: "Final examination" };

export default async function ExamOverviewPage({ params, searchParams }: { params: Promise<{ enrollmentId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { enrollmentId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(enrollmentId)) notFound();
  const ctx = await requirePermission("learning.self");
  const o = await ctx.tx((tx) => examOverview(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, enrollmentId));
  if (!o) notFound();
  const { error } = await searchParams;
  const back = <Link href={`/learning/${enrollmentId}?done=1`} className="text-sm font-semibold text-teal-700 hover:underline">← Course</Link>;
  if (!o.exam) return (<><PageHeader title={o.courseTitle} actions={back} /><Alert tone="blue">This course has no final examination.</Alert></>);
  const ready = o.e.status === "AWAITING_ASSESSMENT";
  return (
    <>
      <PageHeader title={o.exam.title} description={o.courseTitle} actions={back} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {error && <Alert>{error}</Alert>}
          {o.passed && <Alert tone="green">You passed this examination. {o.e.status === "COMPLETED" ? "The course is complete — your certificate is on the Certificates page." : ""}</Alert>}
          {o.e.status === "FAILED" && <Alert>All attempts have been used. Your training administrator has been notified and can authorize a retake.</Alert>}
          {!ready && !o.passed && o.e.status !== "FAILED" && <Alert tone="blue">Complete all required lessons to unlock the final examination.</Alert>}
          <Card title="Before you begin">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              <li>{o.questionCount} questions{o.exam.randomize ? ", drawn at random from the course question bank" : ""}.</li>
              <li>Passing score: <strong>{o.exam.passingScore}%</strong>.</li>
              <li>{o.exam.timeLimitMinutes ? <>Time limit: <strong>{o.exam.timeLimitMinutes} minutes</strong>. The exam submits automatically when time runs out.</> : "No time limit."}</li>
              <li>Answers save automatically — you can leave and resume this attempt.</li>
              <li>Attempts used: {o.attempts.length} of {o.allowed}.</li>
            </ul>
            <div className="mt-5">
              {o.open ? (
                <ButtonLink href={`/learning/${enrollmentId}/exam/${o.open.id}`} variant="teal">Resume attempt {o.open.attemptNumber}</ButtonLink>
              ) : ready && !o.passed && o.remaining > 0 ? (
                <form action={startExamAction}><input type="hidden" name="enrollmentId" value={enrollmentId} /><Button type="submit" variant="teal">Start attempt {o.attempts.length + 1}</Button></form>
              ) : null}
            </div>
          </Card>
        </div>
        <Card title="Your attempts">
          {o.attempts.length === 0 ? <p className="text-sm text-slate-600">No attempts yet.</p> : (
            <Table head={["#", "Score", "Result"]}>
              {o.attempts.map((a) => (
                <tr key={a.id}>
                  <Td><Link className="text-teal-700 underline" href={`/learning/${enrollmentId}/exam/${a.id}`}>{a.attemptNumber}</Link></Td>
                  <Td>{a.scorePct === null ? "—" : `${a.scorePct}%`}</Td>
                  <Td>{!a.submittedAt ? <Badge tone="blue">In progress</Badge> : a.gradingStatus === "PENDING_INSTRUCTOR" ? <Badge tone="amber">Awaiting grading</Badge> : a.passed ? <Badge tone="green">Passed</Badge> : <Badge tone="red">Not passed</Badge>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
