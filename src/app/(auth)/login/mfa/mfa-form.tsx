"use client";
import { useActionState } from "react";
import { mfaAction, logoutAction } from "../../actions";
import { Alert, Button, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function MfaForm({ next }: { next?: string }) {
  const [state, action] = useActionState(mfaAction, undefined);
  return (
    <>
      <form action={action} className="mt-5 space-y-4">
        {state?.error && <Alert>{state.error}</Alert>}
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <Field label="Verification code" name="code">
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus />
        </Field>
        <SubmitButton className="w-full" pendingText="Verifying…">Verify</SubmitButton>
      </form>
      <form action={logoutAction} className="mt-3">
        <Button variant="ghost" className="w-full" type="submit">Cancel and sign out</Button>
      </form>
    </>
  );
}
