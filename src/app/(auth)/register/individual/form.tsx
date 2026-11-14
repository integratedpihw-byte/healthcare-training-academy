"use client";
import { PasswordInput } from "@/components/password-input";
import { useActionState } from "react";
import { registerIndividualAction } from "../../actions";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordHint } from "@/components/password-hint";

export function RegisterIndividualForm() {
  const [s, action] = useActionState(registerIndividualAction, undefined);
  const v = s?.values ?? {};
  const e = s?.fieldErrors ?? {};
  return (
    <form action={action} className="mt-5 space-y-4">
      {s?.error && <Alert>{s.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" error={e.firstName}><Input id="firstName" name="firstName" required defaultValue={v.firstName} /></Field>
        <Field label="Last name" name="lastName" error={e.lastName}><Input id="lastName" name="lastName" required defaultValue={v.lastName} /></Field>
      </div>
      <Field label="Email" name="email" error={e.email}><Input id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} /></Field>
      <Field label="State" name="state" error={e.state}><Input id="state" name="state" maxLength={2} defaultValue={v.state ?? "FL"} /></Field>
      <Field label="Password" name="password" error={e.password}><PasswordInput id="password" name="password" autoComplete="new-password" required /></Field>
      <PasswordHint />
      <Field label="Confirm password" name="confirm" error={e.confirm}><PasswordInput id="confirm" name="confirm" autoComplete="new-password" required /></Field>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="acceptTerms" className="mt-1" required />
        <span>I agree to the <a href="/terms" target="_blank" rel="noopener" className="font-semibold text-teal-700 underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-teal-700 underline">Privacy Policy</a>.</span>
      </label>
      {e.acceptTerms && <p className="text-xs text-red-700">{e.acceptTerms[0]}</p>}
      <SubmitButton className="w-full" pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
