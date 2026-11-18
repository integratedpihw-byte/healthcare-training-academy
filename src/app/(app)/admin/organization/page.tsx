import { requirePermission } from "@/lib/auth/context";
import { organizations } from "@/db/schema";
import { Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { TIME_ZONES } from "@/lib/time";
import { ActionForm } from "@/components/action-form";
import { updateOrganizationAction } from "../actions";

export const metadata = { title: "Organization profile" };

export default async function OrgPage() {
  const ctx = await requirePermission("org.settings.manage");
  const [org] = await ctx.tx((tx) => tx.select().from(organizations).limit(1));
  if (!org) return <p>Organization profile missing.</p>;
  return (
    <>
      <PageHeader title="Organization profile" description="This information appears on reports and certificates issued to your staff." />
      <Card className="max-w-3xl">
        <ActionForm action={updateOrganizationAction} submitLabel="Save profile" pendingText="Saving…">
          <input type="hidden" name="orgId" value={org.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" name="displayName"><Input id="displayName" name="displayName" defaultValue={org.displayName} required /></Field>
            <Field label="Legal name" name="legalName"><Input id="legalName" name="legalName" defaultValue={org.legalName} required /></Field>
            <Field label="EIN (optional)" name="ein"><Input id="ein" name="ein" defaultValue={org.ein ?? ""} /></Field>
            <Field label="Phone" name="phone"><Input id="phone" name="phone" defaultValue={org.phone ?? ""} /></Field>
            <Field label="Email" name="email"><Input id="email" name="email" type="email" defaultValue={org.email ?? ""} /></Field>
            <Field label="Address" name="addressLine1"><Input id="addressLine1" name="addressLine1" defaultValue={org.addressLine1 ?? ""} /></Field>
            <Field label="City" name="city"><Input id="city" name="city" defaultValue={org.city ?? ""} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State" name="state"><Input id="state" name="state" maxLength={2} defaultValue={org.state} required /></Field>
              <Field label="ZIP" name="postalCode"><Input id="postalCode" name="postalCode" defaultValue={org.postalCode ?? ""} /></Field>
            </div>
            <Field label="Time zone" name="timeZone" hint="Dates and times are shown to your staff in this zone.">
              <Select id="timeZone" name="timeZone" defaultValue={org.timeZone}>{TIME_ZONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</Select>
            </Field>
            <Field label="Two-step verification" name="mfaPolicy" hint="Who must sign in with an authenticator app. People it applies to set it up at their next sign-in.">
              <Select id="mfaPolicy" name="mfaPolicy" defaultValue={org.mfaPolicy}>
                <option value="ADMINS">Required for administrators (recommended)</option>
                <option value="ALL">Required for everyone</option>
                <option value="OFF">Optional (not recommended)</option>
              </Select>
            </Field>
          </div>
          <h3 className="mt-6 text-sm font-semibold text-navy-900">Certificates</h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Field label="Authorized signatory name" name="certificateSignatoryName" hint="Printed as a typed signature on new certificates. Leave blank to show the issuing organization only.">
              <Input id="certificateSignatoryName" name="certificateSignatoryName" defaultValue={org.certificateSignatoryName ?? ""} maxLength={100} />
            </Field>
            <Field label="Signatory title" name="certificateSignatoryTitle" hint="For example: Director of Nursing, Training Director.">
              <Input id="certificateSignatoryTitle" name="certificateSignatoryTitle" defaultValue={org.certificateSignatoryTitle ?? ""} maxLength={100} />
            </Field>
            <Field label="Name on the public verification page" name="certificateNameDisplay" hint="Employers checking a certificate see either the full name or initials only.">
              <Select id="certificateNameDisplay" name="certificateNameDisplay" defaultValue={org.certificateNameDisplay}>
                <option value="FULL">Full name</option>
                <option value="INITIALS">Initials only</option>
              </Select>
            </Field>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
