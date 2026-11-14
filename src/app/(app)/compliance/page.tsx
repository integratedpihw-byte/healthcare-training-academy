import Link from "next/link";
import { requireAnyPermission, requireFeature } from "@/lib/auth/context";
import { complianceTrend, evaluateCompliance, facilityScope, regulatoryUpdates } from "@/lib/compliance/service";
import { CATEGORY_LABELS } from "@/lib/compliance/engine";
import { Alert, Badge, Card, EmptyState, FACILITY_TYPE_LABELS, PageHeader, StatCard, Table, Td, fmtDate } from "@/components/ui";
import { ComplianceTabs, Pct, RuleStateBadge, TrendChart } from "@/components/compliance/common";
import { sql } from "drizzle-orm";

export const metadata = { title: "Compliance Center" };

export default async function CompliancePage() {
  const ctx = await requireAnyPermission(["compliance.view", "compliance.manage"]);
  requireFeature(ctx, "compliance");
  const d = await ctx.tx(async (tx) => {
    const all = (await tx.execute<{ id: string }>(sql`select id from facilities where tenant_id = ${ctx.tenant.id}::uuid and is_active`)).rows.map((r) => r.id);
    const scope = facilityScope(ctx.access, "compliance.view", all) ?? (ctx.can("compliance.view") ? null : facilityScope(ctx.access, "compliance.manage", all));
    const ev = await evaluateCompliance(tx, ctx.tenant.id, { facilityIds: scope });
    return { ev, updates: await regulatoryUpdates(tx, ctx.tenant.id), trend: await complianceTrend(tx, ctx.tenant.id, null) };
  });
  const { ev } = d;
  const ranked = [...ev.facilities].sort((a, b) => (a.summary.compliancePct ?? 101) - (b.summary.compliancePct ?? 101));
  const attention = ev.facilities.flatMap((f) => f.rules.filter((r) => r.state === "GAP" || r.state === "NEEDS_REVIEW").map((r) => ({ f, r })));
  const worst = [...ev.employeeStatus.entries()].filter(([, s]) => s.bad > 0).sort((a, b) => b[1].bad - a[1].bad).slice(0, 8);
  return (
    <>
      <PageHeader title="Compliance Center" description="Florida and federal regulatory requirements that apply to your facilities, your documented applicability decisions, the training mapped to each rule, and staff compliance." actions={ctx.has("aiAssistant") ? <div className="flex gap-3 text-sm font-semibold"><Link href="/learning/assistant?mode=regulatory" className="text-teal-700 hover:underline">AI regulatory summary</Link><Link href="/learning/assistant?mode=gaps" className="text-teal-700 hover:underline">AI training-gap review</Link></div> : undefined} />
      <ComplianceTabs active="/compliance" />
      <div className="mb-4">
        <Alert tone="blue">The regulatory library cites its sources and verification dates. It supports — but does not replace — review by a qualified compliance professional. Requirements that could not be verified are flagged for review and never assumed.</Alert>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Training compliance" value={ev.org.compliancePct == null ? "—" : `${ev.org.compliancePct}%`} tone={ev.org.compliancePct != null && ev.org.compliancePct < 90 ? "amber" : "teal"} hint="Staff items not overdue, expired or missing" />
        <StatCard label="Completion" value={ev.org.completionPct == null ? "—" : `${ev.org.completionPct}%`} hint="Items with current completed training" />
        <StatCard label="Applicable rules" value={ev.org.applicableRules} hint={`${ev.org.mapped} mapped to training`} />
        <StatCard label="Gaps" value={ev.org.gaps} tone={ev.org.gaps ? "red" : "teal"} hint="Applicable mandates with no training mapped" />
        <StatCard label="Needs review" value={ev.org.needsReview} tone={ev.org.needsReview ? "amber" : "teal"} hint="Unverified rules, open reviews or changed rules" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card title="Facility compliance ranking">
            <Table head={["Facility", "Rules", "Gaps", "Review", "Staff items", "Compliance", "Completion"]} empty={ranked.length === 0 ? <EmptyState>No active facilities in your scope.</EmptyState> : undefined}>
              {ranked.map((f) => (
                <tr key={f.id}>
                  <Td><Link href={`/compliance/facilities/${f.id}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">{f.name}</Link><div className="text-xs text-slate-500">{FACILITY_TYPE_LABELS[f.facilityType]}</div></Td>
                  <Td>{f.summary.applicableRules}</Td>
                  <Td>{f.summary.gaps ? <Badge tone="red">{f.summary.gaps}</Badge> : 0}</Td>
                  <Td>{f.summary.needsReview ? <Badge tone="amber">{f.summary.needsReview}</Badge> : 0}</Td>
                  <Td>{f.summary.items}</Td>
                  <Td><Pct value={f.summary.compliancePct} /></Td>
                  <Td><Pct value={f.summary.completionPct} /></Td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title={`Needs attention (${attention.length})`} actions={<Link href="/compliance/rules?state=attention" className="text-xs font-semibold text-teal-700 hover:underline">Open in library</Link>}>
            <Table head={["Rule", "Facility", "Status"]} empty={attention.length === 0 ? <EmptyState>No gaps or open reviews.</EmptyState> : undefined}>
              {attention.slice(0, 12).map(({ f, r }) => (
                <tr key={`${f.id}:${r.rule.id}`}>
                  <Td><Link href={`/compliance/rules/${r.rule.id}`} className="font-medium text-navy-900 hover:underline">{r.rule.title}</Link><div className="text-xs text-slate-500">{r.rule.citation} · {CATEGORY_LABELS[r.rule.category]}</div></Td>
                  <Td>{f.name}</Td>
                  <Td><RuleStateBadge state={r.state} />{r.reReview && <div className="text-xs text-amber-700">Rule changed since your decision</div>}</Td>
                </tr>
              ))}
            </Table>
            {attention.length > 12 && <p className="mt-2 text-xs text-slate-500">Showing 12 of {attention.length}.</p>}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Compliance trend (90 days)">
            <TrendChart points={d.trend.map((t) => ({ date: t.snapshotDate, pct: t.applicable ? Math.floor((t.satisfied / t.applicable) * 1000) / 10 : null }))} />
          </Card>
          <Card title="Regulatory updates">
            {d.updates.length === 0 ? <p className="text-sm text-slate-600">No rule changes in the last 180 days.</p> : (
              <ul className="space-y-3 text-sm">
                {d.updates.map((u) => (
                  <li key={`${u.rule_id}:${u.version}`}>
                    <Link href={`/compliance/rules/${u.rule_id}`} className="font-medium text-navy-900 hover:underline">{u.citation} — {u.title}</Link>
                    <div className="text-xs text-slate-500">Version {u.version} · {fmtDate(u.created_at)}</div>
                    <p className="text-slate-600">{u.change_summary}</p>
                    {u.decided_version != null && u.decided_version < u.version && <Badge tone="amber">Re-review your decision</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Employees with the most open items">
            {worst.length === 0 ? <p className="text-sm text-slate-600">No overdue, expired or missing regulation-mapped training.</p> : (
              <ul className="space-y-2 text-sm">
                {worst.map(([id, s]) => (
                  <li key={id} className="flex justify-between gap-2"><Link href={`/employees/${id}`} className="text-teal-700 hover:underline">{s.name}</Link><span className="text-xs text-red-700">{s.bad} of {s.total} items</span></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
