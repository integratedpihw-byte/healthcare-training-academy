import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";

export interface ChainReport {
  entries: number;
  valid: boolean;
  firstBrokenId: number | null;
}

/**
 * Recomputes every hash in the tenant's audit chain inside the database (same
 * canonical form as the insert trigger) and checks each link to its predecessor.
 */
export async function verifyAuditChain(tx: Tx): Promise<ChainReport> {
  const res = await tx.execute<{ id: number; ok: boolean }>(sql`
    with c as (
      select id, hash, prev_hash, lag(hash) over (order by id) as expected_prev,
        encode(sha256(convert_to(
          coalesce(prev_hash, '') || '|' || coalesce(tenant_id::text, '') || '|' ||
          coalesce(actor_user_id::text, '') || '|' || action || '|' || entity_type || '|' ||
          coalesce(entity_id, '') || '|' || coalesce(before::text, '') || '|' || coalesce(after::text, '') || '|' ||
          to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), 'UTF8')), 'hex') as recomputed
      from audit_logs where tenant_id = app_current_tenant()
    )
    select id::int, (hash = recomputed and prev_hash is not distinct from expected_prev) as ok
    from c order by id`);
  const broken = res.rows.find((r) => !r.ok);
  return { entries: res.rows.length, valid: !broken, firstBrokenId: broken?.id ?? null };
}
