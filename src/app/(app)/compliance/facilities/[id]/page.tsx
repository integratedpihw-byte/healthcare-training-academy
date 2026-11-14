import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnyPermission, requireFeature } from "@/lib/auth/context";
import { complianceTrend, evaluateCompliance } from "@/lib/compliance/service";
import { CATEGORY_LABELS } from "@/lib/compliance/engine";
import { ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { ComplianceTabs, ItemBadge, Pct, RuleStateBadge, TrendChart } from "@/components/compliance/common";

export const metadata = { title: "Facility compliance" };

export default async function FacilityCompliancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireAnyPermission(["compliance.view", "compliance.manage"]);
  requireFeature(ctx, "compliance");
  if (!ctx.can("compliance.view", id) && !ctx.can("compliance.manage", id)) notFound();
  const d = await ctx.tx(async (tx) => ({ ev: await evaluateCompliance(tx, ctx.tenant.id, { facilityIds: [id] }), trend: await complianceTrend(tx, ctx.tenant.id, id) }));
  const f = d.ev.facilities[0];
  if (!f) notFound();
  const reqs = [...new Map(f.items.map((i) => [i.requirementId, i.requirementTitle])).entries()];
  const emps = [...new Map(f.items.map((i) => [i.employeeId, i.employeeName])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const cell = (e: string, r: string) => f.items.find((i) => i.employeeId === e && i.requirementId === r);
  return (
    <>
      <PageHeader
        title={f.name}
        description="Regulatory rules that apply to this facility and each employee's status against the training mapped to them."
        actions={
          <>
            <Link href="/compliance" className="self-center text-sm text-slate-600 hover:underline">← Compliance Center</Link>
            {ctx.can("reports.view") && <ButtonLink href={`/reports/regulatory-audit?facilityId=${id}`} variant="secondary">Regulatory audit report</ButtonLink>}
          </>
        }
      />
      <ComplianceTabs active="/compliance" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Compliance" value={f.summary.compliancePct == null ? "—" : `${f.summary.compliancePct}%`} tone="teal" />
        <StatCard label="Completion" value={f.summary.completionPct == null ? "—" : `${f.summary.completionPct}%`} />
        <StatCard label="Overdue / expired / missing" value={f.summary.overdue + f.summary.missing} tone={f.summary.overdue + f.summary.missing ? "red" : "teal"} />
        <StatCard label="Gaps" value={f.summary.gaps} tone={f.summary.gaps ? "red" : "teal"} />
        <StatCard label="Needs review" value={f.summary.needsReview} tone={f.summary.needsReview ? "amber" : "teal"} />
      </div>
      <div className="space-y-6">
        <Card title="Staff compliance matrix">
          {reqs.length === 0 ? <EmptyState>No regulation-mapped training applies to staff here yet. Map rules to training from the regulatory library.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="sticky left-0 bg-white px-3 py-2">Employee</th>
                    {reqs.map(([rid, title]) => <th key={rid} className="min-w-40 px-3 py-2 font-medium normal-case">{title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {emps.map(([eid, name]) => (
                    <tr key={eid} className="border-b border-slate-100">
                      <td className="sticky left-0 bg-white px-3 py-2"><Link href={`/employees/${eid}`} className="font-medium text-navy-900 hover:underline">{name}</Link></td>
                      {reqs.map(([rid]) => {
                        const c = cell(eid, rid);
                        return <td key={rid} className="px-3 py-2">{c ? <ItemBadge status={c.status} /> : <span className="text-xs text-slate-500">n/a</span>}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Card title={`Applicable rules (${f.rules.length})`}>
            <Table head={["Rule", "Status"]}>
              {f.rules.map((r) => (
                <tr key={r.rule.id}>
                  <Td><Link href={`/compliance/rules/${r.rule.id}`} className="font-medium text-navy-900 hover:underline">{r.rule.title}</Link><div className="text-xs text-slate-500">{r.rule.citation} · {CATEGORY_LABELS[r.rule.category]}</div></Td>
                  <Td><RuleStateBadge state={r.state} /></Td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title="Trend (90 days)">
            <TrendChart points={d.trend.map((t) => ({ date: t.snapshotDate, pct: t.applicable ? Math.floor((t.satisfied / t.applicable) * 1000) / 10 : null }))} />
            <p className="mt-3 text-xs text-slate-500">Current: <Pct value={f.summary.compliancePct} /></p>
          </Card>
        </div>
      </div>
    </>
  );
}
