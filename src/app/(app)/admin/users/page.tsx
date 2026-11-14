import { seq } from "@/db/seq";
import { asc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { facilities, membershipRoles, memberships, roles, users } from "@/db/schema";
import { Badge, Card, Field, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { inviteMemberAction, revokeRoleAction } from "../actions";

export const metadata = { title: "Users & roles" };

export default async function UsersPage() {
  const ctx = await requirePermission("org.users.manage");
  const [rows, roleList, facs] = await ctx.tx(async (tx) =>
    seq([
      tx
        .select({
          membershipId: memberships.id,
          status: memberships.status,
          userId: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          mrId: membershipRoles.id,
          roleName: roles.name,
          facilityName: facilities.name,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .leftJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
        .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
        .leftJoin(facilities, eq(facilities.id, membershipRoles.facilityId))
        .orderBy(asc(users.lastName), asc(users.firstName)),
      tx.select({ id: roles.id, name: roles.name, key: roles.key, isSystem: roles.isSystem }).from(roles).orderBy(asc(roles.isSystem), asc(roles.name)),
      tx.select({ id: facilities.id, name: facilities.name }).from(facilities).where(eq(facilities.isActive, true)).orderBy(asc(facilities.name)),
    ]),
  );
  const people = new Map<string, { email: string; name: string; status: string; you: boolean; roles: { id: string; name: string; facility: string | null }[] }>();
  for (const r of rows) {
    const p = people.get(r.membershipId) ?? { email: r.email, name: `${r.firstName} ${r.lastName}`, status: r.status, you: r.userId === ctx.user.id, roles: [] };
    if (r.mrId && r.roleName) p.roles.push({ id: r.mrId, name: r.roleName, facility: r.facilityName });
    people.set(r.membershipId, p);
  }
  return (
    <>
      <PageHeader title="Users & role assignments" description="Portal accounts for your organization. Employees without portal access are managed in Employee Management." />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title={`Users (${people.size})`}>
          <Table head={["User", "Roles", "Status"]}>
            {[...people.entries()].map(([id, p]) => (
              <tr key={id}>
                <Td className="font-medium text-navy-900">{p.name}{p.you && <span className="ml-2"><Badge tone="blue">You</Badge></span>}<div className="text-xs font-normal text-slate-500">{p.email}</div></Td>
                <Td>
                  <ul className="space-y-1.5">
                    {p.roles.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-2">
                        <Badge tone="teal">{r.name}{r.facility ? ` · ${r.facility}` : ""}</Badge>
                        <ActionForm action={revokeRoleAction} submitLabel="Remove" variant="ghost" className="inline-flex items-center gap-2" confirm={`Remove the ${r.name} role from ${p.name}?`}>
                          <input type="hidden" name="membershipRoleId" value={r.id} />
                        </ActionForm>
                      </li>
                    ))}
                    {p.roles.length === 0 && <li className="text-xs text-slate-500">No roles</li>}
                  </ul>
                </Td>
                <Td><Badge tone={p.status === "ACTIVE" ? "green" : "gray"}>{p.status}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Add user or grant role">
          <ActionForm action={inviteMemberAction} submitLabel="Add user" pendingText="Adding…" resetOnSuccess>
            <Field label="Email" name="email"><Input id="email" name="email" type="email" required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" name="firstName"><Input id="firstName" name="firstName" required /></Field>
              <Field label="Last name" name="lastName"><Input id="lastName" name="lastName" required /></Field>
            </div>
            <Field label="Role" name="roleId">
              <Select id="roleId" name="roleId" required defaultValue="">
                <option value="" disabled>Select a role…</option>
                {roleList.map((r) => <option key={r.id} value={r.id}>{r.name}{r.isSystem ? "" : " (custom)"}</option>)}
              </Select>
            </Field>
            <Field label="Facility scope" name="facilityId" hint="Required for Facility Administrator; leave blank for organization-wide roles">
              <Select id="facilityId" name="facilityId" defaultValue="">
                <option value="">Organization-wide</option>
                {facs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </Field>
            <p className="text-xs text-slate-500">New users receive an email link to set their own password. Existing users are granted the role immediately.</p>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
