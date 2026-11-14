import { Field, FACILITY_TYPE_LABELS, Input, Select, Textarea } from "@/components/ui";
import { FACILITY_TYPES, REGULATORY_CATEGORIES, RULE_KINDS } from "@/db/schema/_shared";
import { CATEGORY_LABELS, KIND_LABELS } from "@/lib/compliance/engine";
import { JOB_DUTY_TAGS, LICENSE_TYPE_TAGS } from "@/content/regulatory";
import type { RuleRow } from "@/lib/compliance/service";

const box = "mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600";

export function RuleFields({ r, sources }: { r?: RuleRow; sources: { id: string; title: string }[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source" name="sourceId"><Select id="sourceId" name="sourceId" required defaultValue={r?.sourceId ?? ""}><option value="" disabled>Choose…</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</Select></Field>
        <Field label="Agency (as shown)" name="agency"><Input id="agency" name="agency" required defaultValue={r?.agency} /></Field>
        <Field label="Category" name="category"><Select id="category" name="category" defaultValue={r?.category ?? "OSHA"}>{REGULATORY_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</Select></Field>
        <Field label="Type of obligation" name="kind"><Select id="kind" name="kind" defaultValue={r?.kind ?? "TRAINING_MANDATE"}>{RULE_KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}</Select></Field>
        <Field label="Jurisdiction" name="jurisdiction"><Select id="jurisdiction" name="jurisdiction" defaultValue={r?.jurisdiction ?? "FEDERAL"}><option value="FEDERAL">Federal</option><option value="FL">Florida</option></Select></Field>
        <Field label="Citation" name="citation"><Input id="citation" name="citation" required defaultValue={r?.citation} placeholder="e.g. 29 CFR 1910.1030(g)(2)" /></Field>
        <div className="sm:col-span-2"><Field label="Title" name="title"><Input id="title" name="title" required defaultValue={r?.title} /></Field></div>
        <div className="sm:col-span-2"><Field label="Training requirement (plain language)" name="requirementText"><Textarea id="requirementText" name="requirementText" rows={3} required defaultValue={r?.requirementText} /></Field></div>
        <div className="sm:col-span-2"><Field label="Applicable employee roles (as the source states)" name="audienceText"><Textarea id="audienceText" name="audienceText" rows={2} defaultValue={r?.audienceText ?? ""} /></Field></div>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">Applicability (empty = all)</legend>
        <div className="mt-2 grid gap-1 sm:grid-cols-3">{FACILITY_TYPES.map((t) => <label key={t} className="flex gap-2 text-sm"><input type="checkbox" name="facilityTypes" value={t} defaultChecked={r?.facilityTypes.includes(t)} className={box} />{FACILITY_TYPE_LABELS[t]}</label>)}</div>
        <div className="mt-3 grid gap-1 sm:grid-cols-2">{LICENSE_TYPE_TAGS.map((t) => <label key={t.code} className="flex gap-2 text-sm"><input type="checkbox" name="facilityLicenseTypes" value={t.code} defaultChecked={r?.facilityLicenseTypes.includes(t.code)} className={box} />{t.label}</label>)}</div>
        <div className="mt-3 grid gap-1 sm:grid-cols-2">{JOB_DUTY_TAGS.map((t) => <label key={t.code} className="flex gap-2 text-sm"><input type="checkbox" name="jobDuties" value={t.code} defaultChecked={r?.jobDuties.includes(t.code)} className={box} />{t.label}</label>)}</div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Position codes (comma-separated)" name="positionCodes"><Input id="positionCodes" name="positionCodes" defaultValue={r?.positionCodes.join(", ")} /></Field>
          <div className="space-y-1 pt-6">
            <label className="flex gap-2 text-sm"><input type="checkbox" name="requiresClinicalExposure" defaultChecked={r?.requiresClinicalExposure} className={box} />Clinical exposure only</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" name="requiresBloodborneExposure" defaultChecked={r?.requiresBloodborneExposure} className={box} />Bloodborne exposure only</label>
          </div>
        </div>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Timing (record exactly what the source says)</legend>
        <Field label="Initial timing (text)" name="initialTimingText"><Input id="initialTimingText" name="initialTimingText" defaultValue={r?.initialTimingText ?? ""} /></Field>
        <Field label="Initial deadline (days from hire), only if stated" name="initialDueDaysFromHire"><Input id="initialDueDaysFromHire" name="initialDueDaysFromHire" type="number" min={0} max={730} defaultValue={r?.initialDueDaysFromHire ?? ""} /></Field>
        <Field label="Frequency (text)" name="frequencyText"><Input id="frequencyText" name="frequencyText" defaultValue={r?.frequencyText ?? ""} /></Field>
        <Field label="Frequency (months), only if verified" name="frequencyMonths"><Input id="frequencyMonths" name="frequencyMonths" type="number" min={1} max={120} defaultValue={r?.frequencyMonths ?? ""} /></Field>
        <label className="flex gap-2 text-sm sm:col-span-2"><input type="checkbox" name="frequencyVerified" defaultChecked={r?.frequencyVerified} className={box} />The frequency above was verified against the source</label>
        <Field label="Effective date" name="effectiveDate"><Input id="effectiveDate" name="effectiveDate" type="date" defaultValue={r?.effectiveDate ?? ""} /></Field>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-navy-900">Verification</legend>
        <Field label="Status" name="complianceStatus"><Select id="complianceStatus" name="complianceStatus" defaultValue={r?.complianceStatus ?? "NEEDS_REVIEW"}><option value="VERIFIED">Verified against source</option><option value="NEEDS_REVIEW">Needs review</option><option value="SUPERSEDED">Superseded</option></Select></Field>
        <Field label="Last verified on" name="lastVerifiedOn"><Input id="lastVerifiedOn" name="lastVerifiedOn" type="date" defaultValue={r?.lastVerifiedAt ? r.lastVerifiedAt.toISOString().slice(0, 10) : ""} /></Field>
        <Field label="Responsible compliance reviewer" name="reviewerName"><Input id="reviewerName" name="reviewerName" defaultValue={r?.reviewerName ?? ""} /></Field>
        <Field label="Suggested library course codes" name="suggestedCourseCodes"><Input id="suggestedCourseCodes" name="suggestedCourseCodes" defaultValue={r?.suggestedCourseCodes.join(", ")} /></Field>
        <div className="sm:col-span-2"><Field label="Verification note" name="verificationNote" hint="What was checked, against which copy, and what remains open."><Textarea id="verificationNote" name="verificationNote" rows={2} defaultValue={r?.verificationNote ?? ""} /></Field></div>
        <div className="sm:col-span-2"><Field label="Pending change (rulemaking / legislation)" name="pendingChangeNote"><Textarea id="pendingChangeNote" name="pendingChangeNote" rows={2} defaultValue={r?.pendingChangeNote ?? ""} /></Field></div>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={r ? r.isActive : true} className={box} />Active</label>
      </fieldset>
    </div>
  );
}
