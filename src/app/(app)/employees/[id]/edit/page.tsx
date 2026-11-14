import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { employeeFormOptions, getEmployee } from "@/lib/workforce/employees";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { EmployeeFields } from "@/components/workforce/employee-fields";
import { updateEmployeeAction } from "../../actions";

export const metadata = { title: "Edit employee" };

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePermission("employees.manage");
  const d = await ctx.tx(async (tx) => ({ p: await getEmployee(tx, id), o: await employeeFormOptions(tx, ctx.access) }));
  if (!d.p) notFound();
  const e = d.p.employee;
  if (!ctx.can("employees.manage", e.primaryFacilityId) && !d.p.facilities.some((f) => ctx.can("employees.manage", f.id))) notFound();
  // Keep the current facility selectable even if the editor manages only a secondary one.
  const facs = d.o.facilities.some((f) => f.id === e.primaryFacilityId) ? d.o.facilities : [...d.o.facilities, ...d.o.allFacilities.filter((f) => f.id === e.primaryFacilityId)];
  return (
    <>
      <PageHeader title={`Edit ${e.firstName} ${e.lastName}`} description="Changing the position, facility or exposure flags can change which training is required — re-evaluate requirements afterwards." actions={<ButtonLink href={`/employees/${id}`} variant="secondary">Cancel</ButtonLink>} />
      <Card>
        <ActionForm action={updateEmployeeAction} submitLabel="Save changes" pendingText="Saving…" className="space-y-6">
          <input type="hidden" name="employeeId" value={id} />
          <EmployeeFields d={e} facilities={facs} departments={d.o.departments} supervisors={d.o.supervisors} selfId={id} />
        </ActionForm>
      </Card>
    </>
  );
}
