import { requirePermission } from "@/lib/auth/context";
import { employeeFormOptions } from "@/lib/workforce/employees";
import { ActionForm } from "@/components/action-form";
import { Alert, ButtonLink, Card, PageHeader } from "@/components/ui";
import { EmployeeFields } from "@/components/workforce/employee-fields";
import { createEmployeeAction } from "../actions";

export const metadata = { title: "Add employee" };

export default async function NewEmployeePage() {
  const ctx = await requirePermission("employees.manage");
  const o = await ctx.tx((tx) => employeeFormOptions(tx, ctx.access));
  const canAssign = ctx.can("training.assign");
  return (
    <>
      <PageHeader title="Add employee" description="Create the employee profile. Onboarding then identifies the facility and position, determines applicable training requirements, assigns required courses with deadlines and notifies the employee." actions={<ButtonLink href="/employees" variant="secondary">Cancel</ButtonLink>} />
      {o.facilities.length === 0 ? (
        <Alert tone="amber">You do not manage any active facility. Ask an administrator to add a facility or grant you access.</Alert>
      ) : (
        <Card>
          <ActionForm action={createEmployeeAction} submitLabel="Create employee" pendingText="Creating…" className="space-y-6">
            <EmployeeFields facilities={o.facilities} departments={o.departments} supervisors={o.supervisors} d={{ hireDate: new Date().toISOString().slice(0, 10) }} />
            <fieldset className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <legend className="px-1 text-sm font-semibold text-navy-900">Onboarding</legend>
              <label className="flex items-start gap-2 text-sm text-slate-800"><input type="checkbox" name="provisionAccount" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> Create an academy account (Learner role) and email a set-password link — requires a work email</label>
              {canAssign && <label className="flex items-start gap-2 text-sm text-slate-800"><input type="checkbox" name="runOnboarding" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> Run onboarding now: assign the courses required by your organization&apos;s training requirements</label>}
            </fieldset>
          </ActionForm>
        </Card>
      )}
    </>
  );
}
