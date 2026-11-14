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
        <Field label="Verification code" name="code" hint="No phone? Enter one of your recovery codes instead.">
          <Input id="code" name="code" autoComplete="one-time-code" maxLength={14} required autoFocus autoCapitalize="characters" spellCheck={false} />
        </Field>
        <SubmitButton className="w-full" pendingText="Verifying…">Verify</SubmitButton>
      </form>
      <form action={logoutAction} className="mt-3">
        <Button variant="ghost" className="w-full" type="submit">Cancel and sign out</Button>
      </form>
    </>
  );
}
