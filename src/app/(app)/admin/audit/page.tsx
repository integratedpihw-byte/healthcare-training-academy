import { desc, eq, lt } from "drizzle-orm";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/context";
import { auditLogs, users } from "@/db/schema";
import { Card, EmptyState, PageHeader, Table, Td } from "@/components/ui";
import { VerifyChain } from "./verify-chain";

export const metadata = { title: "Audit trail" };
const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const ctx = await requirePermission("audit.view");
  const before = Number((await searchParams).before) || null;
  const rows = await ctx.tx((tx) =>
    tx
      .select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, createdAt: auditLogs.createdAt, hash: auditLogs.hash, first: users.firstName, last: users.lastName, email: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorUserId))
      .where(before ? lt(auditLogs.id, before) : undefined)
      .orderBy(desc(auditLogs.id))
      .limit(PAGE),
  );
  return (
    <>
      <PageHeader title="Audit trail" description="Append-only and hash-chained. Entries cannot be edited or deleted, including by administrators." />
      <div className="space-y-6">
        <VerifyChain />
        <Card>
          <Table head={["#", "When", "Actor", "Action", "Entity", "Hash"]} empty={rows.length === 0 ? <EmptyState>No entries.</EmptyState> : undefined}>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{r.id}</Td>
                <Td className="whitespace-nowrap">{r.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" })}</Td>
                <Td>{r.first ? <>{r.first} {r.last}<div className="text-xs text-slate-500">{r.email}</div></> : "System"}</Td>
                <Td><code className="text-xs">{r.action}</code></Td>
                <Td className="text-xs">{r.entityType}<div className="text-slate-500">{r.entityId?.slice(0, 8)}</div></Td>
                <Td><code className="text-[11px] text-slate-500">{r.hash?.slice(0, 12)}…</code></Td>
              </tr>
            ))}
          </Table>
          {rows.length === PAGE && (
            <div className="mt-4 text-right"><Link className="text-sm font-semibold text-teal-700 hover:underline" href={`/admin/audit?before=${rows[rows.length - 1].id}`}>Older entries →</Link></div>
          )}
        </Card>
      </div>
    </>
  );
}
