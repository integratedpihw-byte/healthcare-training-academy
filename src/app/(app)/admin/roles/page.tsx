import { seq } from "@/db/seq";
import { asc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { deleteRoleAction, saveRoleAction } from "../actions";

export const metadata = { title: "Roles & permissions" };

export default async function RolesPage() {
  const ctx = await requirePermission("org.roles.manage");
  const [roleRows, perms] = await ctx.tx(async (tx) =>
    seq([
      tx
        .select({ id: roles.id, name: roles.name, description: roles.description, isSystem: roles.isSystem, tenantId: roles.tenantId, perm: permissions.key })
        .from(roles)
        .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .orderBy(asc(roles.isSystem), asc(roles.name)),
      tx.select().from(permissions).orderBy(asc(permissions.category), asc(permissions.key)),
    ]),
  );
  const byRole = new Map<string, { name: string; description: string | null; custom: boolean; perms: Set<string> }>();
  for (const r of roleRows) {
    const e = byRole.get(r.id) ?? { name: r.name, description: r.description, custom: r.tenantId !== null, perms: new Set<string>() };
    if (r.perm) e.perms.add(r.perm);
    byRole.set(r.id, e);
  }
  const categories = [...new Set(perms.map((p) => p.category))];
  const grantable = (key: string) => ctx.access.grants.get(key as never) === "ALL";
  return (
    <>
      <PageHeader title="Roles & permissions" description="System roles follow the platform's role model. Custom roles let you tailor access; you can only grant permissions you hold yourself." />
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          {[...byRole.entries()].map(([id, r]) => (
            <Card key={id} title={<span className="flex items-center gap-2">{r.name}{r.custom ? <Badge tone="teal">Custom</Badge> : <Badge>System</Badge>}</span>}
              actions={r.custom ? (
                <ActionForm action={deleteRoleAction} submitLabel="Delete" variant="ghost" className="flex items-center" confirm={`Delete role "${r.name}"?`}>
                  <input type="hidden" name="roleId" value={id} />
                </ActionForm>
              ) : undefined}>
              {r.description && <p className="mb-3 text-sm text-slate-600">{r.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {[...r.perms].sort().map((p) => <code key={p} className="rounded bg-navy-50 px-1.5 py-0.5 text-[11px] text-navy-800">{p}</code>)}
              </div>
            </Card>
          ))}
        </div>
        <Card title="Create a custom role">
          <ActionForm action={saveRoleAction} submitLabel="Create role" pendingText="Saving…" resetOnSuccess>
            <Field label="Role name" name="name"><Input id="name" name="name" required placeholder="e.g. Staffing Coordinator" /></Field>
            <Field label="Description" name="description"><Input id="description" name="description" /></Field>
            <div className="space-y-4">
              {categories.map((c) => (
                <fieldset key={c}>
                  <legend className="text-xs font-semibold uppercase tracking-wide text-teal-700">{c}</legend>
                  <div className="mt-1 space-y-1">
                    {perms.filter((p) => p.category === c).map((p) => (
                      <label key={p.key} className={`flex items-start gap-2 text-sm ${grantable(p.key) ? "" : "opacity-50"}`}>
                        <input type="checkbox" name="permissions" value={p.key} disabled={!grantable(p.key)} className="mt-1" />
                        <span><span className="text-slate-800">{p.description}</span> <code className="text-[11px] text-slate-500">{p.key}</code></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
