"use client";
import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/lib/forms";
import { Alert } from "./ui";
import { SubmitButton } from "./submit-button";

const LABELS: Record<string, string> = {};

/**
 * Generic server-action form: shows errors (including field-level messages) and
 * success messages, resets on success when `resetOnSuccess` is set.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingText,
  className,
  resetOnSuccess = false,
  variant,
  confirm,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
  pendingText?: string;
  className?: string;
  resetOnSuccess?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "teal";
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    // React resets uncontrolled forms after an action; restore what the user typed on error.
    const values = state?.values;
    const form = ref.current;
    if (!state?.ok && values && form) {
      for (const el of Array.from(form.elements) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]) {
        if (!el.name || el.name.startsWith("$") || el.type === "hidden" || el.type === "password" || el.type === "submit") continue;
        const v = values[el.name];
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
          el.checked = v !== undefined && v.split("\n").includes(el.value);
        } else if (v !== undefined) {
          el.value = v;
        }
      }
    }
  }, [state, resetOnSuccess]);
  const fieldMsgs = Object.entries(state?.fieldErrors ?? {}).flatMap(([k, v]) => (v ?? []).map((m) => `${LABELS[k] ?? k}: ${m}`));
  return (
    <form
      ref={ref}
      action={formAction}
      className={className ?? "space-y-4"}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {state?.error && (
        <Alert>
          {state.error}
          {fieldMsgs.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs">
              {fieldMsgs.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      {state?.ok && state.message && <Alert tone="green">{state.message}</Alert>}
      {children}
      <SubmitButton variant={variant} pendingText={pendingText}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
