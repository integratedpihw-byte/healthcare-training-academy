"use client";
import { useActionState } from "react";
import { registerOrganizationAction } from "../actions";
import { Alert, FACILITY_TYPE_LABELS, Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordHint } from "@/components/password-hint";

export function RegisterOrgForm() {
  const [s, action] = useActionState(registerOrganizationAction, undefined);
  const v = s?.values ?? {};
  const e = s?.fieldErrors ?? {};
  return (
    <form action={action} className="mt-5 space-y-5">
      {s?.error && <Alert>{s.error}</Alert>}
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-teal-700">Organization</legend>
        <Field label="Organization name" name="organizationName" error={e.organizationName}>
          <Input id="organizationName" name="organizationName" required defaultValue={v.organizationName} />
        </Field>
        <Field label="Legal name (if different)" name="legalName" error={e.legalName}>
          <Input id="legalName" name="legalName" defaultValue={v.legalName} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First facility name" name="facilityName" error={e.facilityName}>
            <Input id="facilityName" name="facilityName" required defaultValue={v.facilityName} />
          </Field>
          <Field label="Facility type" name="facilityType" error={e.facilityType}>
            <Select id="facilityType" name="facilityType" required defaultValue={v.facilityType ?? ""}>
              <option value="" disabled>Select…</option>
              {Object.entries(FACILITY_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Facility license number (optional)" name="licenseNumber" error={e.licenseNumber}>
            <Input id="licenseNumber" name="licenseNumber" defaultValue={v.licenseNumber} />
          </Field>
          <Field label="Phone (optional)" name="phone" error={e.phone}>
            <Input id="phone" name="phone" type="tel" defaultValue={v.phone} />
          </Field>
          <Field label="City" name="city" error={e.city}>
            <Input id="city" name="city" defaultValue={v.city} />
          </Field>
          <Field label="State" name="state" error={e.state} hint="Florida first; other states supported">
            <Input id="state" name="state" maxLength={2} defaultValue={v.state ?? "FL"} />
          </Field>
        </div>
        <Field label="Plan (14-day trial)" name="plan" error={e.plan}>
          <Select id="plan" name="plan" defaultValue={v.plan ?? "STARTER"}>
            <option value="STARTER">Starter — small practices</option>
            <option value="PROFESSIONAL">Professional — multiple departments</option>
            <option value="ENTERPRISE">Enterprise — multiple facilities</option>
          </Select>
        </Field>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-teal-700">Organization administrator</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="adminFirstName" error={e.adminFirstName}>
            <Input id="adminFirstName" name="adminFirstName" autoComplete="given-name" required defaultValue={v.adminFirstName} />
          </Field>
          <Field label="Last name" name="adminLastName" error={e.adminLastName}>
            <Input id="adminLastName" name="adminLastName" autoComplete="family-name" required defaultValue={v.adminLastName} />
          </Field>
        </div>
        <Field label="Work email" name="adminEmail" error={e.adminEmail}>
          <Input id="adminEmail" name="adminEmail" type="email" autoComplete="email" required defaultValue={v.adminEmail} />
        </Field>
        <Field label="Password" name="password" error={e.password}>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
        </Field>
        <PasswordHint />
        <Field label="Confirm password" name="confirm" error={e.confirm}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </Field>
      </fieldset>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="acceptTerms" className="mt-1" required />
        <span>I agree to the Terms of Service and Privacy Policy, and I am authorized to register this organization. I will not enter patient health information into training records.</span>
      </label>
      {e.acceptTerms && <p className="text-xs text-red-700">{e.acceptTerms[0]}</p>}
      <SubmitButton className="w-full" pendingText="Creating workspace…">Register organization</SubmitButton>
    </form>
  );
}
