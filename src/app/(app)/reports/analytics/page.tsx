import Link from "next/link";
import { requireFeature, requirePermission } from "@/lib/auth/context";
import { analytics, filterOptions, filterSchema } from "@/lib/analytics/service";
import { memo } from "@/lib/memo";
import { complianceTrend } from "@/lib/compliance/service";
import { REPORTS } from "@/lib/reports/definitions";
import { COMPLIANCE_LABEL } from "@/lib/workforce/rules";
import { BarList, ColumnChart, LineChart } from "@/components/analytics/charts";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requirePermission("reports.view");
  requireFeature(ctx, "analytics");
  const sp = await searchParams;
  const f = filterSchema.parse(sp);
  const canExport = ctx.can("reports.export");
  const { a, opts, trend, instructors } = await ctx.tx(async (tx) => {
    // Heavy for large organizations: reuse a result up to one minute old (per viewer + filters).
    const a = await memo(`analytics:${ctx.tenant.id}:${ctx.user.id}:${JSON.stringify(f)}`, 60_000, () => analytics(tx, f));
    const trend = ctx.can("compliance.view") && ctx.has("compliance") ? await complianceTrend(tx, ctx.tenant.id, f.facilityId ?? null, 365) : [];
    const perf = await REPORTS.find((r) => r.key === "instructor-activity")!.run(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, { from: a.range.from, to: a.range.to });
    return { a, opts: await filterOptions(tx), trend, instructors: perf.rows.slice(0, 8) };
  });
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
  const exp = (table: string, format: string) => `/api/analytics?${new URLSearchParams({ ...Object.fromEntries(qs), table, format })}`;
  const Export = ({ table }: { table: string }) => canExport ? (
    <span className="flex gap-2 text-xs">{["csv", "xlsx", "pdf"].map((fm) => <a key={fm} href={exp(table, fm)} className="font-semibold text-teal-700 hover:underline">{fm.toUpperCase()}</a>)}</span>
  ) : null;
  const k = a.kpis;
  const filtered = [...qs.keys()].some((x) => x !== "from" && x !== "to");
  return (
    <>
      <PageHeader title="Analytics dashboard" description="Executive training dashboard for the facilities and staff you can see. Figures are training records — they do not establish clinical competency or licensure." actions={<Link href="/reports" className="text-sm font-semibold text-teal-700 hover:underline">← All reports</Link>} />
      <form className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8" aria-label="Filters">
        <Field label="Facility" name="facilityId" htmlFor="f-fac"><Select id="f-fac" name="facilityId" defaultValue={f.facilityId ?? ""}><option value="">All</option>{opts.facilities.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
        <Field label="Department" name="departmentId" htmlFor="f-dep"><Select id="f-dep" name="departmentId" defaultValue={f.departmentId ?? ""}><option value="">All</option>{opts.departments.map((o) => <option key={o.id} value={o.id}>{o.name}{o.facility ? ` (${o.facility})` : ""}</option>)}</Select></Field>
        <Field label="Job position" name="position" htmlFor="f-pos"><Select id="f-pos" name="position" defaultValue={f.position ?? ""}><option value="">All</option>{opts.positions.map((o) => <option key={o.code} value={o.code}>{o.title}</option>)}</Select></Field>
        <Field label="Employee" name="employeeId" htmlFor="f-emp"><Select id="f-emp" name="employeeId" defaultValue={f.employeeId ?? ""}><option value="">All</option>{opts.employees.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
        <Field label="Course category" name="categoryId" htmlFor="f-cat"><Select id="f-cat" name="categoryId" defaultValue={f.categoryId ?? ""}><option value="">All</option>{opts.categories.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
        <Field label="Training status" name="status" htmlFor="f-st"><Select id="f-st" name="status" defaultValue={f.status ?? ""}><option value="">All</option>{Object.entries(COMPLIANCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l.label}</option>)}</Select></Field>
        <Field label="From" name="from" htmlFor="f-from"><Input id="f-from" name="from" type="date" defaultValue={a.range.from} /></Field>
        <Field label="To" name="to" htmlFor="f-to"><Input id="f-to" name="to" type="date" defaultValue={a.range.to} /></Field>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-8"><Button type="submit">Apply filters</Button>{filtered && <Link href="/reports/analytics" className="text-sm text-slate-600 underline">Clear</Link>}<span className="ml-auto"><Export table="summary" /></span></div>
      </form>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Employees" value={k.employees} />
          <StatCard label="Active students" value={k.activeStudents} />
          <StatCard label="Published courses" value={k.courses} />
          <StatCard label="Enrollments (period)" value={k.enrollments} />
          <StatCard label="Completed (period)" value={k.completed} tone="teal" />
          <StatCard label="Pending courses" value={k.pending} />
          <StatCard label="Overdue assignments" value={k.overdue} tone={k.overdue ? "red" : "navy"} />
          <StatCard label="Certificates expiring ≤60 days" value={k.expiringCerts} tone={k.expiringCerts ? "amber" : "navy"} />
          <StatCard label="Failed exams (period)" value={k.failedExams} tone={k.failedExams ? "amber" : "navy"} />
          <StatCard label="Competency pass rate" value={k.competencyPassRate == null ? "—" : `${k.competencyPassRate}%`} hint={`${k.competencySigned} signed evaluations`} />
          <StatCard label="Training compliance" value={k.compliancePct == null ? "—" : `${k.compliancePct}%`} tone="teal" hint="Required training in good standing" />
          <StatCard label="Training hours (period)" value={k.trainingHours} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Completions per month" actions={<Export table="monthly" />}>
            <ColumnChart data={a.monthly.map((m) => ({ x: m.month.slice(2), y: m.completions }))} label="Course completions per month" />
            <details className="mt-2 text-sm"><summary className="cursor-pointer text-slate-600">Show data table</summary>
              <Table head={["Month", "Enrollments", "Completions", "Hours"]}>{a.monthly.map((m) => <tr key={m.month}><Td>{m.month}</Td><Td>{m.enrollments}</Td><Td>{m.completions}</Td><Td>{m.hours}</Td></tr>)}</Table>
            </details>
          </Card>
          <Card title="Regulatory compliance trend">
            {trend.length ? (
              <>
                <LineChart data={trend.map((t) => ({ x: t.snapshotDate, y: t.applicable ? Math.round((t.satisfied / t.applicable) * 100) : null }))} label="Regulatory compliance percentage over time" />
                <p className="mt-2 text-xs text-slate-500">Share of applicable employee requirements in good standing, from nightly snapshots{f.facilityId ? " for the selected facility" : " (organization-wide)"}.</p>
              </>
            ) : <EmptyState>{ctx.has("compliance") && ctx.can("compliance.view") ? "No compliance snapshots yet — one is recorded each night." : "Regulatory trend requires the Compliance Center and compliance.view permission."}</EmptyState>}
          </Card>
          <Card title="Facility compliance ranking" actions={<Export table="facilities" />}>
            {a.facilityRanking.length ? <BarList max={100} unit="%" data={a.facilityRanking.map((r) => ({ label: r.facility, value: r.pct, hint: `(${r.compliant}/${r.employees})` }))} /> : <EmptyState>No employees with assigned requirements.</EmptyState>}
          </Card>
          <Card title="Training status mix">
            <BarList data={Object.entries(a.statusMix).map(([s, n]) => ({ label: COMPLIANCE_LABEL[s as keyof typeof COMPLIANCE_LABEL].label, value: n }))} max={Math.max(1, k.employees)} />
          </Card>
          <Card title="Course utilization (top 10)" actions={<Export table="utilization" />}>
            {a.utilization.length ? <BarList data={a.utilization.map((u) => ({ label: u.title, value: u.enrollments, hint: `· ${u.ratePct ?? 0}% completed` }))} /> : <EmptyState>No enrollments in this period.</EmptyState>}
          </Card>
          <Card title="Training hours by category">
            {a.byCategory.length ? <BarList data={a.byCategory.map((c) => ({ label: c.category, value: c.hours, hint: `· ${c.completions} completions` }))} unit=" h" /> : <EmptyState>No completions in this period.</EmptyState>}
          </Card>
        </div>
        <Card title="Instructor performance" actions={<Link href={`/reports/instructor-activity?from=${a.range.from}&to=${a.range.to}`} className="text-sm font-semibold text-teal-700 hover:underline">Full report</Link>}>
          <Table head={["Instructor / evaluator", "Classes", "Attendance", "Exam items graded", "Evaluations signed", "Course rating"]} empty={instructors.length === 0 ? <EmptyState>No instructor activity in this period.</EmptyState> : undefined}>
            {instructors.map((r, i) => <tr key={i}><Td>{String(r.name)}</Td><Td>{String(r.classes)}</Td><Td>{String(r.attendance)}</Td><Td>{String(r.graded)}</Td><Td>{String(r.evaluations)}</Td><Td>{String(r.rating)}</Td></tr>)}
          </Table>
        </Card>
        <Card title={`Employees (${a.employees.length})`} actions={<Export table="employees" />}>
          <Table head={["Employee", "Position", "Facility", "Status", "Open", "Overdue"]} empty={a.employees.length === 0 ? <EmptyState>No employees match these filters.</EmptyState> : undefined}>
            {a.employees.slice(0, 100).map((e) => (
              <tr key={e.id}><Td><Link href={`/employees/${e.id}`} className="text-teal-700 hover:underline">{e.name}</Link><div className="text-xs text-slate-500">{e.number}</div></Td><Td>{e.position}</Td><Td>{e.facility ?? "—"}</Td><Td><Badge tone={COMPLIANCE_LABEL[e.status].tone}>{COMPLIANCE_LABEL[e.status].label}</Badge></Td><Td>{e.open}</Td><Td>{e.overdue}</Td></tr>
            ))}
          </Table>
          {a.employees.length > 100 && <p className="mt-2 text-xs text-slate-500">Showing 100 of {a.employees.length}; export for the full list.</p>}
        </Card>
      </div>
    </>
  );
}
