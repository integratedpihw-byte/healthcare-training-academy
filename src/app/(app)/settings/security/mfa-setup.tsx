"use client";
import { useState, useTransition } from "react";
import QRCode from "qrcode";
import { beginMfaAction, confirmMfaAction } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";
import { ActionForm } from "@/components/action-form";

export function MfaSetup() {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!setup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Use an authenticator app (Microsoft Authenticator, Google Authenticator, 1Password, Authy) to generate sign-in codes.</p>
        {error && <Alert>{error}</Alert>}
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await beginMfaAction();
              if ("error" in r) return setError(r.error);
              setSetup({ secret: r.secret, qr: await QRCode.toDataURL(r.uri, { margin: 1, width: 200 }) });
            })
          }
        >
          {pending ? "Preparing…" : "Set up two-step verification"}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Scan this QR code with your authenticator app.</li>
        <li>Enter the 6-digit code it shows to finish.</li>
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={setup.qr} alt="QR code for authenticator setup" width={200} height={200} className="rounded border border-slate-200" />
      <p className="text-xs text-slate-500">Can&apos;t scan? Enter this key manually: <code className="break-all font-mono text-navy-900">{setup.secret}</code></p>
      <ActionForm action={confirmMfaAction} submitLabel="Verify and turn on" variant="teal">
        <Field label="Authenticator code" name="code"><Input id="code" name="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" required /></Field>
      </ActionForm>
    </div>
  );
}
