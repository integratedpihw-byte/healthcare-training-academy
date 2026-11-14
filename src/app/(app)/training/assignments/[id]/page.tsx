import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAnyPermission } from "@/lib/auth/context";
import { auditLogs, courses, employees, enrollments, trainingAssignments, trainingRequirements, users } from "@/db/schema";
import { SOURCE_LABELS } from "@/lib/workforce/assignments";
import { ENROLLMENT_LABEL } from "@/lib/learning/labels";
import { todayIso } from "@/lib/workforce/rules";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, Card, Field, Input, PageHeader, Select, Textarea, fmtDate, fmtDateTime } from "@/components/ui";
import { AssignmentBadge, DueDate } from "@/components/workforce/common";
import { changeDueDateAction, closeAssignmentAction } from "../../actions";

export const metadata = { title: "Training assignment" };

const MSG: Record<string, string> = { waived: "Assignment waived.", cancelled: "Assignment cancelled.", rescheduled: "Due date changed." };

export default async function AssignmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireAnyPermission(["training.view_all", "training.assign", "team.view"]);
  const d = await ctx.tx(async (tx) => {
    const [row] = await tx
      .select({ a: trainingAssignments, course: { id: courses.id, title: courses.title, code: courses.code }, emp: { id: employees.id, first: employees.firstName, last: employees.lastName, userId: employees.userId, primaryFacilityId: employees.primaryFacilityId }, requirement: trainingRequirements.title })
      .from(trainingAssignments)
      .innerJoin(courses, eq(courses.id, trainingAssignments.courseId))
      .innerJoin(employees, eq(employees.id, trainingAssignments.employeeId))
      .leftJoin(trainingRequirements, eq(trainingRequirements.id, trainingAssignments.requirementId))
      .where(eq(trainingAssignments.id, id));
    if (!row) return null;
    const enr = row.emp.userId
      ? await tx.select({ id: enrollments.id, status: enrollments.status, progressPct: enrollments.progressPct, startedAt: enrollments.startedAt, completedAt: enrollments.completedAt }).from(enrollments).where(and(eq(enrollments.userId, row.emp.userId), eq(enrollments.courseId, row.course.id))).orderBy(desc(enrollments.createdAt)).limit(3)
      : [];
    const history = ctx.can("audit.view")
      ? await tx.select({ action: auditLogs.action, at: auditLogs.createdAt, after: auditLogs.after, actor: sql<string | null>`(select u.first_name || ' ' || u.last_name from users u where u.id = ${auditLogs.actorUserId})` }).from(auditLogs).where(and(eq(auditLogs.entityType, "training_assignment"), eq(auditLogs.entityId, id))).orderBy(desc(auditLogs.createdAt)).limit(20)
      : [];
    const [assigner] = row.a.assignedById ? await tx.select({ name: sql<string>`${users.firstName} || ' ' || ${users.lastName}` }).from(users).where(eq(users.id, row.a.assignedById)) : [];
    return { ...row, enr, history, assigner: assigner?.name ?? null };
  });
  if (!d) notFound();
  const a = d.a;
  const open = ["ASSIGNED", "IN_PROGRESS", "OVERDUE"].includes(a.status);
  const canAct = open && ctx.can("training.assign");
  return (
    <>
      <PageHeader title={d.course.title} description={`Assignment for ${d.emp.first} ${d.emp.last}`} actions={<Link href={`/employees/${d.emp.id}`} className="self-center text-sm text-slate-600 hover:underline">← Employee profile</Link>} />
      {sp.msg && MSG[sp.msg] && <div className="mb-4"><Alert tone="green">{MSG[sp.msg]}</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="Assignment" actions={<AssignmentBadge status={a.status} />}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Employee</dt><dd><Link className="text-teal-700 hover:underline" href={`/employees/${d.emp.id}`}>{d.emp.first} {d.emp.last}</Link></dd>
              <dt className="text-slate-500">Course</dt><dd>{d.course.title} <span className="text-xs text-slate-500">{d.course.code}</span></dd>
              <dt className="text-slate-500">Source</dt><dd>{SOURCE_LABELS[a.source]}{d.requirement && ` — ${d.requirement}`}</dd>
              <dt className="text-slate-500">Assigned</dt><dd>{fmtDate(a.createdAt)}{d.assigner && ` by ${d.assigner}`}</dd>
              <dt className="text-slate-500">Due</dt><dd><DueDate date={a.dueDate} open={open} /></dd>
              {a.completedAt && <><dt className="text-slate-500">Completed</dt><dd>{fmtDate(a.completedAt)}</dd></>}
              {a.reason && <><dt className="text-slate-500">Reason</dt><dd>{a.reason}</dd></>}
              {a.statusReason && <><dt className="text-slate-500">{open ? "Last correction" : "Closure reason"}</dt><dd>{a.statusReason}</dd></>}
            </dl>
          </Card>
          <Card title="Course progress">
            {!d.emp.userId ? <p className="text-sm text-slate-600">The employee has no academy account, so the course cannot be started yet.</p> : d.enr.length === 0 ? <p className="text-sm text-slate-600">Not started.</p> : (
              <ul className="space-y-2 text-sm">
                {d.enr.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3">
                    <span>Enrollment {e.startedAt ? `started ${fmtDate(e.startedAt)}` : "created"} · {e.progressPct}%</span>
                    <Badge tone={ENROLLMENT_LABEL[e.status].tone}>{ENROLLMENT_LABEL[e.status].label}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">The assignment completes automatically when the enrollment is completed (all required lessons and mandatory exams). It cannot be marked complete by hand.</p>
          </Card>
          {d.history.length > 0 && (
            <Card title="History">
              <ul className="space-y-2 text-sm">
                {d.history.map((h, i) => (
                  <li key={i}><span className="font-medium text-navy-900">{h.action.replace("assignment.", "").replaceAll("_", " ")}</span> <span className="text-xs text-slate-500">{fmtDateTime(h.at, false, ctx.tenant.timeZone)}{h.actor ? ` · ${h.actor}` : " · system"}</span></li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        {canAct && (
          <div className="space-y-6">
            <Card title="Change due date">
              <ActionForm action={changeDueDateAction} submitLabel="Change due date" variant="secondary">
                <input type="hidden" name="assignmentId" value={id} />
                <Field label="New due date" name="dueDate"><Input id="dueDate" name="dueDate" type="date" required min={todayIso()} defaultValue={a.dueDate ?? ""} /></Field>
                <Field label="Reason (audited)" name="reason" htmlFor="due-reason"><Textarea id="due-reason" name="reason" rows={2} required minLength={10} maxLength={500} placeholder="e.g. Approved medical leave 11/1–11/20" /></Field>
              </ActionForm>
            </Card>
            <Card title="Close assignment">
              <ActionForm action={closeAssignmentAction} submitLabel="Close assignment" variant="danger" confirm="Close this assignment? This cannot be undone.">
                <input type="hidden" name="assignmentId" value={id} />
                <Field label="Action" name="status" htmlFor="close-status">
                  <Select id="close-status" name="status" defaultValue="CANCELLED">
                    <option value="CANCELLED">Cancel — assigned in error / no longer applicable</option>
                    {ctx.can("training.records.approve") && <option value="WAIVED">Waive — requirement met another way (documented)</option>}
                  </Select>
                </Field>
                <Field label="Reason (audited)" name="reason" htmlFor="close-reason"><Textarea id="close-reason" name="reason" rows={3} required minLength={10} maxLength={500} /></Field>
              </ActionForm>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
