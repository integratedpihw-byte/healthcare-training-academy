import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { membershipRoles, permissions, rolePermissions, roles } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { ALL_PERMISSIONS, type PermissionKey } from "./catalog";
import type { Access } from "./access";
import type { ServiceResult } from "@/lib/tenancy/service";

export const customRoleSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  permissions: z.array(z.enum(ALL_PERMISSIONS as [PermissionKey, ...PermissionKey[]])).min(1, "Select at least one permission"),
});

/** Privilege-escalation guard: actors may only grant permissions they hold tenant-wide. */
export function ungrantable(actor: Access, perms: string[]): string[] {
  return perms.filter((p) => actor.grants.get(p as PermissionKey) !== "ALL");
}

export async function rolePermissionKeys(tx: Tx, roleId: string): Promise<string[]> {
  const rows = await tx
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(rolePermissions.roleId, roleId));
  return rows.map((r) => r.key);
}

export async function saveCustomRole(
  tx: Tx,
  ctx: { tenantId: string; userId: string; access: Access },
  raw: unknown,
  roleId?: string,
): Promise<ServiceResult<{ id: string }>> {
  const p = customRoleSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const bad = ungrantable(ctx.access, p.data.permissions);
  if (bad.length) return { ok: false, error: `You cannot grant permissions you do not hold: ${bad.join(", ")}` };

  const key = `custom_${p.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
  const permRows = await tx.select({ id: permissions.id, key: permissions.key }).from(permissions).where(inArray(permissions.key, p.data.permissions));

  let id = roleId;
  if (id) {
    const [existing] = await tx.select().from(roles).where(eq(roles.id, id));
    if (!existing || existing.tenantId !== ctx.tenantId) return { ok: false, error: "Only custom roles can be edited." };
    await tx.update(roles).set({ name: p.data.name, description: p.data.description || null }).where(eq(roles.id, id));
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  } else {
    try {
      [{ id }] = await tx
        .insert(roles)
        .values({ tenantId: ctx.tenantId, key, name: p.data.name, description: p.data.description || null, isSystem: false })
        .returning({ id: roles.id });
    } catch (e) {
      const code = (e as { code?: string; cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code;
      if (code === "23505") return { ok: false, error: "A role with this name already exists." };
      throw e;
    }
  }
  await tx.insert(rolePermissions).values(permRows.map((r) => ({ roleId: id!, permissionId: r.id, tenantId: ctx.tenantId })));
  await writeAudit(tx, {
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: roleId ? "role.updated" : "role.created",
    entityType: "role",
    entityId: id!,
    after: { name: p.data.name, permissions: p.data.permissions },
  });
  return { ok: true, data: { id: id! } };
}

export async function deleteCustomRole(tx: Tx, ctx: { tenantId: string; userId: string }, roleId: string): Promise<ServiceResult<null>> {
  const [role] = await tx.select().from(roles).where(eq(roles.id, roleId));
  if (!role || role.tenantId !== ctx.tenantId) return { ok: false, error: "Only custom roles can be deleted." };
  const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(membershipRoles).where(eq(membershipRoles.roleId, roleId));
  if (n > 0) return { ok: false, error: `This role is assigned to ${n} user(s). Remove those assignments first.` };
  await tx.delete(roles).where(and(eq(roles.id, roleId), eq(roles.tenantId, ctx.tenantId)));
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "role.deleted", entityType: "role", entityId: roleId, before: { name: role.name } });
  return { ok: true, data: null };
}
