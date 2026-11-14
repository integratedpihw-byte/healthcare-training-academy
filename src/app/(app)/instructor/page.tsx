import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { requireTenant } from "@/lib/auth/context";
import { examAnalytics, gradingQueue } from "@/lib/assessment/engine";
import { courses, enrollments, users } from "@/db/schema";
import { Alert, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td, fmtDate } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { retakeAction } from "./actions";
import { InstructorNav } from "./nav";

export const metadata = { title: "Instructor Portal" };

export default async function InstructorPage({ searchParams }: { searchParams: Promise<{ graded?: string }> }) {
  const ctx = await requireTenant();
  const canGrade = ctx.can("assessments.grade");
  const canRetake = ctx.can("training.assign");
  const canAnalytics = ctx.can("assessments.review") || ctx.can("training.view_all");
  if (!canGrade && !canRetake && !canAnalytics) {
    if (ctx.can("training.schedule.manage") && ctx.has("instructorLed")) redirect("/instructor/classes");
    if (ctx.can("instructors.manage")) redirect("/instructor/instructors");
    if (!ctx.can("courses.author")) redirect("/forbidden?p=instructor");
  }
  const { graded } = await searchParams;
  const data = await ctx.tx(async (tx) => ({
    queue: canGrade ? await gradingQueue(tx) : [],
    failed: canRetake
      ? await tx
          .select({ id: enrollments.id, updatedAt: enrollments.updatedAt, first: users.firstName, last: users.lastName, course: courses.title })
          .from(enrollments)
          .innerJoin(users, eq(users.id, enrollments.userId))
          .innerJoin(courses, eq(courses.id, enrollments.courseId))
          .where(and(eq(enrollments.status, "FAILED")))
          .orderBy(desc(enrollments.updatedAt))
      : [],
    analytics: canAnalytics ? await examAnalytics(tx) : null,
  }));
  const totals = data.analytics?.byCourse.reduce((t, r) => ({ attempts: t.attempts + r.attempts, passed: t.passed + r.passed }), { attempts: 0, passed: 0 });
  return (
    <>
      <PageHeader title="Instructor Portal" description="Grade examinations, authorize retakes and review assessment results. Course authoring is under Course Catalog → Manage courses." />
      <InstructorNav ctx={ctx} active="home" />
      <div className="space-y-6">
        {graded && <Alert tone="green">Grading complete — final score {graded}%. The learner has been notified.</Alert>}
        {totals && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Exam attempts" value={totals.attempts} />
            <StatCard label="Pass rate" value={totals.attempts ? `${Math.round((totals.passed / totals.attempts) * 100)}%` : "—"} tone="teal" />
            <StatCard label="Awaiting grading" value={data.queue.length} tone="amber" />
            <StatCard label="Retake requests" value={data.failed.length} tone="red" />
          </div>
        )}
        {canGrade && (
          <Card title={`Grading queue (${data.queue.length})`}>
            <Table head={["Submitted", "Learner", "Course", "Attempt", ""]} empty={data.queue.length === 0 ? <EmptyState>Nothing to grade.</EmptyState> : undefined}>
              {data.queue.map((q) => (
                <tr key={q.attemptId}>
                  <Td>{fmtDate(q.submittedAt)}</Td>
                  <Td>{q.learnerFirst} {q.learnerLast}</Td>
                  <Td>{q.courseTitle}</Td>
                  <Td>{q.attemptNumber}</Td>
                  <Td className="text-right"><Link href={`/instructor/grade/${q.attemptId}`} className="font-semibold text-teal-700 hover:underline">Grade</Link></Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}
        {canRetake && (
          <Card title={`Retake requests (${data.failed.length})`}>
            {data.failed.length === 0 ? <EmptyState>No learners have exhausted their attempts.</EmptyState> : (
              <ul className="divide-y divide-slate-100">
                {data.failed.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-end justify-between gap-4 py-3">
                    <div><div className="font-medium text-navy-900">{f.first} {f.last}</div><div className="text-xs text-slate-500">{f.course} · attempts exhausted {fmtDate(f.updatedAt)}</div></div>
                    <ActionForm action={retakeAction} submitLabel="Authorize retake" variant="secondary" className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="enrollmentId" value={f.id} />
                      <Field label="Attempts" name="extra" htmlFor={`x-${f.id}`}><Select id={`x-${f.id}`} name="extra" defaultValue="1"><option value="1">1</option><option value="2">2</option><option value="3">3</option></Select></Field>
                      <Field label="Reason" name="reason" htmlFor={`r-${f.id}`}><Input id={`r-${f.id}`} name="reason" required minLength={5} placeholder="e.g. completed remediation session" /></Field>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {data.analytics && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Results by course">
              <Table head={["Course", "Learners", "Attempts", "Pass rate", "Avg score"]} empty={data.analytics.byCourse.length === 0 ? <EmptyState>No submitted attempts yet.</EmptyState> : undefined}>
                {data.analytics.byCourse.map((r) => (
                  <tr key={r.course_id}><Td>{r.title}</Td><Td>{r.learners}</Td><Td>{r.attempts}</Td><Td>{r.attempts ? Math.round((r.passed / r.attempts) * 100) : 0}%</Td><Td>{r.avg_score ?? "—"}%</Td></tr>
                ))}
              </Table>
            </Card>
            <Card title="Most-missed questions">
              <Table head={["Question", "Answered", "Correct"]} empty={data.analytics.hardest.length === 0 ? <EmptyState>No data yet.</EmptyState> : undefined}>
                {data.analytics.hardest.map((h) => <tr key={h.question_id}><Td className="text-xs">{h.prompt}<div className="text-slate-500">{h.course}</div></Td><Td>{h.answered}</Td><Td>{h.correct_pct ?? 0}%</Td></tr>)}
              </Table>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
