import { requirePermission } from "@/lib/auth/context";
import { getOrgPrefs } from "@/lib/workforce/communication";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, Field, Input, PageHeader } from "@/components/ui";
import { saveOrgPrefsAction } from "../../notifications/actions";

export const metadata = { title: "Notifications & renewals" };

export default async function OrgNotificationSettingsPage() {
  const ctx = await requirePermission("org.settings.manage");
  const p = await ctx.tx((tx) => getOrgPrefs(tx));
  return (
    <>
      <PageHeader title="Notifications & renewals" description="Organization-wide reminder schedule, escalation and renewal settings used by the daily expiration engine. Individual requirements can override the reminder schedule." actions={<ButtonLink href="/admin" variant="secondary">Administration</ButtonLink>} />
      <Card>
        <ActionForm action={saveOrgPrefsAction} submitLabel="Save settings">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reminder schedule (days before due or expiry)" name="expiryLeadDays" hint="Applies to assignments, certificates, licenses and skills reassessments. Default: 90, 60, 30, 15, 7."><Input id="expiryLeadDays" name="expiryLeadDays" required defaultValue={p.expiryLeadDays.join(", ")} /></Field>
            <Field label="Escalate overdue items to administrators after (days)" name="escalateAfterDays" hint="Employees and their supervisors are notified on the first overdue day."><Input id="escalateAfterDays" name="escalateAfterDays" type="number" min={1} max={90} required defaultValue={p.escalateAfterDays} /></Field>
            <Field label="Create renewal assignments (days before certificate expiry)" name="renewalWindowDays" hint="The renewal is due on the expiration date."><Input id="renewalWindowDays" name="renewalWindowDays" type="number" min={7} max={365} required defaultValue={p.renewalWindowDays} /></Field>
            <Field label="Default due date for new assignments (days)" name="defaultDueDays" hint="Used when a requirement does not set its own window."><Input id="defaultDueDays" name="defaultDueDays" type="number" min={1} max={365} required defaultValue={p.defaultDueDays} /></Field>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="emailEnabled" defaultChecked={p.emailEnabled} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> <span>Send email notifications <span className="block text-xs text-slate-500">Members can opt out of non-critical categories. Emails never contain patient information.</span></span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="smsEnabled" defaultChecked={p.smsEnabled} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> <span>Allow optional text-message alerts <span className="block text-xs text-slate-500">Critical alerts only, to members who opt in with their mobile number. Requires the platform SMS provider to be configured.</span></span></label>
        </ActionForm>
      </Card>
    </>
  );
}
