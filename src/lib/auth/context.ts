import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { systemDb, withTenant, type Tx } from "@/db/server";
import { organizations, subscriptions, tenants } from "@/db/schema";
import { entitlementsFor, hasFeature, type Entitlements, type Feature } from "@/lib/billing/plans";
import { emailVerificationRequired, resolveSession, type ResolvedSession } from "./service";
import { loadAccess, can, type Access } from "@/lib/rbac/access";
import type { PermissionKey } from "@/lib/rbac/catalog";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-chta_session" : "chta_session";

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Number(process.env.SESSION_TTL_HOURS ?? 12) * 3600,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent"),
  };
}

export interface TenantInfo {
  id: string;
  name: string;
  type: "ORGANIZATION" | "INDIVIDUAL";
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "REJECTED" | "CLOSED";
  rejectionReason: string | null;
  /** IANA zone for displaying dates and times (organization setting). */
  timeZone: string;
  /** Two-step verification policy: ADMINS | ALL | OFF (organization setting). */
  mfaPolicy: string;
}

/** Permissions that make a user an administrator for the two-step verification policy. */
const ADMIN_PERMISSIONS: PermissionKey[] = ["org.users.manage", "org.roles.manage", "org.settings.manage", "employees.manage", "billing.manage", "integrations.manage"];
/** Test environments may switch enforcement off; production leaves these unset. */
const mfaEnforced = () => process.env.MFA_ENFORCEMENT !== "off";

export interface AuthContext {
  session: ResolvedSession;
  user: ResolvedSession["user"];
  tenant: TenantInfo | null;
  access: Access | null;
  /** Plan entitlements of the active tenant (spec §19). */
  entitlements: Entitlements | null;
}

/** Resolved once per request (React cache). */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await resolveSession(systemDb(), await sessionToken());
  if (!session) return null;
  let tenant: TenantInfo | null = null;
  let access: Access | null = null;
  if (session.activeTenantId) {
    const [t] = await systemDb()
      .select({ id: tenants.id, name: tenants.name, type: tenants.type, status: tenants.status, rejectionReason: tenants.rejectionReason, timeZone: organizations.timeZone, mfaPolicy: organizations.mfaPolicy })
      .from(tenants)
      .leftJoin(organizations, eq(organizations.tenantId, tenants.id))
      .where(eq(tenants.id, session.activeTenantId))
      .limit(1);
    // Personal (individual) workspaces have no organization row: Eastern Time, no policy.
    tenant = t ? { ...t, timeZone: t.timeZone ?? "America/New_York", mfaPolicy: t.mfaPolicy ?? "OFF" } : null;
    if (tenant) {
      access = await withTenant({ tenantId: tenant.id, userId: session.userId }, (tx) => loadAccess(tx, tenant!.id, session.userId));
      if (!access) tenant = null; // membership removed
    }
  }
  let entitlements: Entitlements | null = null;
  if (tenant) {
    const [sub] = await systemDb()
      .select({ plan: subscriptions.plan, status: subscriptions.status, seats: subscriptions.seats, facilityLimit: subscriptions.facilityLimit })
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenant.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    entitlements = entitlementsFor(sub ?? null);
  }
  return { session, user: session.user, tenant, access, entitlements };
});

/** Signed-in user with completed MFA (if enabled). */
export async function requireUser(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.user.mfaEnabled && !ctx.session.mfaVerified) redirect("/login/mfa");
  // Self-registered accounts confirm their email address before using the application.
  if (!ctx.user.emailVerified && !ctx.user.isPlatformAdmin && emailVerificationRequired()) redirect("/account/verify-email");
  return ctx;
}

export interface TenantContext extends AuthContext {
  tenant: TenantInfo;
  access: Access;
  entitlements: Entitlements;
  has: (f: Feature) => boolean;
  /** Run queries under RLS for the active tenant and user. */
  tx: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
  can: (perm: PermissionKey, facilityId?: string | null) => boolean;
}

/** Signed-in user acting inside an ACTIVE tenant. */
export async function requireTenant(): Promise<TenantContext> {
  const ctx = await requireUser();
  if (!ctx.tenant || !ctx.access) redirect(ctx.user.isPlatformAdmin ? "/platform" : "/account/no-organization");
  if (ctx.tenant.status !== "ACTIVE") redirect("/account/organization-status");
  const tenantId = ctx.tenant.id;
  const userId = ctx.user.id;
  const access = ctx.access;
  // Organization policy: administrators (or everyone) must use two-step verification.
  if (!ctx.user.mfaEnabled && mfaEnforced()) {
    const policy = ctx.tenant.mfaPolicy;
    if (policy === "ALL" || (policy === "ADMINS" && ADMIN_PERMISSIONS.some((p) => can(access, p)))) redirect("/settings/security?required=mfa");
  }
  return {
    ...ctx,
    tenant: ctx.tenant,
    access,
    entitlements: ctx.entitlements!,
    has: (f) => hasFeature(ctx.entitlements!, f),
    tx: (fn) => withTenant({ tenantId, userId }, fn),
    can: (perm, facilityId) => can(access, perm, facilityId),
  };
}

/** Plan gate: sends the user to Billing to upgrade when the feature is not included. */
export function requireFeature(ctx: TenantContext, f: Feature): void {
  if (!ctx.has(f)) redirect(`/billing?upgrade=${f}`);
}

/** Page/action guard: redirects to the forbidden page when the permission is missing. */
export async function requirePermission(perm: PermissionKey, facilityId?: string | null): Promise<TenantContext> {
  const ctx = await requireTenant();
  if (!ctx.can(perm, facilityId)) redirect(`/forbidden?p=${encodeURIComponent(perm)}`);
  return ctx;
}

/** Page/action guard: any one of the permissions suffices. */
export async function requireAnyPermission(perms: PermissionKey[]): Promise<TenantContext> {
  const ctx = await requireTenant();
  if (!perms.some((p) => ctx.can(p))) redirect(`/forbidden?p=${encodeURIComponent(perms[0])}`);
  return ctx;
}

export async function requirePlatformAdmin(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (!ctx.user.isPlatformAdmin) redirect("/forbidden?p=platform.admin");
  // Platform administrators work outside tenant isolation, so a password alone is not enough.
  if (!ctx.user.mfaEnabled && mfaEnforced()) redirect("/settings/security?required=mfa");
  return ctx;
}
