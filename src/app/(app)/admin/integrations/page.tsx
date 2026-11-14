import Link from "next/link";
import { requireFeature, requirePermission } from "@/lib/auth/context";
import { API_SCOPES, listApiKeys } from "@/lib/integrations/api-keys";
import { API_RATE_PER_MINUTE, RESOURCES } from "@/lib/integrations/api";
import { Badge, Button, Card, EmptyState, PageHeader, Table, Td, fmtDate } from "@/components/ui";
import { CreateKeyForm } from "./create-key-form";
import { revokeKeyAction } from "./actions";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const ctx = await requirePermission("integrations.manage");
  requireFeature(ctx, "apiIntegrations");
  const keys = await ctx.tx((tx) => listApiKeys(tx));
  const now = new Date();
  return (
    <>
      <PageHeader title="Integrations & API keys" description="Read-only API for HR, scheduling and credentialing systems. Keys see only what you can see, and stop working if your access is removed." actions={<Link href="/admin" className="text-sm font-semibold text-teal-700 hover:underline">← Administration</Link>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="API keys">
            <Table head={["Name", "Key", "Scopes", "Last used", "Expires", "Status", ""]} empty={keys.length === 0 ? <EmptyState>No API keys yet.</EmptyState> : undefined}>
              {keys.map((k) => {
                const status = k.revokedAt ? "revoked" : k.expiresAt && k.expiresAt < now ? "expired" : "active";
                return (
                  <tr key={k.id}>
                    <Td>{k.name}<div className="text-xs text-slate-500">created {fmtDate(k.createdAt)}</div></Td>
                    <Td className="font-mono text-xs">chta_{k.prefix}_…</Td>
                    <Td className="text-xs">{k.scopes.join(", ")}</Td>
                    <Td>{k.lastUsedAt ? fmtDate(k.lastUsedAt) : "Never"}</Td>
                    <Td>{fmtDate(k.expiresAt)}</Td>
                    <Td><Badge tone={status === "active" ? "green" : "gray"}>{status}</Badge></Td>
                    <Td>{status === "active" && <form action={revokeKeyAction}><input type="hidden" name="id" value={k.id} /><Button type="submit" variant="danger" aria-label={`Revoke ${k.name}`}>Revoke</Button></form>}</Td>
                  </tr>
                );
              })}
            </Table>
          </Card>
          <Card title="Using the API">
            <div className="space-y-2 text-sm text-slate-700">
              <p>Send the key as a bearer token. All endpoints are <strong>GET</strong>, paginated with <code>limit</code> (max 500) and <code>offset</code>, and accept <code>updatedSince</code> (ISO date-time) where it applies. Limit: {API_RATE_PER_MINUTE} requests per minute per key. Every call is recorded in the audit trail.</p>
              <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{`curl -H "Authorization: Bearer chta_xxxxxxxxxx_…" \\\n  "$APP_URL/api/v1/employees?limit=100"`}</pre>
              <ul className="list-disc pl-5">{Object.entries(RESOURCES).map(([r, d]) => <li key={r}><code>/api/v1/{r}</code> — requires <code>{d.scope}</code></li>)}</ul>
              <p className="text-xs text-slate-500">The API never returns patient information, contact details, passwords or examination content.</p>
            </div>
          </Card>
        </div>
        <Card title="Create a key"><CreateKeyForm scopes={API_SCOPES} /></Card>
      </div>
    </>
  );
}
