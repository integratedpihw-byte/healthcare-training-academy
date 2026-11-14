"use client";
import { useActionState } from "react";
import { recoveryCodesAction } from "../actions";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

/** Generates one-time recovery codes. They are shown once here and stored only as hashes. */
export function RecoveryCodes({ remaining }: { remaining: number }) {
  const [state, action] = useActionState(recoveryCodesAction, undefined);
  if (state?.codes) {
    return (
      <div className="space-y-3">
        <Alert tone="amber"><strong>Save these codes now.</strong> They will not be shown again. Each code works once if you cannot use your authenticator app.</Alert>
        <ul aria-label="Recovery codes" className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-navy-900">
          {state.codes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <button type="button" onClick={() => window.print()} className="text-sm font-semibold text-teal-700 hover:underline">Print this page</button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      {remaining === 0
        ? <Alert tone="amber">You have no recovery codes. Create them now so a lost or replaced phone does not lock you out.</Alert>
        : <p className="text-sm text-slate-600">You have <strong>{remaining}</strong> unused recovery {remaining === 1 ? "code" : "codes"}. Creating new codes cancels the old ones.</p>}
      {state?.error && <Alert>{state.error}</Alert>}
      <Field label="Password" name="password" htmlFor="rc-pw"><Input id="rc-pw" name="password" type="password" autoComplete="current-password" required /></Field>
      <SubmitButton variant="secondary" pendingText="Creating…">{remaining === 0 ? "Create recovery codes" : "Create new recovery codes"}</SubmitButton>
    </form>
  );
}
