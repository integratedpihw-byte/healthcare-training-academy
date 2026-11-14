import { LICENSE_TYPE_TAGS } from "@/content/regulatory";
import { FACILITY_TYPE_LABELS, Field, Input, Select } from "./ui";

type F = {
  name?: string; facilityType?: string; licenseType?: string | null; licenseNumber?: string | null;
  licenseExpires?: string | null; addressLine1?: string | null; city?: string | null; state?: string; postalCode?: string | null; designations?: string[];
};

export function FacilityFields({ f = {} }: { f?: F }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Facility name" name="name"><Input id="name" name="name" defaultValue={f.name} required /></Field>
      <Field label="Facility type" name="facilityType" hint="Drives which training requirements apply">
        <Select id="facilityType" name="facilityType" defaultValue={f.facilityType ?? ""} required>
          <option value="" disabled>Select…</option>
          {Object.entries(FACILITY_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </Field>
      <Field label="License type" name="licenseType"><Input id="licenseType" name="licenseType" defaultValue={f.licenseType ?? ""} placeholder="e.g. Standard ALF license" /></Field>
      <Field label="License number" name="licenseNumber"><Input id="licenseNumber" name="licenseNumber" defaultValue={f.licenseNumber ?? ""} /></Field>
      <Field label="License expiration" name="licenseExpires"><Input id="licenseExpires" name="licenseExpires" type="date" defaultValue={f.licenseExpires ?? ""} /></Field>
      <Field label="Address" name="addressLine1"><Input id="addressLine1" name="addressLine1" defaultValue={f.addressLine1 ?? ""} /></Field>
      <Field label="City" name="city"><Input id="city" name="city" defaultValue={f.city ?? ""} /></Field>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-slate-800">License and program designations</legend>
        <p className="mb-2 text-xs text-slate-500">Used by the regulatory rules engine to decide which requirements apply (e.g. CLIA, VFC, 340B, specialized dementia care).</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {LICENSE_TYPE_TAGS.map((t) => (
            <label key={t.code} className="flex items-start gap-2 text-sm"><input type="checkbox" name="designations" value={t.code} defaultChecked={f.designations?.includes(t.code)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600" />{t.label}</label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <Field label="State" name="state"><Input id="state" name="state" maxLength={2} defaultValue={f.state ?? "FL"} required /></Field>
        <Field label="ZIP" name="postalCode"><Input id="postalCode" name="postalCode" defaultValue={f.postalCode ?? ""} /></Field>
      </div>
    </div>
  );
}
