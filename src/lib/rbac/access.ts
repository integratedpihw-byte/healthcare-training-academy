import { and, eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { membershipRoles, memberships, permissions, rolePermissions, roles } from "@/db/schema";
import type { PermissionKey } from "./catalog";

/** "ALL" = permission held tenant-wide; a Set = held only for those facilities. */
export type Scope = "ALL" | Set<string>;

export interface Access {
  membershipId: string;
  roles: { key: string; name: string; facilityId: string | null }[];
  grants: Map<PermissionKey, Scope>;
}

/** Loads the user's roles and effective permissions in the current tenant (RLS-scoped tx). */
export async function loadAccess(tx: Tx, tenantId: string, userId: string): Promise<Access | null> {
  const [m] = await tx
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantId), eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")))
    .limit(1);
  if (!m) return null;

  const rows = await tx
    .select({
      roleKey: roles.key,
      roleName: roles.name,
      facilityId: membershipRoles.facilityId,
      perm: permissions.key,
    })
    .from(membershipRoles)
    .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(membershipRoles.membershipId, m.id));

  const grants = new Map<PermissionKey, Scope>();
  const roleMap = new Map<string, { key: string; name: string; facilityId: string | null }>();
  for (const r of rows) {
    roleMap.set(`${r.roleKey}:${r.facilityId ?? "*"}`, { key: r.roleKey, name: r.roleName, facilityId: r.facilityId });
    if (!r.perm) continue;
    const key = r.perm as PermissionKey;
    const current = grants.get(key);
    if (current === "ALL") continue;
    if (!r.facilityId) grants.set(key, "ALL");
    else {
      const set = current instanceof Set ? current : new Set<string>();
      set.add(r.facilityId);
      grants.set(key, set);
    }
  }
  return { membershipId: m.id, roles: [...roleMap.values()], grants };
}

export function can(access: Access | null, perm: PermissionKey, facilityId?: string | null): boolean {
  if (!access) return false;
  const scope = access.grants.get(perm);
  if (!scope) return false;
  if (scope === "ALL") return true;
  if (facilityId === undefined) return scope.size > 0; // held for at least one facility
  return facilityId !== null && scope.has(facilityId);
}

/** Facility IDs the user may act on for `perm`; null means every facility. */
export function facilityScope(access: Access | null, perm: PermissionKey): string[] | null {
  const scope = access?.grants.get(perm);
  if (!scope) return [];
  return scope === "ALL" ? null : [...scope];
}

export class ForbiddenError extends Error {
  constructor(public permission: string) {
    super(`Forbidden: missing permission ${permission}`);
  }
}
