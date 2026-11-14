import { Field, Input, Select } from "@/components/ui";
import { EMPLOYMENT_LABELS, EMPLOYMENT_STATUSES } from "@/lib/workforce/employees";
import { STANDARD_POSITIONS } from "@/lib/workforce/rules";
import { JOB_DUTY_TAGS } from "@/content/regulatory";

export interface EmployeeDefaults {
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string;
  positionCode?: string;
  clinicalExposure?: boolean;
  bloodborneExposure?: boolean;
  employmentStatus?: string;
  hireDate?: string;
  terminationDate?: string | null;
  primaryFacilityId?: string | null;
  departmentId?: string | null;
  supervisorId?: string | null;
  trainingPathway?: string | null;
  jobDuties?: string[];
}

export function EmployeeFields({
  d = {},
  facilities,
  departments,
  supervisors,
  selfId,
}: {
  d?: EmployeeDefaults;
  facilities: { id: string; name: string }[];
  departments: { id: string; name: string; facilityId: string | null }[];
  supervisors: { id: string; name: string; jobTitle: string }[];
  selfId?: string;
}) {
  return (
    <div className="space-y-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Identity and contact</legend>
        <Field label="Employee ID" name="employeeNumber"><Input id="employeeNumber" name="employeeNumber" required maxLength={40} defaultValue={d.employeeNumber} /></Field>
        <div />
        <Field label="First name" name="firstName"><Input id="firstName" name="firstName" required maxLength={100} defaultValue={d.firstName} autoComplete="off" /></Field>
        <Field label="Last name" name="lastName"><Input id="lastName" name="lastName" required maxLength={100} defaultValue={d.lastName} autoComplete="off" /></Field>
        <Field label="Work email" name="email" hint="Used for the employee's academy account and notifications."><Input id="email" name="email" type="email" maxLength={254} defaultValue={d.email ?? ""} autoComplete="off" /></Field>
        <Field label="Work phone" name="phone"><Input id="phone" name="phone" type="tel" maxLength={40} defaultValue={d.phone ?? ""} autoComplete="off" /></Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Position and placement</legend>
        <Field label="Job title" name="jobTitle"><Input id="jobTitle" name="jobTitle" required maxLength={120} defaultValue={d.jobTitle} /></Field>
        <Field label="Position code" name="positionCode" hint="Drives which training requirements apply. Pick a standard code or enter your own.">
          <Input id="positionCode" name="positionCode" required list="position-codes" maxLength={60} defaultValue={d.positionCode} />
          <datalist id="position-codes">{STANDARD_POSITIONS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}</datalist>
        </Field>
        <Field label="Primary facility" name="primaryFacilityId">
          <Select id="primaryFacilityId" name="primaryFacilityId" required defaultValue={d.primaryFacilityId ?? ""}>
            <option value="" disabled>Choose…</option>
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Field label="Department" name="departmentId">
          <Select id="departmentId" name="departmentId" defaultValue={d.departmentId ?? ""}>
            <option value="">None</option>
            {departments.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
        </Field>
        <Field label="Supervisor" name="supervisorId" hint="Supervisors with the Supervisor role see their direct reports' training.">
          <Select id="supervisorId" name="supervisorId" defaultValue={d.supervisorId ?? ""}>
            <option value="">None</option>
            {supervisors.filter((s) => s.id !== selfId).map((s) => <option key={s.id} value={s.id}>{s.name} — {s.jobTitle}</option>)}
          </Select>
        </Field>
        <Field label="Required training pathway" name="trainingPathway" hint="Optional label, e.g. “ALF direct care — new hire”.">
          <Input id="trainingPathway" name="trainingPathway" maxLength={200} defaultValue={d.trainingPathway ?? ""} />
        </Field>
        <div className="space-y-2 sm:col-span-2">
          <label className="flex items-start gap-2 text-sm text-slate-800"><input type="checkbox" name="clinicalExposure" defaultChecked={d.clinicalExposure} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> Provides direct patient or resident care (clinical exposure)</label>
          <label className="flex items-start gap-2 text-sm text-slate-800"><input type="checkbox" name="bloodborneExposure" defaultChecked={d.bloodborneExposure} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> Reasonably anticipated occupational exposure to blood or other potentially infectious materials</label>
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-slate-800">Job duties</legend>
          <p className="mb-2 text-xs text-slate-500">Used by regulatory rules that apply to specific duties (e.g. medication assistance, food service, respirator use).</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {JOB_DUTY_TAGS.map((t) => (
              <label key={t.code} className="flex items-start gap-2 text-sm text-slate-800"><input type="checkbox" name="jobDuties" value={t.code} defaultChecked={d.jobDuties?.includes(t.code)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" />{t.label}</label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Employment</legend>
        <Field label="Employment status" name="employmentStatus">
          <Select id="employmentStatus" name="employmentStatus" defaultValue={d.employmentStatus ?? "ACTIVE"}>
            {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{EMPLOYMENT_LABELS[s]}</option>)}
          </Select>
        </Field>
        <Field label="Hire date" name="hireDate"><Input id="hireDate" name="hireDate" type="date" required defaultValue={d.hireDate} /></Field>
        <Field label="Termination date" name="terminationDate" hint="Required when terminated."><Input id="terminationDate" name="terminationDate" type="date" defaultValue={d.terminationDate ?? ""} /></Field>
      </fieldset>
    </div>
  );
}
