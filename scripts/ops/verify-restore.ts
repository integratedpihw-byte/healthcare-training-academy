/**
 * OPERATIONS: verify a restored database (backup/restore drill or disaster recovery).
 * Prints row counts for key tables and verifies every tenant's tamper-evident audit
 * chain. Exit code 1 if any chain is broken or the RLS/security baseline is missing.
 *   SYSTEM_DATABASE_URL=postgres://…/restored_db tsx scripts/ops/verify-restore.ts
 */
import { sql } from "drizzle-orm";
import { closePools, systemDb, type Tx } from "@/db/client";
import { verifyAuditChain } from "@/lib/audit-verify";

async function main() {
  const db = systemDb();
  const counts = (await db.execute<Record<string, number>>(sql`
    select (select count(*)::int from tenants) tenants, (select count(*)::int from users) users,
           (select count(*)::int from employees) employees, (select count(*)::int from enrollments) enrollments,
           (select count(*)::int from certificates) certificates, (select count(*)::int from competency_assessments) competency_assessments,
           (select count(*)::int from audit_logs) audit_logs, (select count(*)::int from files) files,
           (select count(*)::int from pg_policies where schemaname = 'public') rls_policies,
           (select count(*)::int from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relforcerowsecurity) forced_rls_tables`)).rows[0];
  console.table(counts);
  let ok = counts.rls_policies > 100 && counts.forced_rls_tables > 40;
  if (!ok) console.error("✗ Row-level security baseline missing — was the dump restored with --no-acl or into the wrong roles?");
  const tenants = (await db.execute<{ id: string; name: string }>(sql`select id, name from tenants order by name`)).rows;
  for (const t of tenants) {
    // System role (bypasses RLS) with the tenant set, so every entry of the chain is checked.
    const r = await db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.tenant_id', ${t.id}, true)`);
      return verifyAuditChain(tx as unknown as Tx);
    });
    console.log(`${r.valid ? "✓" : "✗"} audit chain ${t.name}: ${r.entries} entries${r.valid ? "" : `, first broken id ${r.firstBrokenId}`}`);
    ok &&= r.valid;
  }
  console.log(ok ? "✓ Restore verified" : "✗ Restore verification FAILED");
  process.exitCode = ok ? 0 : 1;
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePools());
