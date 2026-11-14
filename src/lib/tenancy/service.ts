/**
 * Tenant lifecycle: organization/individual registration, platform approval,
 * and in-tenant administration (organization profile, facilities, departments, members).
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import {
  FACILITY_TYPES,
  departments,
  facilities,
  membershipRoles,
  memberships,
  notificationPreferences,
  organizations,
  roles,
  subscriptions,
  tenants,
  users,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { hashPassword, passwordIssues } from "@/lib/auth/password";
import { normalizeEmail, secureUnverifiedAccount, sendPasswordLink } from "@/lib/auth/service";
import { randomToken } from "@/lib/auth/crypto";
import type { SystemRoleKey } from "@/lib/rbac/catalog";

export const TRIAL_DAYS = 14;

const usState = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Use a 2-letter state code");

export const registerOrganizationSchema = z.object({
  organizationName: z.string().trim().min(2).max(200),
  legalName: z.string().trim().min(2).max(200).optional(),
  facilityName: z.string().trim().min(2).max(200),
  facilityType: z.enum(FACILITY_TYPES),
  licenseNumber: z.string().trim().max(60).optional().or(z.literal("")),
  state: usState.default("FL"),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  adminFirstName: z.string().trim().min(1).max(100),
  adminLastName: z.string().trim().min(1).max(100),
  adminEmail: z.string().trim().email().max(254),
  password: z.string(),
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).default("STARTER"),
  acceptTerms: z.literal(true, { error: "You must accept the terms" }),
});
export type RegisterOrganizationInput = z.input<typeof registerOrganizationSchema>;

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "org"}-${randomToken(4).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)}`;
}

export async function systemRoleId(db: Db | Tx, key: SystemRoleKey): Promise<string> {
  const [r] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(isNull(roles.tenantId), eq(roles.key, key)))
    .limit(1);
  if (!r) throw new Error(`System role ${key} is not seeded. Run npm run db:seed:reference`);
  return r.id;
}

/** Self-service organization registration (platform operation, system client). */
export async function registerOrganization(
  db: Db,
  raw: unknown,
  meta: { ip?: string | null } = {},
): Promise<ServiceResult<{ tenantId: string; userId: string }>> {
  const parsed = registerOrganizationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const input = parsed.data;
  const email = normalizeEmail(input.adminEmail);
  const issues = passwordIssues(input.password, [email, input.adminFirstName, input.adminLastName]);
  if (issues.length) return { ok: false, error: "Password does not meet requirements.", fieldErrors: { password: issues } };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return {
      ok: false,
      error: "An account with this email already exists. Sign in first, then register the organization from your account.",
      fieldErrors: { adminEmail: ["Email already registered"] },
    };
  }

  const passwordHash = await hashPassword(input.password);
  const orgAdminRole = await systemRoleId(db, "org_admin");

  const result = await db.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({ name: input.organizationName, slug: slugify(input.organizationName), type: "ORGANIZATION", status: "PENDING_APPROVAL", primaryState: input.state })
      .returning();
    const [user] = await tx
      .insert(users)
      .values({ email, passwordHash, firstName: input.adminFirstName, lastName: input.adminLastName })
      .returning({ id: users.id });
    const [org] = await tx
      .insert(organizations)
      .values({
        tenantId: tenant.id,
        legalName: input.legalName || input.organizationName,
        displayName: input.organizationName,
        phone: input.phone || null,
        email,
        city: input.city || null,
        state: input.state,
      })
      .returning({ id: organizations.id });
    const [facility] = await tx
      .insert(facilities)
      .values({
        tenantId: tenant.id,
        organizationId: org.id,
        name: input.facilityName,
        facilityType: input.facilityType,
        licenseNumber: input.licenseNumber || null,
        city: input.city || null,
        state: input.state,
      })
      .returning({ id: facilities.id });
    const [membership] = await tx
      .insert(memberships)
      .values({ tenantId: tenant.id, userId: user.id })
      .returning({ id: memberships.id });
    await tx.insert(membershipRoles).values({ tenantId: tenant.id, membershipId: membership.id, roleId: orgAdminRole });
    await tx.insert(subscriptions).values({
      tenantId: tenant.id,
      plan: input.plan,
      status: "TRIALING",
      pricingModel: input.plan === "ENTERPRISE" ? "PER_FACILITY" : "PER_EMPLOYEE",
      seats: input.plan === "STARTER" ? 25 : input.plan === "PROFESSIONAL" ? 150 : 1000,
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
    });
    await tx.insert(notificationPreferences).values({ tenantId: tenant.id });
    await writeAudit(tx, {
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "tenant.registered",
      entityType: "tenant",
      entityId: tenant.id,
      after: { name: tenant.name, facilityType: input.facilityType, facilityId: facility.id, plan: input.plan },
      ipAddress: meta.ip,
    });
    return { tenantId: tenant.id, userId: user.id };
  });
  return { ok: true, data: result };
}

export const registerIndividualSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string(),
  state: usState.default("FL"),
  acceptTerms: z.literal(true, { error: "You must accept the terms" }),
});

/** Individual learners get a personal tenant (uniform isolation); active immediately. */
export async function registerIndividual(db: Db, raw: unknown): Promise<ServiceResult<{ tenantId: string; userId: string }>> {
  const parsed = registerIndividualSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  const input = parsed.data;
  const email = normalizeEmail(input.email);
  const issues = passwordIssues(input.password, [email, input.firstName, input.lastName]);
  if (issues.length) return { ok: false, error: "Password does not meet requirements.", fieldErrors: { password: issues } };
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { ok: false, error: "An account with this email already exists.", fieldErrors: { email: ["Email already registered"] } };

  const passwordHash = await hashPassword(input.password);
  const learnerRole = await systemRoleId(db, "learner");
  const data = await db.transaction(async (tx) => {
    const name = `${input.firstName} ${input.lastName}`;
    const [tenant] = await tx
      .insert(tenants)
      .values({ name, slug: slugify(name), type: "INDIVIDUAL", status: "ACTIVE", primaryState: input.state, approvedAt: new Date() })
      .returning({ id: tenants.id });
    const [user] = await tx.insert(users).values({ email, passwordHash, firstName: input.firstName, lastName: input.lastName }).returning({ id: users.id });
    const [m] = await tx.insert(memberships).values({ tenantId: tenant.id, userId: user.id }).returning({ id: memberships.id });
    await tx.insert(membershipRoles).values({ tenantId: tenant.id, membershipId: m.id, roleId: learnerRole });
    await tx.insert(subscriptions).values({ tenantId: tenant.id, plan: "INDIVIDUAL_LEARNER", pricingModel: "FLAT", seats: 1, status: "TRIALING", trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000) });
    await tx.insert(notificationPreferences).values({ tenantId: tenant.id });
    await writeAudit(tx, { tenantId: tenant.id, actorUserId: user.id, action: "tenant.registered_individual", entityType: "tenant", entityId: tenant.id });
    return { tenantId: tenant.id, userId: user.id };
  });
  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Platform approval workflow (Super Administrator only — caller must verify)
// ---------------------------------------------------------------------------

export async function decideTenant(
  db: Db,
  actor: { userId: string; isPlatformAdmin: boolean },
  tenantId: string,
  decision: "approve" | "reject" | "suspend" | "reactivate",
  reason?: string,
): Promise<ServiceResult<{ status: string }>> {
  if (!actor.isPlatformAdmin) return { ok: false, error: "Only platform administrators can change tenant status." };
  const [t] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!t) return { ok: false, error: "Tenant not found." };

  const transitions: Record<typeof decision, { from: string[]; to: "ACTIVE" | "REJECTED" | "SUSPENDED" }> = {
    approve: { from: ["PENDING_APPROVAL"], to: "ACTIVE" },
    reject: { from: ["PENDING_APPROVAL"], to: "REJECTED" },
    suspend: { from: ["ACTIVE"], to: "SUSPENDED" },
    reactivate: { from: ["SUSPENDED"], to: "ACTIVE" },
  };
  const tr = transitions[decision];
  if (!tr.from.includes(t.status)) return { ok: false, error: `Cannot ${decision} a tenant that is ${t.status}.` };
  if ((decision === "reject" || decision === "suspend") && !reason?.trim()) return { ok: false, error: "A reason is required." };

  await db.transaction(async (tx) => {
    await tx
      .update(tenants)
      .set({
        status: tr.to,
        approvedAt: decision === "approve" ? new Date() : t.approvedAt,
        approvedById: decision === "approve" ? actor.userId : t.approvedById,
        rejectionReason: decision === "reject" || decision === "suspend" ? reason!.trim() : null,
      })
      .where(eq(tenants.id, tenantId));
    await writeAudit(tx, {
      tenantId,
      actorUserId: actor.userId,
      action: `tenant.${decision}`,
      entityType: "tenant",
      entityId: tenantId,
      before: { status: t.status },
      after: { status: tr.to, reason: reason ?? null },
    });
  });
  return { ok: true, data: { status: tr.to } };
}

// ---------------------------------------------------------------------------
// In-tenant administration (RLS-scoped transaction; caller checks permission,
// database RESTRICTIVE policies enforce it again).
// ---------------------------------------------------------------------------

export const organizationProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(200),
  legalName: z.string().trim().min(2).max(200),
  ein: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: usState,
  postalCode: z.string().trim().max(12).optional().or(z.literal("")),
});

export async function updateOrganization(tx: Tx, ctx: { tenantId: string; userId: string }, orgId: string, raw: unknown): Promise<ServiceResult<null>> {
  const p = organizationProfileSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const [before] = await tx.select().from(organizations).where(eq(organizations.id, orgId));
  if (!before) return { ok: false, error: "Organization not found." };
  const v = p.data;
  const values = {
    displayName: v.displayName,
    legalName: v.legalName,
    ein: v.ein || null,
    phone: v.phone || null,
    email: v.email || null,
    addressLine1: v.addressLine1 || null,
    city: v.city || null,
    state: v.state,
    postalCode: v.postalCode || null,
  };
  await tx.update(organizations).set(values).where(eq(organizations.id, orgId));
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "organization.updated", entityType: "organization", entityId: orgId, before, after: values });
  return { ok: true, data: null };
}

export const facilitySchema = z.object({
  name: z.string().trim().min(2).max(200),
  facilityType: z.enum(FACILITY_TYPES),
  licenseType: z.string().trim().max(100).optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(60).optional().or(z.literal("")),
  licenseExpires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: usState,
  postalCode: z.string().trim().max(12).optional().or(z.literal("")),
  designations: z.array(z.string().trim().regex(/^[A-Z0-9_]{2,40}$/)).max(20).default([]),
});

export async function saveFacility(
  tx: Tx,
  ctx: { tenantId: string; userId: string },
  raw: unknown,
  facilityId?: string,
): Promise<ServiceResult<{ id: string }>> {
  const p = facilitySchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  const values = {
    name: v.name,
    facilityType: v.facilityType,
    licenseType: v.licenseType || null,
    licenseNumber: v.licenseNumber || null,
    licenseExpires: v.licenseExpires || null,
    addressLine1: v.addressLine1 || null,
    city: v.city || null,
    state: v.state,
    postalCode: v.postalCode || null,
    designations: [...new Set(v.designations)],
  };
  if (facilityId) {
    const [before] = await tx.select().from(facilities).where(eq(facilities.id, facilityId));
    if (!before) return { ok: false, error: "Facility not found." };
    await tx.update(facilities).set(values).where(eq(facilities.id, facilityId));
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "facility.updated", entityType: "facility", entityId: facilityId, before, after: values });
    return { ok: true, data: { id: facilityId } };
  }
  const [org] = await tx.select({ id: organizations.id }).from(organizations).limit(1);
  if (!org) return { ok: false, error: "Organization profile missing." };
  const [f] = await tx.insert(facilities).values({ ...values, tenantId: ctx.tenantId, organizationId: org.id }).returning({ id: facilities.id });
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "facility.created", entityType: "facility", entityId: f.id, after: values });
  return { ok: true, data: { id: f.id } };
}

export async function setFacilityActive(tx: Tx, ctx: { tenantId: string; userId: string }, facilityId: string, isActive: boolean) {
  await tx.update(facilities).set({ isActive }).where(eq(facilities.id, facilityId));
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: isActive ? "facility.activated" : "facility.deactivated", entityType: "facility", entityId: facilityId });
}

export async function createDepartment(tx: Tx, ctx: { tenantId: string; userId: string }, input: { name: string; facilityId?: string | null }): Promise<ServiceResult<{ id: string }>> {
  const name = input.name?.trim();
  if (!name || name.length < 2 || name.length > 120) return { ok: false, error: "Department name must be 2–120 characters." };
  const [org] = await tx.select({ id: organizations.id }).from(organizations).limit(1);
  if (!org) return { ok: false, error: "Organization profile missing." };
  try {
    const [d] = await tx
      .insert(departments)
      .values({ tenantId: ctx.tenantId, organizationId: org.id, facilityId: input.facilityId || null, name })
      .returning({ id: departments.id });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "department.created", entityType: "department", entityId: d.id, after: input });
    return { ok: true, data: { id: d.id } };
  } catch (e) {
    if (String((e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code) === "23505") return { ok: false, error: "That department already exists." };
    throw e;
  }
}

export const inviteMemberSchema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  roleId: z.string().uuid(),
  facilityId: z.string().uuid().optional().or(z.literal("")),
});

/**
 * Adds a user to the tenant with a role. New identities are created by the platform
 * client (users are global) with an unusable random password and receive a
 * set-password email; membership rows are written through the RLS-scoped tx.
 */
export async function inviteMember(
  sys: Db,
  tx: Tx,
  ctx: { tenantId: string; userId: string },
  raw: unknown,
): Promise<ServiceResult<{ userId: string; created: boolean }>> {
  const p = inviteMemberSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  const email = normalizeEmail(v.email);

  // Role must be visible to this tenant (system or own) — RLS guarantees visibility.
  const [role] = await tx.select({ id: roles.id, key: roles.key }).from(roles).where(eq(roles.id, v.roleId));
  if (!role) return { ok: false, error: "Role not found." };
  if (role.key === "facility_admin" && !v.facilityId) return { ok: false, fieldErrors: { facilityId: ["Facility Administrator requires a facility"] }, error: "Select a facility." };
  if (v.facilityId) {
    const [f] = await tx.select({ id: facilities.id }).from(facilities).where(eq(facilities.id, v.facilityId));
    if (!f) return { ok: false, error: "Facility not found." };
  }

  let created = false;
  let [u] = await sys.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!u) {
    [u] = await sys
      .insert(users)
      .values({ email, firstName: v.firstName, lastName: v.lastName, status: "ACTIVE", passwordHash: await hashPassword(randomToken(48)) })
      .returning({ id: users.id });
    created = true;
  }

  const [existing] = await tx.select({ id: memberships.id }).from(memberships).where(eq(memberships.userId, u.id));
  const membershipId =
    existing?.id ??
    (await tx.insert(memberships).values({ tenantId: ctx.tenantId, userId: u.id }).returning({ id: memberships.id }))[0].id;
  await tx
    .insert(membershipRoles)
    .values({ tenantId: ctx.tenantId, membershipId, roleId: role.id, facilityId: v.facilityId || null })
    .onConflictDoNothing();
  await writeAudit(tx, {
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "member.role_granted",
    entityType: "membership",
    entityId: membershipId,
    after: { userId: u.id, role: role.key, facilityId: v.facilityId || null },
  });
  if (created) await sendPasswordLink(sys, u.id, email, "invite");
  else if (!existing) await secureUnverifiedAccount(sys, u.id, email); // first access to this organization
  return { ok: true, data: { userId: u.id, created } };
}

export async function revokeMemberRole(tx: Tx, ctx: { tenantId: string; userId: string }, membershipRoleId: string): Promise<ServiceResult<null>> {
  const [mr] = await tx.select().from(membershipRoles).where(eq(membershipRoles.id, membershipRoleId));
  if (!mr) return { ok: false, error: "Role assignment not found." };
  // Never remove the last organization administrator.
  const orgAdminRole = await systemRoleId(tx, "org_admin");
  if (mr.roleId === orgAdminRole) {
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(membershipRoles)
      .innerJoin(memberships, eq(memberships.id, membershipRoles.membershipId))
      .where(and(eq(membershipRoles.roleId, orgAdminRole), eq(memberships.status, "ACTIVE")));
    if (n <= 1) return { ok: false, error: "At least one Organization Administrator is required." };
  }
  await tx.delete(membershipRoles).where(eq(membershipRoles.id, membershipRoleId));
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "member.role_revoked", entityType: "membership_role", entityId: membershipRoleId, before: mr });
  return { ok: true, data: null };
}
