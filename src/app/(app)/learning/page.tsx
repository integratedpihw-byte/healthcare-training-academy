import Link from "next/link";
import { requirePermission } from "@/lib/auth/context";
import { myLearning } from "@/lib/learning/learner";
import { examHistory } from "@/lib/assessment/engine";
import { listAssessments } from "@/lib/competency/service";
import { ENROLLMENT_LABEL, minutes } from "@/lib/learning/labels";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, fmtDate } from "@/components/ui";
import { myAssignments } from "@/lib/workforce/assignments";
import { employeeIdsForUser } from "@/lib/workforce/employees";
import { listLicenses } from "@/lib/workforce/licenses";
import { AssignmentBadge, DueDate } from "@/components/workforce/common";
import { enrollAction } from "./actions";
import { mySessions, openSessionsFor } from "@/lib/instructors/service";
import { selfRegisterAction } from "../instructor/class-actions";
import { Alert } from "@/components/ui";

export const metadata = { title: "My Learning" };

export default async function MyLearningPage({ searchParams }: { searchParams: Promise<{ registered?: string; classError?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePermission("learning.self");
  const { enrollments, bookmarks, exams, skills, assigned, licenses, classes, openClasses } = await ctx.tx(async (tx) => ({
    ...(await myLearning(tx, ctx.user.id)),
    exams: await examHistory(tx, ctx.user.id),
    skills: await listAssessments(tx, { mineOnly: ctx.user.id, limit: 20 }),
    assigned: await myAssignments(tx, ctx.user.id),
    classes: ctx.has("instructorLed") ? await mySessions(tx, ctx.user.id) : [],
    openClasses: ctx.has("instructorLed") ? await openSessionsFor(tx, ctx.user.id) : [],
    licenses: (await Promise.all((await employeeIdsForUser(tx, ctx.user.id)).map((id) => listLicenses(tx, id)))).flat(),
  }));
  const openAssigned = assigned.filter((a) => ["ASSIGNED", "IN_PROGRESS", "OVERDUE"].includes(a.status));
  const active = enrollments.filter((e) => ["NOT_STARTED", "IN_PROGRESS", "AWAITING_ASSESSMENT"].includes(e.status));
  const done = enrollments.filter((e) => e.status === "COMPLETED");
  return (
    <>
      <PageHeader title="My Learning" description="Pick up where you left off, review completed courses and find your bookmarks." actions={<div className="flex gap-2">{ctx.has("aiAssistant") && <ButtonLink href="/learning/assistant" variant="teal">AI study assistant</ButtonLink>}<ButtonLink href="/catalog" variant="secondary">Browse catalog</ButtonLink></div>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {sp.registered && <Alert tone="green">You are registered for the class.</Alert>}
          {sp.classError && <Alert>{sp.classError.slice(0, 200)}</Alert>}
          {(classes.length > 0 || openClasses.length > 0) && (
            <Card title="Classes">
              {classes.length > 0 && (
                <ul className="divide-y divide-slate-100 text-sm">
                  {classes.map((c) => (
                    <li key={c.s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div><div className="font-medium text-navy-900">{c.s.title}</div><div className="text-xs text-slate-500">{c.s.startsAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET · {c.s.delivery === "LIVE_VIRTUAL" ? "live online" : c.s.location}</div></div>
                      <div className="flex items-center gap-2">
                        {c.s.status === "CANCELLED" ? <Badge tone="gray">Cancelled</Badge> : <Badge tone={c.status === "PRESENT" ? "green" : c.status === "ABSENT" ? "red" : "blue"}>{c.status.toLowerCase()}</Badge>}
                        {c.s.meetingUrl && c.s.status === "SCHEDULED" && <a href={c.s.meetingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 hover:underline">Join link</a>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {openClasses.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Open classes for your courses</div>
                  <ul className="divide-y divide-slate-100 text-sm">
                    {openClasses.map((c) => (
                      <li key={c.s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <div><div className="font-medium text-navy-900">{c.s.title}</div><div className="text-xs text-slate-500">{c.s.startsAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET · {c.courseTitle}{c.s.capacity ? ` · ${Math.max(0, c.s.capacity - c.registered)} seats left` : ""}</div></div>
                        {c.s.capacity && c.registered >= c.s.capacity ? <Badge tone="gray">Full</Badge> : <form action={selfRegisterAction}><input type="hidden" name="sessionId" value={c.s.id} /><Button type="submit" variant="secondary">Register</Button></form>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
          {assigned.length > 0 && (
            <Card title={`Assigned training (${openAssigned.length} open)`}>
              {openAssigned.length === 0 ? <p className="text-sm text-slate-600">All assigned training is complete. 🎉</p> : (
                <ul className="divide-y divide-slate-100">
                  {openAssigned.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-navy-900">{a.courseTitle}</div>
                        <div className="text-xs text-slate-500">{a.courseCode} · {minutes(a.estimatedMinutes)}{a.source === "RENEWAL" && " · renewal"}</div>
                        <div className="mt-1 flex items-center gap-3 text-sm"><AssignmentBadge status={a.status} /><span className="text-slate-600">Due:</span> <DueDate date={a.dueDate} open /></div>
                      </div>
                      {a.enrollmentId ? (
                        <ButtonLink href={`/learning/${a.enrollmentId}`} variant="teal">{a.progressPct ? "Resume" : "Start"}</ButtonLink>
                      ) : (
                        <form action={enrollAction}><input type="hidden" name="courseId" value={a.courseId} /><Button type="submit" variant="teal">Start</Button></form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          <Card title={`In progress (${active.length})`}>
            {active.length === 0 ? <EmptyState>No courses in progress. <Link href="/catalog" className="text-teal-700 underline">Find a course</Link>.</EmptyState> : (
              <ul className="divide-y divide-slate-100">
                {active.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-navy-900">{e.title}</div>
                      <div className="text-xs text-slate-500">{e.code} · v{e.versionNumber} · {minutes(e.estimatedMinutes)}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 w-40 rounded-full bg-slate-200" role="progressbar" aria-valuenow={e.progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${e.title} progress`}>
                          <div className="h-2 rounded-full bg-teal-500" style={{ width: `${e.progressPct}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{e.progressPct}%</span>
                        <Badge tone={ENROLLMENT_LABEL[e.status].tone}>{ENROLLMENT_LABEL[e.status].label}</Badge>
                      </div>
                    </div>
                    <ButtonLink href={`/learning/${e.id}`} variant="teal">{e.status === "NOT_STARTED" ? "Start" : "Resume"}</ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={`Learning history (${done.length})`}>
            {done.length === 0 ? <EmptyState>Completed courses will appear here.</EmptyState> : (
              <ul className="divide-y divide-slate-100 text-sm">
                {done.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-4 py-2.5">
                    <div><div className="font-medium text-navy-900">{e.title}</div><div className="text-xs text-slate-500">{e.code} · v{e.versionNumber}</div></div>
                    <div className="text-right"><Badge tone="green">Completed</Badge><div className="mt-1 text-xs text-slate-500">{fmtDate(e.completedAt)}</div></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
        {licenses.length > 0 && (
          <Card title="My licenses & certifications">
            <ul className="space-y-2 text-sm">
              {licenses.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2">
                  <div><div className="font-medium text-navy-900">{l.name}</div><div className="text-xs text-slate-500">{l.issuingAuthority}</div></div>
                  <div className="text-right text-xs">{l.expiresOn ? <DueDate date={l.expiresOn} open /> : "No expiry"}</div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Recorded by your administrator. Send renewed licenses to them to keep your record current.</p>
          </Card>
        )}
        <Card title={`Bookmarks (${bookmarks.length})`}>
          {bookmarks.length === 0 ? <p className="text-sm text-slate-600">Bookmark lessons from the course player to find them quickly.</p> : (
            <ul className="space-y-2 text-sm">
              {bookmarks.map((b) => (
                <li key={b.lessonId + b.enrollmentId}><Link href={`/learning/${b.enrollmentId}/${b.lessonId}`} className="font-medium text-teal-700 hover:underline">{b.lessonTitle}</Link><div className="text-xs text-slate-500">{b.courseTitle}</div></li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Examination history">
          {exams.length === 0 ? <p className="text-sm text-slate-600">No examinations taken yet.</p> : (
            <ul className="space-y-2 text-sm">
              {exams.map((x) => (
                <li key={x.attemptId} className="flex items-center justify-between gap-2">
                  <Link href={`/learning/${x.enrollmentId}/exam/${x.attemptId}`} className="text-teal-700 hover:underline">{x.courseTitle} · #{x.attemptNumber}</Link>
                  {!x.submittedAt ? <Badge tone="blue">In progress</Badge> : x.gradingStatus === "PENDING_INSTRUCTOR" ? <Badge tone="amber">Grading</Badge> : <Badge tone={x.passed ? "green" : "red"}>{x.scorePct}%</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="My skills evaluations">
          {skills.filter((s) => s.status !== "DRAFT").length === 0 ? <p className="text-sm text-slate-600">Signed practical evaluations by your supervisor or instructor appear here.</p> : (
            <ul className="space-y-2 text-sm">
              {skills.filter((s) => s.status !== "DRAFT").map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <Link href={`/competency/${s.id}`} className="text-teal-700 hover:underline">{s.competency}</Link>
                  <Badge tone={s.status === "VOIDED" ? "gray" : s.result === "PASS" ? "green" : s.result === "FAIL" ? "red" : "amber"}>{s.status === "VOIDED" ? "Voided" : s.result.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      </div>
    </>
  );
}
