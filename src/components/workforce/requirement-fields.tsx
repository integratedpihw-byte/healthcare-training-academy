import { Field, FACILITY_TYPE_LABELS, Input, Select, Textarea } from "@/components/ui";
import { FACILITY_TYPES } from "@/db/schema/_shared";
import { SOURCE_LABELS, TENANT_REQUIREMENT_SOURCES } from "@/lib/workforce/requirements";
import { STANDARD_POSITIONS } from "@/lib/workforce/rules";

export interface RequirementDefaults {
  title?: string | null;
  courseId?: string | null;
  competencyId?: string | null;
  source?: string;
  facilityTypes?: string[];
  positionCodes?: string[];
  requiresClinicalExposure?: boolean;
  requiresBloodborneExposure?: boolean;
  dueWithinDaysOfHire?: number | null;
  frequencyMonths?: number | null;
  reminderLeadDays?: number[] | null;
  needsAdminReview?: boolean;
  notes?: string | null;
}

export function RequirementFields({ d = {}, courses, competencies }: { d?: RequirementDefaults; courses: { id: string; title: string; code: string | null }[]; competencies: { id: string; name: string }[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Requirement name" name="title"><Input id="title" name="title" required maxLength={200} defaultValue={d.title ?? ""} placeholder="e.g. Annual bloodborne pathogens for direct care" /></Field>
        <Field label="Basis" name="source" hint="Regulatory mappings with citations are managed in the Compliance Center.">
          <Select id="source" name="source" defaultValue={d.source ?? "ORGANIZATIONAL_POLICY"}>{TENANT_REQUIREMENT_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}</Select>
        </Field>
        <Field label="Requirement type" name="target">
          <Select id="target" name="target" defaultValue={d.competencyId ? "competency" : "course"}>
            <option value="course">Complete a course</option>
            <option value="competency">Pass a practical skills evaluation</option>
          </Select>
        </Field>
        <div />
        <Field label="Course (for course requirements)" name="courseId">
          <Select id="courseId" name="courseId" defaultValue={d.courseId ?? ""}><option value="">—</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ""}</option>)}</Select>
        </Field>
        <Field label="Skills checklist (for skills requirements)" name="competencyId">
          <Select id="competencyId" name="competencyId" defaultValue={d.competencyId ?? ""}><option value="">—</option>{competencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">Applies to</legend>
        <p className="mb-2 text-xs text-slate-500">Leave facility types or positions empty to apply to all.</p>
        <div className="grid gap-1 sm:grid-cols-3">
          {FACILITY_TYPES.map((t) => (
            <label key={t} className="flex items-start gap-2 text-sm"><input type="checkbox" name="facilityTypes" value={t} defaultChecked={d.facilityTypes?.includes(t)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" />{FACILITY_TYPE_LABELS[t]}</label>
          ))}
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Position codes" name="positionCodes" hint={`Comma-separated, e.g. ${STANDARD_POSITIONS.slice(0, 3).map((p) => p.code).join(", ")}`}><Input id="positionCodes" name="positionCodes" defaultValue={d.positionCodes?.join(", ") ?? ""} /></Field>
          <div className="space-y-2 pt-6">
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="requiresClinicalExposure" defaultChecked={d.requiresClinicalExposure} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> Only employees with clinical exposure</label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="requiresBloodborneExposure" defaultChecked={d.requiresBloodborneExposure} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> Only employees with bloodborne exposure</label>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Schedule</legend>
        <Field label="Due within (days of hire)" name="dueWithinDaysOfHire" hint="Blank = organization default from assignment."><Input id="dueWithinDaysOfHire" name="dueWithinDaysOfHire" type="number" min={0} max={730} defaultValue={d.dueWithinDaysOfHire ?? ""} /></Field>
        <Field label="Repeat every (months)" name="frequencyMonths" hint="Used when the course certificate has no expiry."><Input id="frequencyMonths" name="frequencyMonths" type="number" min={1} max={120} defaultValue={d.frequencyMonths ?? ""} /></Field>
        <Field label="Reminder schedule (days before)" name="reminderLeadDays" hint="Blank = organization schedule, e.g. 90, 60, 30, 15, 7."><Input id="reminderLeadDays" name="reminderLeadDays" defaultValue={d.reminderLeadDays?.join(", ") ?? ""} /></Field>
      </fieldset>

      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="needsAdminReview" defaultChecked={d.needsAdminReview} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" /> Flag for administrator review instead of assigning automatically during onboarding</label>
      <Field label="Notes" name="notes"><Textarea id="notes" name="notes" rows={2} maxLength={2000} defaultValue={d.notes ?? ""} /></Field>
    </div>
  );
}
