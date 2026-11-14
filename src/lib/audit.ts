import { auditLogs } from "@/db/schema";
import type { Db, Tx } from "@/db/client";

export interface AuditEntry {
  tenantId: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
}

/**
 * Appends to the immutable, hash-chained audit log. Call inside the same
 * transaction as the change being audited so both commit or neither does.
 */
export async function writeAudit(db: Db | Tx, e: AuditEntry): Promise<void> {
  await db.insert(auditLogs).values({
    tenantId: e.tenantId,
    actorUserId: e.actorUserId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId ?? null,
    before: e.before === undefined ? null : redact(e.before),
    after: e.after === undefined ? null : redact(e.after),
    ipAddress: e.ipAddress ?? null,
  });
}

const SECRET_KEYS = /password|secret|token|hash/i;

function redact(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(redact);
  if (v && typeof v === "object" && !(v instanceof Date)) {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [
        k,
        SECRET_KEYS.test(k) ? "[REDACTED]" : redact(val),
      ]),
    );
  }
  return v;
}
