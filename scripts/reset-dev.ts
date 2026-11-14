/**
 * DEVELOPMENT ONLY: drops and rebuilds the database from migrations, then seeds
 * reference + demo data. Refuses to run in production.
 *   npm run db:reset
 */
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("db:reset is disabled in production");
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error("MIGRATION_DATABASE_URL is required");
  const c = new Client({ connectionString: url });
  await c.connect();
  await c.query("drop schema if exists drizzle cascade; drop schema public cascade; create schema public;");
  await migrate(drizzle(c), { migrationsFolder: path.resolve(__dirname, "../drizzle") });
  await c.end();
  console.log("✓ Database rebuilt from migrations");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
