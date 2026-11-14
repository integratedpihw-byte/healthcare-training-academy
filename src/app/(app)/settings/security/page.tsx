import { requireUser } from "@/lib/auth/context";
import { systemDb } from "@/db/server";
import { listSessions } from "@/lib/auth/service";
import { Alert, Badge, Card, Field, Input, PageHeader, Table, Td, fmtDateTime } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { PasswordHint } from "@/components/password-hint";
import { changePasswordAction, disableMfaAction, revokeSessionAction } from "../actions";
import { MfaSetup } from "./mfa-setup";

export const metadata = { title: "Security" };

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ required?: string }> }) {
  const ctx = await requireUser();
  const mfaRequired = (await searchParams).required === "mfa" && !ctx.user.mfaEnabled;
  const list = await listSessions(systemDb(), ctx.user.id);
  return (
    <>
      <PageHeader title="Security" description="Protect your account. Administrators should always use two-step verification." />
      {mfaRequired && <div className="mb-6"><Alert tone="amber"><strong>Two-step verification is required for platform administrators.</strong> Set it up below with an authenticator app, then return to the Platform Console.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2">Two-step verification {ctx.user.mfaEnabled ? <Badge tone="green">On</Badge> : <Badge tone="amber">Off</Badge>}</span>}>
          {ctx.user.mfaEnabled ? (
            <ActionForm action={disableMfaAction} submitLabel="Turn off two-step verification" variant="danger" confirm="Turn off two-step verification?">
              <p className="text-sm text-slate-600">To turn it off, confirm your password and a current code.</p>
              <Field label="Password" name="password" htmlFor="mfa-pw"><Input id="mfa-pw" name="password" type="password" autoComplete="current-password" required /></Field>
              <Field label="Authenticator code" name="code" htmlFor="mfa-code"><Input id="mfa-code" name="code" inputMode="numeric" maxLength={6} required /></Field>
            </ActionForm>
          ) : <MfaSetup />}
        </Card>
        <Card title="Change password">
          <ActionForm action={changePasswordAction} submitLabel="Change password" pendingText="Saving…" resetOnSuccess>
            <Field label="Current password" name="current"><Input id="current" name="current" type="password" autoComplete="current-password" required /></Field>
            <Field label="New password" name="password"><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} /></Field>
            <PasswordHint />
            <Field label="Confirm new password" name="confirm"><Input id="confirm" name="confirm" type="password" autoComplete="new-password" required /></Field>
          </ActionForm>
        </Card>
        <Card title="Active sessions" className="lg:col-span-2">
          <Table head={["Device", "IP address", "Signed in", "Last active", ""]}>
            {list.map((s) => (
              <tr key={s.id}>
                <Td className="max-w-xs truncate" title={s.userAgent ?? ""}>{s.userAgent?.slice(0, 60) ?? "Unknown"}</Td>
                <Td>{s.ipAddress ?? "—"}</Td>
                <Td>{fmtDateTime(s.createdAt)}</Td>
                <Td>{fmtDateTime(s.lastSeenAt)}</Td>
                <Td className="text-right">
                  {s.id === ctx.session.sessionId ? <Badge tone="teal">This session</Badge> : (
                    <form action={revokeSessionAction}><input type="hidden" name="sessionId" value={s.id} /><button type="submit" className="text-sm font-semibold text-red-700 hover:underline">Sign out</button></form>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
