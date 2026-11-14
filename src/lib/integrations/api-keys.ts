/**
 * Organization API keys for the read-only integration API (Enterprise "apiIntegrations").
 * The secret is shown once at creation; only a SHA-256 hash and a short public prefix are
 * stored. Keys are immutable (scopes cannot be widened), revocation is permanent, and
 * every API call is rate-limited and audited.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import { apiKeys, subscriptions, tenants } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { entitlementsFor, hasFeature } from "@/lib/billing/plans";
import type { ServiceResult } from "@/lib/tenancy/service";

export const API_SCOPES = {
  "employees:read": "Employees (name, ID, position, facility, status — no contact details)",
  "assignments:read": "Training assignments and due dates",
  "certificates:read": "Certificates issued and expiration dates",
  "compliance:read": "Employee training compliance summary",
} as const;
export type ApiScope = keyof typeof API_SCOPES;

export const createKeySchema = z.object({
  name: z.string().trim().min(3, "Name the key (e.g. “HRIS sync”)").max(80),
  scopes: z.array(z.enum(Object.keys(API_SCOPES) as [ApiScope, ...ApiScope[]])).min(1, "Choose at least one scope"),
  expiresInDays: z.coerce.number().int().refine((n) => [30, 90, 180, 365].includes(n), "Choose an expiration"),
});

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const KEY_RE = /^chta_([a-z0-9]{10})_([A-Za-z0-9_-]{43})$/;

export async function createApiKey(tx: Tx, ctx: { tenantId: string; userId: string }, raw: unknown): Promise<ServiceResult<{ id: string; secret: string; prefix: string }>> {
  const p = createKeySchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const prefix = randomBytes(8).toString("hex").slice(0, 10).toLowerCase();
  const secret = `chta_${prefix}_${randomBytes(32).toString("base64url")}`;
  try {
    const [row] = await tx
      .insert(apiKeys)
      .values({ tenantId: ctx.tenantId, name: p.data.name, prefix, keyHash: sha256(secret), scopes: p.data.scopes, createdById: ctx.userId, expiresAt: new Date(Date.now() + p.data.expiresInDays * 86_400_000) })
      .returning({ id: apiKeys.id });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "api_key.created", entityType: "api_key", entityId: row.id, after: { name: p.data.name, prefix, scopes: p.data.scopes, expiresInDays: p.data.expiresInDays } });
    return { ok: true, data: { id: row.id, secret, prefix } };
  } catch {
    return { ok: false, error: "You are not authorized to manage API keys." };
  }
}

export async function revokeApiKey(tx: Tx, ctx: { tenantId: string; userId: string }, id: string): Promise<ServiceResult<null>> {
  const r = await tx.update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, ctx.tenantId))).returning({ id: apiKeys.id }).catch(() => []);
  if (!r.length) return { ok: false, error: "Key not found, already revoked, or not authorized." };
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "api_key.revoked", entityType: "api_key", entityId: id });
  return { ok: true, data: null };
}

export async function listApiKeys(tx: Tx) {
  return tx.select({ id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix, scopes: apiKeys.scopes, lastUsedAt: apiKeys.lastUsedAt, expiresAt: apiKeys.expiresAt, revokedAt: apiKeys.revokedAt, createdAt: apiKeys.createdAt }).from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export interface ApiPrincipal {
  keyId: string;
  tenantId: string;
  createdById: string;
  scopes: ApiScope[];
}

/** Authenticates "Authorization: Bearer chta_…". Uses the system connection (no tenant yet). */
export async function authenticateApiKey(sys: Db, header: string | null): Promise<ApiPrincipal | { error: string; status: number }> {
  const m = header?.match(/^Bearer\s+(\S+)$/i);
  const parts = m ? KEY_RE.exec(m[1]) : null;
  if (!m || !parts) return { error: "Missing or malformed API key", status: 401 };
  const [row] = await sys.select().from(apiKeys).where(eq(apiKeys.prefix, parts[1]));
  const ok = row && timingSafeEqual(Buffer.from(row.keyHash, "hex"), Buffer.from(sha256(m[1]), "hex"));
  if (!row || !ok) return { error: "Invalid API key", status: 401 };
  if (row.revokedAt) return { error: "API key revoked", status: 401 };
  if (row.expiresAt && row.expiresAt < new Date()) return { error: "API key expired", status: 401 };
  const [t] = await sys.select({ status: tenants.status }).from(tenants).where(eq(tenants.id, row.tenantId));
  if (t?.status !== "ACTIVE") return { error: "Organization is not active", status: 403 };
  const [sub] = await sys.select().from(subscriptions).where(eq(subscriptions.tenantId, row.tenantId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  if (!hasFeature(entitlementsFor(sub ?? null), "apiIntegrations")) return { error: "API access is not included in the current plan", status: 402 };
  await sys.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));
  return { keyId: row.id, tenantId: row.tenantId, createdById: row.createdById, scopes: row.scopes as ApiScope[] };
}
