import Link from "next/link";
import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { listTenants, platformOverview } from "@/lib/platform/queries";
import { platformStats } from "@/lib/analytics/service";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, fmtDate } from "@/components/ui";

export const metadata = { title: "Platform Console" };

import { STATUS_TONE } from "@/lib/platform/status";
const FILTERS = ["ALL", "PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "REJECTED"];

export default async function PlatformPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePlatformAdmin();
  const { status } = await searchParams;
  const filter = status && FILTERS.includes(status) && status !== "ALL" ? status : undefined;
  const db = systemDb();
  const [o, list, ps] = await Promise.all([platformOverview(db), listTenants(db, filter), platformStats(db)]);
  return (
    <>
      <PageHeader title="Platform Console" description="Super Administrator view across all tenants. Every action here is audited." />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Organizations" value={o.organizations} />
          <StatCard label="Pending approval" value={o.byStatus.PENDING_APPROVAL ?? 0} tone="amber" />
          <StatCard label="Facilities" value={o.facilities} tone="teal" />
          <StatCard label="Employees" value={o.employees} />
          <StatCard label="Active users" value={o.users} />
        </div>
        <Card title="Platform-wide learning">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 lg:grid-cols-7">
            {([["Active organizations", ps.active_orgs], ["Active students (90 days)", ps.learners], ["Published courses", ps.courses], ["Enrollments", ps.enrollments], ["Completions (30 days)", ps.completions_30], ["Active certificates", ps.certificates], ["Employees", ps.employees]] as const).map(([l, v]) => (
              <div key={l}><div className="text-xs text-slate-500">{l}</div><div className="text-lg font-semibold text-navy-900">{v}</div></div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">{ps.plans.map((p) => <Badge key={p.plan + p.status} tone="gray">{p.plan.toLowerCase()} · {p.status.toLowerCase()}: {p.n}</Badge>)}</div>
        </Card>
        <Card title="Tenants" actions={
          <nav className="flex gap-1" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <Link key={f} href={f === "ALL" ? "/platform" : `/platform?status=${f}`} className={`rounded px-2 py-1 text-xs font-medium ${(filter ?? "ALL") === f ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"}`}>
                {f === "ALL" ? "All" : f.replace("_", " ").toLowerCase()}
              </Link>
            ))}
          </nav>
        }>
          <Table head={["Tenant", "Type", "Plan", "Facilities", "Employees", "Users", "Registered", "Status"]} empty={list.length === 0 ? <EmptyState>No tenants match.</EmptyState> : undefined}>
            {list.map((t) => (
              <tr key={t.id}>
                <Td><Link href={`/platform/tenants/${t.id}`} className="font-medium text-teal-700 hover:underline">{t.name}</Link><div className="text-xs text-slate-500">{t.state}</div></Td>
                <Td>{t.type === "INDIVIDUAL" ? "Individual" : "Organization"}</Td>
                <Td>{t.plan?.replace("_", " ").toLowerCase() ?? "—"}</Td>
                <Td>{t.facilities}</Td>
                <Td>{t.employees}</Td>
                <Td>{t.members}</Td>
                <Td>{fmtDate(t.createdAt)}</Td>
                <Td><Badge tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
