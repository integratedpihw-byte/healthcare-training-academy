import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth/context";
import { complianceFor } from "@/lib/workforce/compliance";
import { EMPLOYMENT_LABELS, EMPLOYMENT_STATUSES, employeeFilterSchema, employeeFormOptions, listEmployees } from "@/lib/workforce/employees";
import { COMPLIANCE_LABEL, type ComplianceStatus } from "@/lib/workforce/rules";
import { Badge, Button, ButtonLink, Card, EmptyState, Input, PageHeader, Select, StatCard, Table, Td, fmtDate } from "@/components/ui";
import { ComplianceBadge } from "@/components/workforce/common";

export const metadata = { title: "Employee Management" };

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireAnyPermission(["employees.view", "employees.manage", "team.view"]);
  const sp = await searchParams;
  const f = employeeFilterSchema.safeParse({ q: sp.q || undefined, facilityId: sp.facilityId || undefined, status: sp.status || undefined, position: sp.position || undefined });
  const filter = f.success ? f.data : {};
  const compliance = Object.keys(COMPLIANCE_LABEL).includes(sp.compliance ?? "") ? (sp.compliance as ComplianceStatus) : undefined;
  const teamOnly = !ctx.can("employees.view") && !ctx.can("employees.manage");

  const d = await ctx.tx(async (tx) => {
    const rows = await listEmployees(tx, filter);
    const comp = await complianceFor(tx, rows.map((r) => r.id));
    const opts = await employeeFormOptions(tx, ctx.access);
    return { rows, comp, facilities: opts.allFacilities };
  });
  const all = (teamOnly ? d.rows.filter((r) => r.userId !== ctx.user.id) : d.rows).filter((r) => !compliance || d.comp.get(r.id)?.status === compliance);
  const PAGE = 100;
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const rows = all.slice((page - 1) * PAGE, page * PAGE);
  const pageHref = (n: number) => `/employees?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([k, v]) => v && k !== "page")), page: String(n) } as Record<string, string>)}`;
  const tally = { NON_COMPLIANT: 0, AT_RISK: 0, COMPLIANT: 0, NO_REQUIREMENTS: 0 } as Record<ComplianceStatus, number>;
  for (const r of d.rows) if (!teamOnly || r.userId !== ctx.user.id) tally[d.comp.get(r.id)!.status]++;

  return (
    <>
      <PageHeader
        title={teamOnly ? "My team" : "Employee Management"}
        description={teamOnly ? "Your direct reports, their training status and upcoming deadlines." : "Employee profiles, facility assignments, licenses and training compliance. You see employees within your facilities and permissions."}
        actions={ctx.can("employees.manage") ? <ButtonLink href="/employees/new" variant="teal">Add employee</ButtonLink> : teamOnly ? <ButtonLink href="/training/expirations" variant="secondary">Team expirations</ButtonLink> : undefined}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Non-compliant" value={tally.NON_COMPLIANT} tone="red" hint="Overdue training, expired license or overdue skills check" />
        <StatCard label="Due soon" value={tally.AT_RISK} tone="amber" hint="Something due or expiring within 30 days" />
        <StatCard label="Compliant" value={tally.COMPLIANT} tone="teal" />
        <StatCard label="No training assigned" value={tally.NO_REQUIREMENTS} hint="Run onboarding to assign required training" />
      </div>
      <Card>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1"><label htmlFor="q" className="text-xs font-medium text-slate-600">Search</label><Input id="q" name="q" defaultValue={sp.q} placeholder="Name, employee ID or job title" /></div>
          {!teamOnly && (
            <div><label htmlFor="facilityId" className="text-xs font-medium text-slate-600">Facility</label>
              <Select id="facilityId" name="facilityId" defaultValue={sp.facilityId ?? ""}><option value="">All in scope</option>{d.facilities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
            </div>
          )}
          <div><label htmlFor="status" className="text-xs font-medium text-slate-600">Employment</label>
            <Select id="status" name="status" defaultValue={sp.status ?? "CURRENT"}>
              <option value="CURRENT">Current staff</option>
              {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{EMPLOYMENT_LABELS[s]}</option>)}
              <option value="ALL">All</option>
            </Select>
          </div>
          <div><label htmlFor="compliance" className="text-xs font-medium text-slate-600">Compliance</label>
            <Select id="compliance" name="compliance" defaultValue={sp.compliance ?? ""}><option value="">Any</option>{Object.entries(COMPLIANCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
          </div>
          <div><label htmlFor="position" className="text-xs font-medium text-slate-600">Position code</label><Input id="position" name="position" defaultValue={sp.position} className="w-40" /></div>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
        <Table head={["Employee", "Position", "Facility", "Supervisor", "Hired", "Account", "Training status"]} empty={rows.length === 0 ? <EmptyState>{teamOnly ? "No direct reports are assigned to you." : "No employees match."}</EmptyState> : undefined}>
          {rows.map((r) => {
            const c = d.comp.get(r.id)!;
            return (
              <tr key={r.id}>
                <Td>
                  <Link href={`/employees/${r.id}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">{r.lastName}, {r.firstName}</Link>
                  <div className="text-xs text-slate-500">{r.employeeNumber}{r.employmentStatus !== "ACTIVE" && <> · {EMPLOYMENT_LABELS[r.employmentStatus]}</>}</div>
                </Td>
                <Td>{r.jobTitle}<div className="text-xs text-slate-500">{r.positionCode}</div></Td>
                <Td>{r.facilityName ?? "—"}<div className="text-xs text-slate-500">{r.departmentName}</div></Td>
                <Td>{r.supervisorName ?? "—"}</Td>
                <Td className="whitespace-nowrap">{fmtDate(r.hireDate)}</Td>
                <Td>{r.userId ? <Badge tone="green">Active</Badge> : <Badge>None</Badge>}</Td>
                <Td>
                  <ComplianceBadge status={c.status} />
                  {(c.counts.overdueAssignments > 0 || c.counts.dueSoonAssignments > 0) && (
                    <div className="mt-1 text-xs text-slate-500">{c.counts.overdueAssignments} overdue · {c.counts.dueSoonAssignments} due soon</div>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
        {pages > 1 && (
          <nav aria-label="Employee list pages" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-600">Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, all.length)} of {all.length}{d.rows.length >= 1000 ? " (refine filters to see beyond the first 1,000)" : ""}</span>
            {page > 1 && <Link href={pageHref(page - 1)} className="font-semibold text-teal-700 underline">Previous</Link>}
            {page < pages && <Link href={pageHref(page + 1)} className="font-semibold text-teal-700 underline">Next</Link>}
          </nav>
        )}
      </Card>
    </>
  );
}
