import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

type Pools = { app: Pool; system: Pool; appDb: Db; systemDb: Db };

// Reuse pools across hot reloads in development.
const g = globalThis as unknown as { __chtaPools?: Pools };

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

function pools(): Pools {
  if (!g.__chtaPools) {
    const app = new Pool({ connectionString: requireEnv("DATABASE_URL"), max: 10 });
    const system = new Pool({ connectionString: requireEnv("SYSTEM_DATABASE_URL"), max: 5 });
    g.__chtaPools = {
      app,
      system,
      appDb: drizzle(app, { schema, casing: "snake_case" }),
      systemDb: drizzle(system, { schema, casing: "snake_case" }),
    };
  }
  return g.__chtaPools;
}

/**
 * PLATFORM client (BYPASSRLS). Use only for: authentication, platform super-admin
 * operations, scheduled jobs, webhooks and public certificate verification — and
 * always behind an explicit server-side authorization check.
 */
export function systemDb(): Db {
  return pools().systemDb;
}

export interface TenantScope {
  tenantId: string;
  userId?: string | null;
}

/**
 * Runs `fn` in a transaction on the RLS-enforced app role with app.tenant_id and
 * app.user_id set for that transaction only (SET LOCAL semantics). Every tenant
 * data access in the application goes through here.
 */
export async function withTenant<T>(scope: TenantScope, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!scope.tenantId) throw new Error("withTenant requires a tenantId");
  return pools().appDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.tenant_id', ${scope.tenantId}, true), set_config('app.user_id', ${scope.userId ?? ""}, true)`,
    );
    return fn(tx);
  });
}

/** For tests and graceful shutdown. */
export async function closePools() {
  if (g.__chtaPools) {
    await Promise.all([g.__chtaPools.app.end(), g.__chtaPools.system.end()]);
    g.__chtaPools = undefined;
  }
}
