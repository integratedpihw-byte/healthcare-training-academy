"use client";
import { useActionState } from "react";
import { loginAction } from "../actions";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-5 space-y-4" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <Field label="Email" name="email">
        <Input id="email" name="email" type="email" autoComplete="username" required defaultValue={state?.values?.email} />
      </Field>
      <Field label="Password" name="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
