"use client";
import { PasswordInput } from "@/components/password-input";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { registerOrganizationAction } from "../actions";
import { Alert, FACILITY_TYPE_LABELS, Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordHint } from "@/components/password-hint";

/** Fields on step 1; a server error on any of them sends the person back to that step. */
const STEP1 = ["organizationName", "legalName", "facilityName", "facilityType", "licenseNumber", "phone", "city", "state", "plan"];

/**
 * Two steps on one form: everything is submitted together and validated on the server as
 * before. Step 2 is hidden (not removed) while step 1 is shown, so typed values are kept.
 */
export function RegisterOrgForm() {
  const [s, action] = useActionState(registerOrganizationAction, undefined);
  const v = s?.values ?? {};
  const e = s?.fieldErrors ?? {};
  const [step, setStep] = useState<1 | 2>(1);
  const first = useRef<HTMLFieldSetElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // After a server response, show the step that holds the first error.
  useEffect(() => {
    if (!s?.fieldErrors) return;
    setStep(Object.keys(s.fieldErrors).some((k) => STEP1.includes(k)) ? 1 : 2);
  }, [s]);
  // Move focus to the new step's heading when the person changes step (not on first render).
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  const next = () => {
    const fields = Array.from(first.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select") ?? []);
    const invalid = fields.find((f) => !f.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    moved.current = true;
    setStep(2);
  };
  // Pressing Enter on step 1 moves on instead of submitting a half-filled form.
  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    if (step === 1) {
      ev.preventDefault();
      next();
    }
  };

  return (
    <form action={action} onSubmit={onSubmit} className="mt-5 space-y-5" noValidate={step === 1}>
      <ol aria-label="Registration steps" className="flex gap-2 text-xs font-semibold">
        {(["Organization", "Your account"] as const).map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? "step" : undefined} className={"flex-1 rounded-full px-3 py-1.5 text-center " + (step === i + 1 ? "bg-navy-900 text-white" : step > i + 1 ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600")}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      {s?.error && <Alert>{s.error}</Alert>}
      <h2 ref={heading} tabIndex={-1} className="text-base font-bold text-navy-900 outline-none">
        Step {step} of 2: {step === 1 ? "your organization" : "your administrator account"}
      </h2>
      <fieldset ref={first} hidden={step !== 1} className="space-y-4">
        <legend className="sr-only">Organization</legend>
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
        <button type="button" onClick={next} className="w-full rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">Continue</button>
      </fieldset>
      <fieldset hidden={step !== 2} className="space-y-4">
        <legend className="sr-only">Organization administrator</legend>
        <p className="text-sm text-slate-600">You will be the organization administrator. You can invite colleagues after approval.</p>
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
          <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={12} />
        </Field>
        <PasswordHint />
        <Field label="Confirm password" name="confirm" error={e.confirm}>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
        </Field>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="acceptTerms" className="mt-1" required />
        <span>I agree to the <a href="/terms" target="_blank" rel="noopener" className="font-semibold text-teal-700 underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-teal-700 underline">Privacy Policy</a>, and I am authorized to register this organization. I will not enter patient health information into training records.</span>
      </label>
      {e.acceptTerms && <p className="text-xs text-red-700">{e.acceptTerms[0]}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" onClick={() => { moved.current = true; setStep(1); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50">Back</button>
        <SubmitButton className="flex-1" pendingText="Creating workspace…">Register organization</SubmitButton>
      </div>
      </fieldset>
    </form>
  );
}
