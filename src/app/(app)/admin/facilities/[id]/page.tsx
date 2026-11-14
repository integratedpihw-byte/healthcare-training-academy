import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { facilities } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { FacilityFields } from "@/components/facility-fields";
import { saveFacilityAction } from "../../actions";

export const metadata = { title: "Edit facility" };

export default async function EditFacility({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePermission("org.facilities.manage");
  const [f] = await ctx.tx((tx) => tx.select().from(facilities).where(eq(facilities.id, id)));
  if (!f) notFound(); // includes other tenants' facilities: RLS hides them
  return (
    <>
      <PageHeader title={`Edit ${f.name}`} actions={<Link href="/admin/facilities" className="text-sm font-semibold text-teal-700 hover:underline">Back to facilities</Link>} />
      <Card className="max-w-3xl">
        <ActionForm action={saveFacilityAction} submitLabel="Save facility" pendingText="Saving…">
          <input type="hidden" name="facilityId" value={f.id} />
          <FacilityFields f={f} />
        </ActionForm>
      </Card>
    </>
  );
}
