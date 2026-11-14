"use client";
import { useActionState } from "react";
import { resetPasswordAction } from "../actions";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordHint } from "@/components/password-hint";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="mt-5 space-y-4">
      {state?.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <Field label="New password" name="password" error={state?.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      <PasswordHint />
      <Field label="Confirm new password" name="confirm" error={state?.fieldErrors?.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Saving…">Set new password</SubmitButton>
    </form>
  );
}
