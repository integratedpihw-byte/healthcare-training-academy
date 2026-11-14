import { asc } from "drizzle-orm";
import { systemDb } from "@/db/server";
import { regulatorySources } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { RuleFields } from "@/components/compliance/rule-fields";
import { saveRuleAction } from "../actions";

export const metadata = { title: "New regulatory rule" };

export default async function NewRulePage() {
  await requirePlatformAdmin();
  const sources = await systemDb().select({ id: regulatorySources.id, title: regulatorySources.title }).from(regulatorySources).orderBy(asc(regulatorySources.title));
  return (
    <>
      <PageHeader title="New regulatory rule" actions={<ButtonLink href="/platform/regulatory" variant="secondary">Cancel</ButtonLink>} />
      <Card><ActionForm action={saveRuleAction} submitLabel="Create rule" className="space-y-6"><RuleFields sources={sources} /></ActionForm></Card>
    </>
  );
}
