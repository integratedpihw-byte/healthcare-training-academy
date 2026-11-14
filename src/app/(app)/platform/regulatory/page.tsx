import Link from "next/link";
import { asc } from "drizzle-orm";
import { systemDb } from "@/db/server";
import { regulatorySources } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { loadRules } from "@/lib/compliance/service";
import { verificationQueue } from "@/lib/compliance/platform";
import { CATEGORY_LABELS, KIND_LABELS } from "@/lib/compliance/engine";
import { REGULATORY_CATEGORIES } from "@/db/schema/_shared";
import { ActionForm } from "@/components/action-form";
import { Badge, ButtonLink, Card, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea, fmtDate } from "@/components/ui";
import { VerificationBadge } from "@/components/compliance/common";
import { addSourceAction } from "./actions";

export const metadata = { title: "Regulatory library" };

export default async function PlatformRegulatoryPage() {
  await requirePlatformAdmin();
  const sys = systemDb();
  const [rules, queue, sources] = await Promise.all([loadRules(sys, { includeInactive: true }), verificationQueue(sys), sys.select().from(regulatorySources).orderBy(asc(regulatorySources.title))]);
  return (
    <>
      <PageHeader title="Regulatory library" description="Platform-maintained Florida and federal requirements. Every change is versioned, audited and announced to affected organizations. Never record a deadline or frequency you have not verified." actions={<ButtonLink href="/platform/regulatory/new" variant="teal">New rule</ButtonLink>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rules" value={rules.filter((r) => r.isActive).length} />
        <StatCard label="Source verified" value={rules.filter((r) => r.isActive && r.complianceStatus === "VERIFIED").length} tone="teal" />
        <StatCard label="Verification queue" value={queue.rows.length} tone={queue.rows.length ? "amber" : "teal"} hint="Needs review or verified more than a year ago" />
        <StatCard label="Sources" value={sources.length} />
      </div>
      <div className="space-y-6">
        <Card title="Rules">
          <Table head={["Rule", "Category", "Type", "Status", "Verified", "Version"]}>
            {rules.map((r) => (
              <tr key={r.id}>
                <Td><Link href={`/platform/regulatory/${r.id}`} className="font-medium text-navy-900 hover:underline">{r.title}</Link><div className="text-xs text-slate-500">{r.citation}{!r.isActive && " · inactive"}</div></Td>
                <Td className="text-xs">{CATEGORY_LABELS[r.category]}</Td>
                <Td className="text-xs">{KIND_LABELS[r.kind]}</Td>
                <Td><VerificationBadge status={r.complianceStatus} />{r.pendingChangeNote && <Badge tone="amber">Change pending</Badge>}</Td>
                <Td className="text-xs">{r.lastVerifiedAt ? fmtDate(r.lastVerifiedAt) : "—"}</Td>
                <Td>{r.version}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Add a source">
          <ActionForm action={addSourceAction} submitLabel="Add source" resetOnSuccess className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" name="title" htmlFor="src-title"><Input id="src-title" name="title" required /></Field>
            <Field label="URL" name="url" htmlFor="src-url"><Input id="src-url" name="url" type="url" required /></Field>
            <Field label="Agency" name="agency" htmlFor="src-agency"><Input id="src-agency" name="agency" required /></Field>
            <Field label="Category" name="category" htmlFor="src-cat"><Select id="src-cat" name="category">{REGULATORY_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</Select></Field>
            <Field label="Jurisdiction" name="jurisdiction" htmlFor="src-jur"><Select id="src-jur" name="jurisdiction"><option value="FEDERAL">Federal</option><option value="FL">Florida</option></Select></Field>
            <Field label="Kind" name="sourceKind" htmlFor="src-kind"><Select id="src-kind" name="sourceKind"><option value="REGULATION">Regulation</option><option value="STATUTE">Statute</option><option value="GUIDANCE">Guidance</option><option value="PROGRAM_MANUAL">Program manual</option></Select></Field>
            <label className="flex gap-2 text-sm"><input type="checkbox" name="isOfficial" defaultChecked className="mt-0.5 h-4 w-4" />Official publisher</label>
            <div className="sm:col-span-2"><Field label="Notes" name="notes" htmlFor="src-notes"><Textarea id="src-notes" name="notes" rows={2} /></Field></div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
