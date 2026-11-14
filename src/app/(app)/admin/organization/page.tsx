import { requirePermission } from "@/lib/auth/context";
import { organizations } from "@/db/schema";
import { Card, Field, Input, PageHeader } from "@/components/ui";
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
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
