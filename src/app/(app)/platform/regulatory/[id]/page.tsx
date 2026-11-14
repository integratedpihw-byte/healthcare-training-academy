import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { systemDb } from "@/db/server";
import { regulatoryRuleVersions, regulatoryRules, regulatorySources } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { ActionForm } from "@/components/action-form";
import { Alert, ButtonLink, Card, Field, PageHeader, Textarea, fmtDate } from "@/components/ui";
import { RuleFields } from "@/components/compliance/rule-fields";
import { saveRuleAction } from "../actions";

export const metadata = { title: "Edit regulatory rule" };

export default async function EditRulePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params;
  const { msg } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requirePlatformAdmin();
  const sys = systemDb();
  const [r] = await sys.select().from(regulatoryRules).where(eq(regulatoryRules.id, id));
  if (!r) notFound();
  const [sources, versions] = await Promise.all([
    sys.select({ id: regulatorySources.id, title: regulatorySources.title }).from(regulatorySources).orderBy(asc(regulatorySources.title)),
    sys.select().from(regulatoryRuleVersions).where(eq(regulatoryRuleVersions.ruleId, id)).orderBy(desc(regulatoryRuleVersions.version)),
  ]);
  const notified = msg?.startsWith("saved-") ? msg.slice(6) : null;
  return (
    <>
      <PageHeader title={r.title} description={`${r.citation} · version ${r.version}`} actions={<ButtonLink href="/platform/regulatory" variant="secondary">Back</ButtonLink>} />
      {msg === "created" && <div className="mb-4"><Alert tone="green">Rule created (version 1).</Alert></div>}
      {notified != null && <div className="mb-4"><Alert tone="green">Saved as version {r.version}. {notified} compliance manager notification(s) sent.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
        <Card>
          <ActionForm action={saveRuleAction} submitLabel="Save new version" className="space-y-6">
            <input type="hidden" name="ruleId" value={id} />
            <RuleFields r={r} sources={sources} />
            <Field label="Change summary (sent to affected organizations)" name="changeSummary"><Textarea id="changeSummary" name="changeSummary" rows={2} required minLength={10} maxLength={1000} /></Field>
          </ActionForm>
        </Card>
        <Card title="Versions">
          <ul className="space-y-2 text-sm">{versions.map((v) => <li key={v.id}><span className="font-medium">v{v.version}</span> <span className="text-xs text-slate-500">{fmtDate(v.createdAt)}</span><div className="text-slate-600">{v.changeSummary}</div></li>)}</ul>
        </Card>
      </div>
    </>
  );
}
