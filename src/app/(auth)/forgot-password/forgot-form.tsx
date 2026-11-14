"use client";
import { useActionState } from "react";
import { forgotPasswordAction } from "../actions";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);
  if (state?.ok) return <div className="mt-5"><Alert tone="green">{state.message}</Alert></div>;
  return (
    <form action={action} className="mt-5 space-y-4">
      {state?.error && <Alert>{state.error}</Alert>}
      <Field label="Email" name="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
