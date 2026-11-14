"use client";
import { useActionState } from "react";
import { Alert, Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createKeyAction } from "./actions";

export function CreateKeyForm({ scopes }: { scopes: Record<string, string> }) {
  const [state, action] = useActionState(createKeyAction, undefined);
  return (
    <div className="space-y-4">
      {state?.ok && state.secret && (
        <Alert tone="green">
          <p className="font-semibold">Copy this key now — it will not be shown again.</p>
          <code className="mt-2 block break-all rounded bg-white px-2 py-1 font-mono text-xs text-navy-900" data-testid="api-secret">{state.secret}</code>
          <p className="mt-2 text-xs">Store it in your integration&apos;s secret manager. Never put it in browser code or share it by email.</p>
        </Alert>
      )}
      {state?.error && <Alert>{state.error}</Alert>}
      <form action={action} className="space-y-3">
        <Field label="Name" name="name" htmlFor="k-name" error={state?.fieldErrors?.name}><Input id="k-name" name="name" required maxLength={80} placeholder="e.g. HRIS nightly sync" /></Field>
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Scopes (read-only)</legend>
          {state?.fieldErrors?.scopes && <p className="text-xs text-red-700">{state.fieldErrors.scopes[0]}</p>}
          <div className="mt-1 space-y-1">
            {Object.entries(scopes).map(([k, d]) => (
              <label key={k} className="flex items-start gap-2 text-sm"><input type="checkbox" name="scopes" value={k} className="mt-1" /><span><span className="font-mono text-xs">{k}</span> — {d}</span></label>
            ))}
          </div>
        </fieldset>
        <Field label="Expires after" name="expiresInDays" htmlFor="k-exp"><Select id="k-exp" name="expiresInDays" defaultValue="90"><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">1 year</option></Select></Field>
        <SubmitButton>Create API key</SubmitButton>
      </form>
    </div>
  );
}
