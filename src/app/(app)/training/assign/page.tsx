import { requirePermission } from "@/lib/auth/context";
import { assignableCourses } from "@/lib/workforce/assignments";
import { employeeFormOptions, listEmployees } from "@/lib/workforce/employees";
import { getOrgPrefs } from "@/lib/workforce/communication";
import { addDays, todayIso } from "@/lib/workforce/rules";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { SubNav, TRAINING_TABS } from "@/components/workforce/common";
import { bulkAssignAction } from "../actions";

export const metadata = { title: "Assign training" };

export default async function AssignPage({ searchParams }: { searchParams: Promise<{ employeeId?: string; courseId?: string }> }) {
  const ctx = await requirePermission("training.assign");
  const sp = await searchParams;
  const d = await ctx.tx(async (tx) => ({
    courses: await assignableCourses(tx),
    employees: await listEmployees(tx, { status: "CURRENT" }),
    opts: await employeeFormOptions(tx, ctx.access),
    prefs: await getOrgPrefs(tx),
  }));
  const due = addDays(todayIso(), d.prefs.defaultDueDays);
  const assignable = d.employees.filter((e) => ctx.can("training.assign", e.primaryFacilityId) || ctx.can("training.assign", null));
  const facilities = d.opts.allFacilities.filter((f) => ctx.can("training.assign", f.id));
  return (
    <>
      <PageHeader title="Assign training" description="Assign a published course to selected employees, or to everyone at a facility, in a position or in a department. Employees who already have an open assignment for the course are skipped." />
      <SubNav items={TRAINING_TABS((x) => ctx.can(x as never))} active="/training/assign" />
      <Card>
        <ActionForm action={bulkAssignAction} submitLabel="Assign course" pendingText="Assigning…" className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course" name="courseId">
              <Select id="courseId" name="courseId" required defaultValue={sp.courseId ?? ""}>
                <option value="" disabled>Choose a published course…</option>
                {d.courses.map((c) => <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ""}</option>)}
              </Select>
            </Field>
            <Field label="Due date" name="dueDate" hint={`Organization default: ${d.prefs.defaultDueDays} days from today.`}><Input id="dueDate" name="dueDate" type="date" required min={todayIso()} defaultValue={due} /></Field>
          </div>
          <Field label="Assign to" name="mode">
            <Select id="mode" name="mode" defaultValue="employees">
              <option value="employees">Selected employees (choose below)</option>
              <option value="facility">Everyone at a facility</option>
              <option value="position">Everyone in a position</option>
              <option value="department">Everyone in a department</option>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Facility" name="facilityId" hint="Used when assigning to a facility.">
              <Select id="facilityId" name="facilityId" defaultValue=""><option value="">—</option>{facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select>
            </Field>
            <Field label="Position code" name="positionCode" hint="Used when assigning to a position."><Input id="positionCode" name="positionCode" placeholder="e.g. CAREGIVER" /></Field>
            <Field label="Department" name="departmentId" hint="Used when assigning to a department.">
              <Select id="departmentId" name="departmentId" defaultValue=""><option value="">—</option>{d.opts.departments.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
            </Field>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-slate-800">Employees <span className="font-normal text-slate-500">(used when “Selected employees” is chosen)</span></legend>
            <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-slate-200 p-3">
              {assignable.length === 0 ? <p className="text-sm text-slate-500">No current employees in your scope.</p> : (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {assignable.map((e) => (
                    <li key={e.id}>
                      <label className="flex items-start gap-2 text-sm">
                        <input type="checkbox" name="employeeIds" value={e.id} defaultChecked={e.id === sp.employeeId} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" />
                        <span>{e.lastName}, {e.firstName} <span className="text-xs text-slate-500">{e.jobTitle} · {e.facilityName}{!e.userId && " · no account"}</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </fieldset>
          <Field label="Reason / note (optional)" name="reason" hint="Shown on the assignment record, e.g. “Annual in-service”."><Textarea id="reason" name="reason" rows={2} maxLength={500} /></Field>
        </ActionForm>
      </Card>
    </>
  );
}
