/**
 * PERFORMANCE TESTING ONLY. Times the heaviest server-side operations under row-level
 * security as the Sunshine (DEMO) organization administrator on a *_perf database.
 * Usage: dotenv -e .env.perf -- tsx scripts/perf/bench.ts
 */
import { eq, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import { tenants, users } from "@/db/schema";
import { loadAccess } from "@/lib/rbac/access";
import { analytics } from "@/lib/analytics/service";
import { evaluateCompliance } from "@/lib/compliance/service";
import { complianceFor } from "@/lib/workforce/compliance";
import { adminDashboard } from "@/lib/dashboard/queries";
import { REPORTS } from "@/lib/reports/definitions";
import { myLearning } from "@/lib/learning/learner";

async function main() {
  if (!process.env.SYSTEM_DATABASE_URL!.endsWith("_perf")) throw new Error("Use a *_perf database");
  const sys = systemDb();
  const [t] = await sys.select().from(tenants).where(eq(tenants.slug, "demo-sunshine"));
  const [admin] = await sys.select().from(users).where(eq(users.email, "orgadmin@sunshine.example"));
  const [lrn] = await sys.select().from(users).where(eq(users.email, "load17@sunshine-load.example"));
  const as = <R>(uid: string, fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: t.id, userId: uid }, fn);
  const access = (await as(admin.id, (tx) => loadAccess(tx, t.id, admin.id)))!;
  const rctx = { tenantId: t.id, userId: admin.id, access };
  const cases: [string, () => Promise<unknown>][] = [
    ["admin dashboard", () => as(admin.id, (tx) => adminDashboard(tx, null, true))],
    ["analytics (all filters off)", () => as(admin.id, (tx) => analytics(tx, {}))],
    ["employee compliance (all)", () => as(admin.id, async (tx) => complianceFor(tx, (await tx.execute<{ id: string }>(sql`select id from employees`)).rows.map((r) => r.id)))],
    ["regulatory compliance (org)", () => as(admin.id, (tx) => evaluateCompliance(tx, t.id))],
    ["report: overdue training", () => as(admin.id, (tx) => REPORTS.find((r) => r.key === "overdue")!.run(tx, rctx, {}))],
    ["report: hours by employee", () => as(admin.id, (tx) => REPORTS.find((r) => r.key === "hours-by-employee")!.run(tx, rctx, {}))],
    ["learner: my learning", () => as(lrn.id, (tx) => myLearning(tx, lrn.id))],
  ];
  console.log("| Operation | median ms | max ms |\n|---|---:|---:|");
  for (const [name, fn] of cases) {
    await fn(); // warm
    const ms: number[] = [];
    for (let i = 0; i < 5; i++) {
      const s = performance.now();
      await fn();
      ms.push(performance.now() - s);
    }
    ms.sort((a, b) => a - b);
    console.log(`| ${name} | ${Math.round(ms[2])} | ${Math.round(ms[4])} |`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePools());
