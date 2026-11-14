import Link from "next/link";
import { sql } from "drizzle-orm";
import { requireTenant } from "@/lib/auth/context";
import { facilityScope } from "@/lib/rbac/access";
import { adminDashboard, directReports, latestNotifications, myEmployeeRecord } from "@/lib/dashboard/queries";
import { Alert, Badge, ButtonLink, Card, EmptyState, FACILITY_TYPE_LABELS, PageHeader, StatCard, Table, Td, fmtDate, fmtDateTime } from "@/components/ui";
import { assignmentStats, listAssignments, myAssignments } from "@/lib/workforce/assignments";
import { complianceFor } from "@/lib/workforce/compliance";
import { evaluateCompliance } from "@/lib/compliance/service";
import { memo } from "@/lib/memo";
import { AssignmentBadge, ComplianceBadge, DueDate } from "@/components/workforce/common";

export const metadata = { title: "Dashboard" };

type Kind = "admin" | "supervisor" | "instructor" | "learner";

export default async function DashboardPage() {
  const ctx = await requireTenant();
  const kind: Kind =
    ctx.can("org.settings.manage") || ctx.can("training.view_all") && ctx.can("training.assign")
      ? "admin"
      : ctx.can("training.records.approve")
        ? "supervisor"
        : ctx.can("courses.author") || ctx.can("assessments.grade")
          ? "instructor"
          : "learner";

  const greeting = `Welcome back, ${ctx.user.firstName}`;
  const securityNudge = !ctx.user.mfaEnabled && kind !== "learner" && (
    <Alert tone="amber">
      Best practice: administrators should protect their accounts with two-step verification.{" "}
      <Link href="/settings/security" className="font-semibold underline">Enable it now</Link>.
    </Alert>
  );

  if (kind === "admin") {
    const scope = facilityScope(ctx.access, "employees.view");
    const canTraining = ctx.can("training.view_all") || ctx.can("training.assign");
    const { d, t } = await ctx.tx(async (tx) => {
      const d = await adminDashboard(tx, scope, ctx.can("audit.view"));
      if (!canTraining) return { d, t: null };
      const overdue = await listAssignments(tx, { status: "OVERDUE" }, 8);
      const dueSoon = await listAssignments(tx, { status: "DUE_SOON" }, 8);
      // Whole-workforce compliance is costly for large organizations; the dashboard shows
      // it at most one minute old (per viewer, since results are permission-scoped).
      const agg = await memo(`dash:${ctx.tenant.id}:${ctx.user.id}`, 60_000, async () => {
        const empIds = (await tx.execute<{ id: string }>(sql`select id from employees where employment_status <> 'TERMINATED'`)).rows.map((r) => r.id);
        const comp = await complianceFor(tx, empIds);
        const nonCompliant = [...comp.values()].filter((c) => c.status === "NON_COMPLIANT").length;
        const reg = ctx.can("compliance.view", null) && ctx.has("compliance") ? (await evaluateCompliance(tx, ctx.tenant.id)).org : null;
        return { nonCompliant, people: empIds.length, reg };
      });
      return { d, t: { stats: await assignmentStats(tx), attention: [...overdue, ...dueSoon].slice(0, 8), ...agg } };
    });
    const maxEmp = Math.max(1, ...d.byFacility.map((f) => f.employees));
    const seatUse = d.subscription ? Math.round((d.employees / d.subscription.seats) * 100) : 0;
    return (
      <>
        <PageHeader
          title={greeting}
          description={scope === null ? `Organization overview for ${ctx.tenant.name}.` : "Overview of the facilities you administer."}
          actions={ctx.can("org.facilities.manage") ? <ButtonLink href="/admin/facilities" variant="secondary">Manage facilities</ButtonLink> : undefined}
        />
        <div className="space-y-6">
          {securityNudge}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Facilities" value={d.facilities} />
            <StatCard label="Active employees" value={d.employees} tone="teal" />
            <StatCard label="Clinical exposure" value={d.clinical} hint="Employees with patient-care duties" />
            <StatCard label="New hires (90 days)" value={d.newHires} hint="Onboarding training applies" tone="amber" />
            <StatCard label="Portal users" value={d.members} hint="Active accounts with roles" />
          </div>
          {t && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Open training assignments" value={t.stats.open} />
                <StatCard label="Overdue" value={t.stats.overdue} tone="red" hint="Escalated to administrators per your settings" />
                <StatCard label="Due in 30 days" value={t.stats.due_soon} tone="amber" />
                <StatCard label="Non-compliant employees" value={`${t.nonCompliant} / ${t.people}`} tone={t.nonCompliant ? "red" : "teal"} hint="Overdue training, expired license or skills check" />
              </div>
              {t.reg && (
                <Card title="Regulatory compliance" actions={<Link href="/compliance" className="text-xs font-semibold text-teal-700 hover:underline">Compliance Center</Link>}>
                  <div className="flex flex-wrap gap-8 text-sm">
                    <div><div className="text-2xl font-semibold text-navy-900">{t.reg.compliancePct == null ? "—" : `${t.reg.compliancePct}%`}</div><div className="text-slate-500">staff in good standing</div></div>
                    <div><div className="text-2xl font-semibold text-navy-900">{t.reg.applicableRules}</div><div className="text-slate-500">applicable rules</div></div>
                    <div><div className={`text-2xl font-semibold ${t.reg.gaps ? "text-red-700" : "text-navy-900"}`}>{t.reg.gaps}</div><div className="text-slate-500">gaps (no training mapped)</div></div>
                    <div><div className={`text-2xl font-semibold ${t.reg.needsReview ? "text-amber-700" : "text-navy-900"}`}>{t.reg.needsReview}</div><div className="text-slate-500">need review</div></div>
                  </div>
                </Card>
              )}
              <Card title="Needs attention" actions={<Link href="/training?status=OVERDUE" className="text-xs font-semibold text-teal-700 hover:underline">All overdue</Link>}>
                <Table head={["Employee", "Course", "Due", "Status"]} empty={t.attention.length === 0 ? <EmptyState>Nothing overdue or due in the next 30 days.</EmptyState> : undefined}>
                  {t.attention.map((a) => (
                    <tr key={a.id}>
                      <Td><Link href={`/employees/${a.employeeId}`} className="font-medium text-navy-900 hover:underline">{a.employeeName}</Link><div className="text-xs text-slate-500">{a.facilityName}</div></Td>
                      <Td>{a.courseTitle}</Td>
                      <Td className="whitespace-nowrap"><DueDate date={a.dueDate} open /></Td>
                      <Td><AssignmentBadge status={a.status} /></Td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </>
          )}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Workforce by facility" className="lg:col-span-2">
              {d.byFacility.length === 0 ? (
                <EmptyState>No facilities yet.</EmptyState>
              ) : (
                <ul className="space-y-4" aria-label="Employees per facility">
                  {d.byFacility.map((f) => (
                    <li key={f.id}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-medium text-navy-900">{f.name}</span>
                        <span className="text-slate-600">{f.employees} employees · {f.clinical} clinical</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{FACILITY_TYPE_LABELS[f.type]}</div>
                      <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${f.employees} employees, ${f.clinical} with clinical exposure`}>
                        <div className="bg-teal-500" style={{ width: `${(f.clinical / maxEmp) * 100}%` }} />
                        <div className="bg-navy-700" style={{ width: `${((f.employees - f.clinical) / maxEmp) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-teal-500" />Clinical exposure</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy-700" />Non-clinical</span>
              </div>
            </Card>
            <Card title="Subscription">
              {d.subscription ? (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-600">Plan</dt><dd className="font-semibold text-navy-900">{d.subscription.plan.replace("_", " ")}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-600">Status</dt><dd><Badge tone={d.subscription.status === "ACTIVE" ? "green" : d.subscription.status === "TRIALING" ? "blue" : "amber"}>{d.subscription.status}</Badge></dd></div>
                  <div className="flex flex-wrap justify-between"><dt className="text-slate-600">Seat usage</dt><dd className="text-navy-900">{d.employees} / {d.subscription.seats}</dd><dd className="w-full"><div aria-hidden className="mt-1.5 h-2 rounded-full bg-slate-100"><div className={seatUse > 90 ? "h-2 rounded-full bg-amber-500" : "h-2 rounded-full bg-teal-500"} style={{ width: `${Math.min(100, seatUse)}%` }} /></div></dd></div>
                  {d.subscription.trialEndsAt && <div className="flex justify-between"><dt className="text-slate-600">Trial ends</dt><dd>{fmtDate(d.subscription.trialEndsAt)}</dd></div>}
                </dl>
              ) : (
                <EmptyState>No subscription on file.</EmptyState>
              )}
            </Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Employment status">
              <ul className="divide-y divide-slate-100 text-sm">
                {d.byStatus.length === 0 && <EmptyState>No employees yet.</EmptyState>}
                {d.byStatus.map((s) => (
                  <li key={s.status} className="flex justify-between py-2"><span className="text-slate-700">{s.status.replace("_", " ")}</span><span className="font-semibold text-navy-900">{s.n}</span></li>
                ))}
              </ul>
            </Card>
            <Card title="Portal roles">
              <ul className="divide-y divide-slate-100 text-sm">
                {d.roleMix.map((r) => (
                  <li key={r.role} className="flex justify-between py-2"><span className="text-slate-700">{r.role}</span><span className="font-semibold text-navy-900">{r.n}</span></li>
                ))}
              </ul>
            </Card>
          </div>
          {ctx.can("audit.view") && (
            <Card title="Recent activity" actions={<Link href="/admin/audit" className="text-xs font-semibold text-teal-700 hover:underline">Full audit trail</Link>}>
              <Table head={["When", "Who", "Action"]} empty={d.recentAudit.length === 0 ? <EmptyState>No activity recorded yet.</EmptyState> : undefined}>
                {d.recentAudit.map((a) => (
                  <tr key={a.id}>
                    <Td className="whitespace-nowrap">{fmtDateTime(a.createdAt, false, ctx.tenant.timeZone)}</Td>
                    <Td>{a.actorFirst ? `${a.actorFirst} ${a.actorLast}` : "System"}</Td>
                    <Td><code className="text-xs">{a.action}</code></Td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
        </div>
      </>
    );
  }

  const { me, reports, notes, mine, teamComp } = await ctx.tx(async (tx) => {
    const reports = kind === "supervisor" ? await directReports(tx, ctx.user.id) : [];
    return {
      me: await myEmployeeRecord(tx, ctx.user.id),
      reports,
      notes: await latestNotifications(tx, ctx.user.id),
      mine: (await myAssignments(tx, ctx.user.id)).filter((a) => ["ASSIGNED", "IN_PROGRESS", "OVERDUE"].includes(a.status)),
      teamComp: await complianceFor(tx, reports.map((r) => r.id)),
    };
  });

  return (
    <>
      <PageHeader title={greeting} description={kind === "supervisor" ? "Your team at a glance." : kind === "instructor" ? "Your instructor workspace." : "Your personal training workspace."} />
      <div className="space-y-6">
        {securityNudge}
        {mine.length > 0 && (
          <Card title={`My required training (${mine.length})`} actions={<Link href="/learning" className="text-xs font-semibold text-teal-700 hover:underline">My Learning</Link>}>
            <ul className="divide-y divide-slate-100">
              {mine.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="font-medium text-navy-900">{a.courseTitle}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><AssignmentBadge status={a.status} /><span className="text-slate-600">Due <DueDate date={a.dueDate} open /></span></div>
                  </div>
                  <ButtonLink href={a.enrollmentId ? `/learning/${a.enrollmentId}` : "/learning"} className="shrink-0">{a.status === "ASSIGNED" || !a.enrollmentId ? "Start" : "Continue"}</ButtonLink>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="My profile" className="lg:col-span-1">
            {me ? (
              <dl className="space-y-2 text-sm">
                <div><dt className="text-xs text-slate-500">Position</dt><dd className="font-medium text-navy-900">{me.jobTitle}</dd></div>
                <div><dt className="text-xs text-slate-500">Facility</dt><dd>{me.facility ?? "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Supervisor</dt><dd>{me.supervisorFirst ? `${me.supervisorFirst} ${me.supervisorLast}` : "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Employee ID</dt><dd>{me.employeeNumber}</dd></div>
                <div><dt className="text-xs text-slate-500">Hire date</dt><dd>{fmtDate(me.hireDate)}</dd></div>
              </dl>
            ) : (
              <p className="text-sm text-slate-600">{ctx.tenant.type === "INDIVIDUAL" ? "Personal learner account." : "Your account is not yet linked to an employee record. Ask your administrator to link it."}</p>
            )}
          </Card>
          <Card title="Account security">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>Two-step verification</span>{ctx.user.mfaEnabled ? <Badge tone="green">On</Badge> : <Badge tone="amber">Off</Badge>}</li>
              <li className="flex items-center justify-between"><span>Roles</span><span className="text-right text-slate-700">{ctx.access.roles.map((r) => r.name).join(", ")}</span></li>
            </ul>
            <ButtonLink href="/settings/security" variant="secondary" className="mt-4 w-full">Security settings</ButtonLink>
          </Card>
          <Card title="Notifications" actions={<Link href="/notifications" className="text-xs font-semibold text-teal-700 hover:underline">View all</Link>}>
            {notes.length === 0 ? <p className="text-sm text-slate-600">You are all caught up.</p> : (
              <ul className="space-y-2 text-sm">{notes.map((n) => <li key={n.id}><div className="font-medium text-navy-900">{n.title}</div><div className="text-slate-600">{n.body}</div></li>)}</ul>
            )}
          </Card>
        </div>
        {kind === "supervisor" && (
          <Card title={`Direct reports (${reports.length})`} actions={ctx.can("team.view") ? <Link href="/employees" className="text-xs font-semibold text-teal-700 hover:underline">My team</Link> : undefined}>
            <Table head={["Employee", "Position", "Facility", "Training", "Hire date"]} empty={reports.length === 0 ? <EmptyState>No employees are assigned to you as supervisor.</EmptyState> : undefined}>
              {reports.map((r) => (
                <tr key={r.id}>
                  <Td className="font-medium text-navy-900">{ctx.can("team.view") ? <Link href={`/employees/${r.id}`} className="hover:underline">{r.name}</Link> : r.name}{r.clinical && <span className="ml-2"><Badge tone="teal">Clinical</Badge></span>}</Td>
                  <Td>{r.jobTitle}</Td>
                  <Td>{r.facility}</Td>
                  <Td>{teamComp.get(r.id) ? <ComplianceBadge status={teamComp.get(r.id)!.status} /> : "—"}</Td>
                  <Td>{fmtDate(r.hireDate)}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
