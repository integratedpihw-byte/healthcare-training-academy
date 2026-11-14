"use server";
import { planLimitCheck } from "@/lib/billing/limits";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { systemDb } from "@/db/server";
import { roles } from "@/db/schema";
import { requirePermission, requireFeature } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import {
  createDepartment,
  inviteMember,
  revokeMemberRole,
  saveFacility,
  setFacilityActive,
  updateOrganization,
} from "@/lib/tenancy/service";
import { deleteCustomRole, rolePermissionKeys, saveCustomRole, ungrantable } from "@/lib/rbac/service";
import { verifyAuditChain, type ChainReport } from "@/lib/audit-verify";

const uuid = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return /^[0-9a-f-]{36}$/i.test(s) ? s : null;
};

export async function updateOrganizationAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.settings.manage");
  const orgId = uuid(fd.get("orgId"));
  if (!orgId) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => updateOrganization(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, orgId, Object.fromEntries(fd)));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/admin/organization");
  return { ok: true, message: "Organization profile saved." };
}

export async function saveFacilityAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.facilities.manage");
  if (!fd.get("facilityId")) {
    const lim = await ctx.tx((tx) => planLimitCheck(tx, ctx.entitlements, "facility"));
    if (lim) return { error: lim };
  }
  const facilityId = uuid(fd.get("facilityId")) ?? undefined;
  const r = await ctx.tx((tx) => saveFacility(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, { ...Object.fromEntries(fd), designations: fd.getAll("designations").map(String) }, facilityId));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/admin/facilities");
  if (!facilityId) return { ok: true, message: "Facility created." };
  redirect("/admin/facilities?saved=1");
}

export async function toggleFacilityAction(fd: FormData) {
  const ctx = await requirePermission("org.facilities.manage");
  const id = uuid(fd.get("facilityId"));
  if (!id) return;
  await ctx.tx((tx) => setFacilityActive(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id, fd.get("active") === "true"));
  revalidatePath("/admin/facilities");
}

export async function createDepartmentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.facilities.manage");
  {
    const lim = await ctx.tx((tx) => planLimitCheck(tx, ctx.entitlements, "department"));
    if (lim) return { error: lim };
  }
  const r = await ctx.tx((tx) =>
    createDepartment(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, { name: String(fd.get("name") ?? ""), facilityId: uuid(fd.get("facilityId")) }),
  );
  if (!r.ok) return { error: r.error, values: formValues(fd) };
  revalidatePath("/admin/facilities");
  return { ok: true, message: "Department added." };
}

export async function inviteMemberAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.users.manage");
  const roleId = uuid(fd.get("roleId"));
  if (!roleId) return { error: "Select a role.", values: formValues(fd) };
  const r = await ctx.tx(async (tx) => {
    // System role templates may be assigned by anyone with org.users.manage (the
    // assignment is audited). Custom roles may not exceed the assigner's own permissions.
    const [role] = await tx.select({ isSystem: roles.isSystem }).from(roles).where(eq(roles.id, roleId));
    if (role && !role.isSystem) {
      const bad = ungrantable(ctx.access, await rolePermissionKeys(tx, roleId));
      if (bad.length) return { ok: false as const, error: `You cannot assign a role with permissions you do not hold (${bad.join(", ")}).` };
    }
    return inviteMember(systemDb(), tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, Object.fromEntries(fd));
  });
  if (!r.ok) return { error: r.error, fieldErrors: "fieldErrors" in r ? r.fieldErrors : undefined, values: formValues(fd) };
  revalidatePath("/admin/users");
  return { ok: true, message: r.data.created ? "User added. A set-password email has been sent." : "Role granted to existing user." };
}

export async function revokeRoleAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.users.manage");
  const id = uuid(fd.get("membershipRoleId"));
  if (!id) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => revokeMemberRole(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id));
  if (!r.ok) return { error: r.error };
  revalidatePath("/admin/users");
  return { ok: true, message: "Role removed." };
}

export async function saveRoleAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.roles.manage");
  requireFeature(ctx, "advancedRoles");
  const roleId = uuid(fd.get("roleId")) ?? undefined;
  const r = await ctx.tx((tx) =>
    saveCustomRole(
      tx,
      { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access },
      { name: fd.get("name"), description: fd.get("description") ?? "", permissions: fd.getAll("permissions").map(String) },
      roleId,
    ),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/admin/roles");
  return { ok: true, message: roleId ? "Role updated." : "Custom role created." };
}

export async function deleteRoleAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.roles.manage");
  const id = uuid(fd.get("roleId"));
  if (!id) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => deleteCustomRole(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id));
  if (!r.ok) return { error: r.error };
  revalidatePath("/admin/roles");
  return { ok: true, message: "Role deleted." };
}

export async function verifyAuditAction(_: ChainReport | undefined): Promise<ChainReport> {
  const ctx = await requirePermission("audit.view");
  return ctx.tx((tx) => verifyAuditChain(tx));
}
