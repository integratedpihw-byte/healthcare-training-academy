import Link from "next/link";
import { sql } from "drizzle-orm";
import { requireAnyPermission, requireFeature } from "@/lib/auth/context";
import { evaluateCompliance, facilityScope, loadRules } from "@/lib/compliance/service";
import { CATEGORY_LABELS, KIND_LABELS, RULE_STATE_LABEL, type RuleState } from "@/lib/compliance/engine";
import { REGULATORY_CATEGORIES } from "@/db/schema/_shared";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { ComplianceTabs, VerificationBadge } from "@/components/compliance/common";

export const metadata = { title: "Regulatory library" };

export default async function RulesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireAnyPermission(["compliance.view", "compliance.manage"]);
  requireFeature(ctx, "compliance");
  const sp = await searchParams;
  const show = sp.show ?? "applicable";
  const d = await ctx.tx(async (tx) => {
    const all = (await tx.execute<{ id: string }>(sql`select id from facilities where tenant_id = ${ctx.tenant.id}::uuid and is_active`)).rows.map((r) => r.id);
    const scope = facilityScope(ctx.access, "compliance.view", all) ?? (ctx.can("compliance.view") ? null : facilityScope(ctx.access, "compliance.manage", all));
    return { rules: await loadRules(tx), ev: await evaluateCompliance(tx, ctx.tenant.id, { facilityIds: scope }) };
  });
  const states = new Map<string, RuleState[]>();
  for (const f of d.ev.facilities) for (const r of f.rules) states.set(r.rule.id, [...(states.get(r.rule.id) ?? []), r.state]);
  const q = sp.q?.toLowerCase().trim();
  const rows = d.rules.filter((r) => {
    const st = states.get(r.id) ?? [];
    if (show === "applicable" && !st.length) return false;
    if (sp.state === "attention" && !st.some((s) => s === "GAP" || s === "NEEDS_REVIEW")) return false;
    if (sp.category && r.category !== sp.category) return false;
    if (sp.jurisdiction && r.jurisdiction !== sp.jurisdiction) return false;
    if (sp.status && r.complianceStatus !== sp.status) return false;
    if (q && !`${r.citation} ${r.title} ${r.agency} ${r.requirementText}`.toLowerCase().includes(q)) return false;
    return true;
  });
  return (
    <>
      <PageHeader title="Regulatory library" description="Florida and federal healthcare training requirements with citations, source links and verification dates. 'Applies to my facilities' uses each facility's type, state and license designations." />
      <ComplianceTabs active="/compliance/rules" />
      <Card>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1"><label htmlFor="q" className="text-xs font-medium text-slate-600">Search</label><Input id="q" name="q" defaultValue={sp.q} placeholder="Citation, title or text" /></div>
          <div><label htmlFor="show" className="text-xs font-medium text-slate-600">Show</label><Select id="show" name="show" defaultValue={show}><option value="applicable">Applies to my facilities</option><option value="all">Entire library</option></Select></div>
          <div><label htmlFor="category" className="text-xs font-medium text-slate-600">Agency / category</label><Select id="category" name="category" defaultValue={sp.category ?? ""}><option value="">All</option>{REGULATORY_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</Select></div>
          <div><label htmlFor="jurisdiction" className="text-xs font-medium text-slate-600">Jurisdiction</label><Select id="jurisdiction" name="jurisdiction" defaultValue={sp.jurisdiction ?? ""}><option value="">All</option><option value="FEDERAL">Federal</option><option value="FL">Florida</option></Select></div>
          <div><label htmlFor="status" className="text-xs font-medium text-slate-600">Verification</label><Select id="status" name="status" defaultValue={sp.status ?? ""}><option value="">All</option><option value="VERIFIED">Source verified</option><option value="NEEDS_REVIEW">Needs review</option></Select></div>
          <div><label htmlFor="state" className="text-xs font-medium text-slate-600">My status</label><Select id="state" name="state" defaultValue={sp.state ?? ""}><option value="">Any</option><option value="attention">Gaps and reviews</option></Select></div>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
        <Table head={["Requirement", "Agency", "Type", "Frequency (per source)", "Verification", "Your facilities"]} empty={rows.length === 0 ? <EmptyState>No rules match.</EmptyState> : undefined}>
          {rows.map((r) => {
            const st = states.get(r.id) ?? [];
            const counts = st.reduce<Record<string, number>>((m, s) => ({ ...m, [s]: (m[s] ?? 0) + 1 }), {});
            return (
              <tr key={r.id}>
                <Td><Link href={`/compliance/rules/${r.id}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">{r.title}</Link><div className="text-xs text-slate-500">{r.citation}{r.jurisdiction === "FL" ? " · Florida" : " · Federal"}</div></Td>
                <Td className="text-xs">{CATEGORY_LABELS[r.category]}</Td>
                <Td className="text-xs">{KIND_LABELS[r.kind]}</Td>
                <Td className="max-w-xs text-xs">{r.frequencyText ?? "—"}</Td>
                <Td><VerificationBadge status={r.complianceStatus} />{r.pendingChangeNote && <div className="mt-1"><Badge tone="amber">Change pending</Badge></div>}</Td>
                <Td className="text-xs">
                  {st.length === 0 ? <span className="text-slate-500">Not applicable by facility type</span> : Object.entries(counts).map(([s, n]) => (
                    <div key={s}><Badge tone={RULE_STATE_LABEL[s as RuleState].tone}>{RULE_STATE_LABEL[s as RuleState].label}</Badge> <span className="text-slate-500">× {n}</span></div>
                  ))}
                </Td>
              </tr>
            );
          })}
        </Table>
        <p className="mt-3 text-xs text-slate-500">{rows.length} of {d.rules.length} rules. Missing a regulation that applies to you? Record it as an organizational requirement under Training → Requirements, and tell your platform administrator so it can be researched and added.</p>
      </Card>
    </>
  );
}
