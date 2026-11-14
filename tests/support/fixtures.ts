import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { systemDb, withTenant } from "@/db/client";
import { employeeFacilities, employees, facilities, organizations, users } from "@/db/schema";
import { decideTenant, inviteMember, registerOrganization, systemRoleId } from "@/lib/tenancy/service";
import type { SystemRoleKey } from "@/lib/rbac/catalog";

export const PW = "Integration-Test#2026";

let admin: { id: string } | undefined;
export async function platformAdmin() {
  if (admin) return admin;
  const db = systemDb();
  const email = `platform-${randomUUID().slice(0, 8)}@test.example`;
  const { hashPassword } = await import("@/lib/auth/password");
  [admin] = await db.insert(users).values({ email, firstName: "Plat", lastName: "Admin", isPlatformAdmin: true, passwordHash: await hashPassword(PW) }).returning({ id: users.id });
  return admin!;
}

export interface TenantFixture {
  tenantId: string;
  adminUserId: string;
  adminEmail: string;
  orgId: string;
  facilityId: string;
  employeeId: string;
}

/** Registers + approves an organization with one facility and one employee. */
export async function createTenant(label: string, opts: { approve?: boolean } = {}): Promise<TenantFixture> {
  const db = systemDb();
  const tag = `${label}-${randomUUID().slice(0, 6)}`;
  const adminEmail = `admin-${tag}@test.example`.toLowerCase();
  const r = await registerOrganization(db, {
    organizationName: `Org ${tag}`,
    facilityName: `Facility ${tag}`,
    facilityType: "ASSISTED_LIVING_FACILITY",
    state: "FL",
    adminFirstName: "Ada",
    adminLastName: "Admin",
    adminEmail,
    password: PW,
    acceptTerms: true,
  });
  if (!r.ok) throw new Error(`fixture registration failed: ${r.error} ${JSON.stringify(r.fieldErrors)}`);
  if (opts.approve !== false) {
    const pa = await platformAdmin();
    const d = await decideTenant(db, { userId: pa.id, isPlatformAdmin: true }, r.data.tenantId, "approve");
    if (!d.ok) throw new Error(d.error);
  }
  const [org] = await db.select().from(organizations).where(eq(organizations.tenantId, r.data.tenantId));
  const [fac] = await db.select().from(facilities).where(eq(facilities.tenantId, r.data.tenantId));
  const [emp] = await db
    .insert(employees)
    .values({ tenantId: r.data.tenantId, organizationId: org.id, employeeNumber: `E-${tag}`, firstName: "Emp", lastName: tag, jobTitle: "CNA", positionCode: "CNA", hireDate: "2026-01-05", primaryFacilityId: fac.id, clinicalExposure: true })
    .returning({ id: employees.id });
  await db.insert(employeeFacilities).values({ tenantId: r.data.tenantId, employeeId: emp.id, facilityId: fac.id });
  return { tenantId: r.data.tenantId, adminUserId: r.data.userId, adminEmail, orgId: org.id, facilityId: fac.id, employeeId: emp.id };
}

/** Adds a user with the given system role to the tenant (acting as the tenant's org admin). */
export async function addMember(t: TenantFixture, role: SystemRoleKey, facilityId?: string) {
  const db = systemDb();
  const email = `${role}-${randomUUID().slice(0, 6)}@test.example`;
  const roleId = await systemRoleId(db, role);
  const r = await withTenant({ tenantId: t.tenantId, userId: t.adminUserId }, (tx) =>
    inviteMember(db, tx, { tenantId: t.tenantId, userId: t.adminUserId }, { email, firstName: "M", lastName: role, roleId, facilityId: facilityId ?? "" }),
  );
  if (!r.ok) throw new Error(r.error);
  return { userId: r.data.userId, email };
}

/** Sets a known password for a user (fixtures only). */
export async function setPassword(userId: string, pw = PW) {
  const { hashPassword } = await import("@/lib/auth/password");
  await systemDb().update(users).set({ passwordHash: await hashPassword(pw) }).where(eq(users.id, userId));
}

/** Extract Postgres error code from drizzle-wrapped errors. */
export function pgCode(e: unknown): string | undefined {
  const err = e as { code?: string; cause?: { code?: string } };
  return err.cause?.code ?? err.code;
}

export async function expectPgError(p: Promise<unknown>): Promise<{ code?: string; message: string }> {
  try {
    await p;
  } catch (e) {
    const err = e as Error & { cause?: Error };
    return { code: pgCode(e), message: `${err.message} ${err.cause?.message ?? ""}` };
  }
  throw new Error("Expected a database error but the operation succeeded");
}
