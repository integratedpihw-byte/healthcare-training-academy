import { requireTenant } from "@/lib/auth/context";
import { getOrgPrefs, getUserSettings } from "@/lib/workforce/communication";
import { ActionForm } from "@/components/action-form";
import { Alert, ButtonLink, Card, Field, Input, PageHeader } from "@/components/ui";
import { saveMyEmailPrefsAction } from "../../notifications/actions";

export const metadata = { title: "Notification preferences" };

export default async function MyNotificationPrefsPage() {
  const ctx = await requireTenant();
  const d = await ctx.tx(async (tx) => ({ mine: await getUserSettings(tx, ctx.user.id), org: await getOrgPrefs(tx) }));
  const box = "mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600";
  return (
    <>
      <PageHeader title="Notification preferences" description={`How ${ctx.tenant.name} reaches you by email. Every notification also appears in the app.`} actions={<ButtonLink href="/settings" variant="secondary">Back to settings</ButtonLink>} />
      {!d.org.emailEnabled && <div className="mb-4"><Alert tone="amber">Your organization has switched email notifications off. You will see notifications in the app only.</Alert></div>}
      <Card>
        <ActionForm action={saveMyEmailPrefsAction} submitLabel="Save preferences">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-navy-900">Email me about</legend>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="emailAssignments" defaultChecked={d.mine.emailAssignments} className={box} /> <span>Course assignments and due-date reminders</span></label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="emailResults" defaultChecked={d.mine.emailResults} className={box} /> <span>Exam results, certificates and skills evaluations</span></label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="emailAnnouncements" defaultChecked={d.mine.emailAnnouncements} className={box} /> <span>Announcements from administrators</span></label>
            <label className="flex items-start gap-2 text-sm text-slate-500"><input type="checkbox" checked disabled className={box} /> <span>Expiration warnings, overdue training and compliance alerts <span className="block text-xs">Always sent so required credentials do not lapse.</span></span></label>
          </fieldset>
          {d.org.smsEnabled && (
            <fieldset className="mt-6 space-y-3 border-t border-slate-100 pt-4">
              <legend className="text-sm font-semibold text-navy-900">Text message alerts (optional)</legend>
              <p className="text-xs text-slate-500">Only critical alerts — expiring credentials, overdue required training and compliance alerts. Texts never include patient information. Message and data rates may apply. Reply STOP to any message to opt out.</p>
              <div className="max-w-xs"><Field label="Mobile number" name="smsPhone" htmlFor="smsPhone"><Input id="smsPhone" name="smsPhone" type="tel" autoComplete="tel" defaultValue={d.mine.smsPhone ?? ""} placeholder="(813) 555-0142" /></Field></div>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="smsOptIn" defaultChecked={d.mine.smsOptIn} className={box} /> <span>I agree to receive automated text alerts from {ctx.tenant.name} through the Training Academy at this number.</span></label>
            </fieldset>
          )}
        </ActionForm>
      </Card>
    </>
  );
}
