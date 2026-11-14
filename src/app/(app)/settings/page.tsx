import Link from "next/link";
import { requireUser } from "@/lib/auth/context";
import { systemDb } from "@/db/server";
import { userTenants } from "@/lib/auth/service";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { switchTenantAction } from "./actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireUser();
  const tenantsList = await userTenants(systemDb(), ctx.user.id);
  return (
    <>
      <PageHeader title="Settings" description="Your profile, security and organization memberships." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs text-slate-500">Name</dt><dd className="font-medium text-navy-900">{ctx.user.firstName} {ctx.user.lastName}</dd></div>
            <div><dt className="text-xs text-slate-500">Email</dt><dd>{ctx.user.email}</dd></div>
            {ctx.user.isPlatformAdmin && <div><Badge tone="blue">Platform Super Administrator</Badge></div>}
          </dl>
          <Link href="/settings/security" className="mt-4 block text-sm font-semibold text-teal-700 hover:underline">Password, two-step verification & sessions →</Link>
          {ctx.tenant && <Link href="/settings/notifications" className="mt-2 block text-sm font-semibold text-teal-700 hover:underline">Email notification preferences →</Link>}
        </Card>
        <Card title="Organizations">
          {tenantsList.length === 0 ? <p className="text-sm text-slate-600">You are not a member of any organization.</p> : (
            <ul className="divide-y divide-slate-100">
              {tenantsList.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <div className="font-medium text-navy-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.type === "INDIVIDUAL" ? "Personal account" : "Organization"} · {t.status.replace("_", " ").toLowerCase()}</div>
                  </div>
                  {ctx.tenant?.id === t.id ? <Badge tone="teal">Current</Badge> : t.status === "ACTIVE" ? (
                    <form action={switchTenantAction}><input type="hidden" name="tenantId" value={t.id} /><Button type="submit" variant="secondary" className="px-3 py-1 text-xs">Switch</Button></form>
                  ) : <Badge>{t.status.replace("_", " ")}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
