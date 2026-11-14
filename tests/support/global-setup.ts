/**
 * Integration test bootstrap: rebuilds the TEST database from migrations
 * (as the schema owner) and loads reference data. Refuses to run against a
 * database whose name does not end in "_test".
 */
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";

export default async function setup() {
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error("MIGRATION_DATABASE_URL is required for integration tests (see .env.test)");
  if (!/_test(\?|$)/.test(new URL(url).pathname + (new URL(url).search || ""))) {
    throw new Error(`Refusing to reset non-test database: ${new URL(url).pathname}`);
  }
  const c = new Client({ connectionString: url });
  await c.connect();
  await c.query("drop schema if exists drizzle cascade; drop schema public cascade; create schema public;");
  await migrate(drizzle(c), { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  await c.end();

  const { systemDb, closePools } = await import("../../src/db/client");
  const { seedReference } = await import("../../src/db/seed/reference");
  await seedReference(systemDb());
  const { seedRegulatory } = await import("../../src/db/seed/regulatory");
  await seedRegulatory(systemDb());
  await closePools();
}
