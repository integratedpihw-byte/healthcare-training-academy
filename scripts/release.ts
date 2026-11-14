/**
 * Release step, run by the hosting build before `next build` (see `vercel-build`).
 *  1. Applies pending migrations as the schema owner (MIGRATION_DATABASE_URL).
 *  2. Seeds reference data, the regulatory library and the course library (idempotent).
 *  3. Only when SEED_DEMO=1 AND the demo tenants do not exist yet: seeds clearly
 *     labeled DEMO tenants (staging/demo environments only — never production).
 * Skips everything when MIGRATION_DATABASE_URL is not set (e.g. preview builds).
 */
import path from "node:path";
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) {
    console.log("release: MIGRATION_DATABASE_URL not set — skipping migrations and seeding");
    return;
  }
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  const c = new Client({ connectionString: url, ssl: ca ? { ca, rejectUnauthorized: true } : undefined });
  await c.connect();
  await migrate(drizzle(c), { migrationsFolder: path.resolve(__dirname, "../drizzle") });
  console.log("release: ✓ migrations applied");
  const demoWanted = process.env.SEED_DEMO === "1";
  const { rows } = await c.query("select 1 from tenants where slug = 'demo-sunshine'");
  await c.end();
  const args = ["tsx", "scripts/seed.ts"];
  if (demoWanted && rows.length === 0) {
    if (!process.env.SEED_DEMO_PASSWORD) throw new Error("release: set SEED_DEMO_PASSWORD (a private value) before seeding demo accounts on an internet-facing deployment");
    args.push("--demo");
  }
  execFileSync("npx", args, { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, ALLOW_DEMO_SEED: demoWanted ? "1" : "" } });
  console.log(`release: ✓ seed complete${args.includes("--demo") ? " (with DEMO tenants)" : ""}`);
}

main().catch((e) => {
  console.error("release: failed", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
