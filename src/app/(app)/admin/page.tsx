import Link from "next/link";
import { requireTenant } from "@/lib/auth/context";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import type { PermissionKey } from "@/lib/rbac/catalog";

export const metadata = { title: "Administration" };

const SECTIONS: { href: string; title: string; text: string; perm: PermissionKey }[] = [
  { href: "/admin/organization", title: "Organization profile", text: "Legal name, contact details and primary state.", perm: "org.settings.manage" },
  { href: "/admin/facilities", title: "Facilities & departments", text: "Facility types, license numbers and departments that drive training applicability.", perm: "org.facilities.manage" },
  { href: "/admin/users", title: "Users & role assignments", text: "Invite staff to the portal and assign roles, including facility-scoped roles.", perm: "org.users.manage" },
  { href: "/admin/roles", title: "Roles & permissions", text: "Review system roles and create custom roles from the permission catalog.", perm: "org.roles.manage" },
  { href: "/admin/notifications", title: "Notifications & renewals", text: "Reminder schedule (90/60/30/15/7 days), escalation, renewal window and email delivery.", perm: "org.settings.manage" },
  { href: "/admin/integrations", title: "Integrations & API keys", text: "Read-only API keys for HR, scheduling and credentialing systems (Enterprise).", perm: "integrations.manage" },
  { href: "/admin/audit", title: "Audit trail", text: "Immutable, hash-chained record of administrative and training events.", perm: "audit.view" },
];

export default async function AdminPage() {
  const ctx = await requireTenant();
  const visible = SECTIONS.filter((s) => ctx.can(s.perm));
  if (visible.length === 0) redirect("/forbidden?p=admin");
  return (
    <>
      <PageHeader title="Administration" description={`Manage ${ctx.tenant.name}.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow">
            <h2 className="font-semibold text-navy-900">{s.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{s.text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
