import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, ne, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { employees, facilities } from "@/db/schema";
import { getReport, paramsSchema, reportAllowed } from "@/lib/reports/definitions";
import { Alert, Button, ButtonLink, Card, EmptyState, Input, PageHeader, Select, Table, Td } from "@/components/ui";

export const metadata = { title: "Report" };
const MAX_ROWS = 500;

export default async function ReportPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { key } = await params;
  const def = getReport(key);
  if (!def) notFound();
  const ctx = await requirePermission("reports.view");
  if (!reportAllowed(def, ctx.access)) notFound();
  const raw = await searchParams;
  const p = paramsSchema.parse(raw);
  const missing = (def.required ?? []).filter((k) => !p[k]);
  const d = await ctx.tx(async (tx) => ({
    facilities: def.params.includes("facilityId") ? await tx.select({ id: facilities.id, name: facilities.name }).from(facilities).orderBy(asc(facilities.name)) : [],
    employees: def.params.includes("employeeId") ? await tx.select({ id: employees.id, name: sql<string>`${employees.lastName} || ', ' || ${employees.firstName}` }).from(employees).where(ne(employees.employmentStatus, "TERMINATED")).orderBy(asc(employees.lastName)) : [],
    result: missing.length ? null : await def.run(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, p),
  }));
  const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
  return (
    <>
      <PageHeader
        title={`${def.number}. ${def.title}`}
        description={def.description}
        actions={
          <>
            <Link href="/reports" className="self-center text-sm text-slate-600 hover:underline">← Reports</Link>
            {ctx.can("reports.export") && d.result && (["pdf", "xlsx", "csv"] as const).map((f) => (
              <ButtonLink key={f} href={`/api/reports/${key}?format=${f}${qs ? `&${qs}` : ""}`} variant="secondary">{f === "xlsx" ? "Excel" : f.toUpperCase()}</ButtonLink>
            ))}
          </>
        }
      />
      {def.params.length > 0 && (
        <Card className="mb-6">
          <form className="flex flex-wrap items-end gap-3">
            {def.params.includes("facilityId") && (
              <div><label htmlFor="facilityId" className="text-xs font-medium text-slate-600">Facility</label><Select id="facilityId" name="facilityId" defaultValue={p.facilityId ?? ""}><option value="">All in scope</option>{d.facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select></div>
            )}
            {def.params.includes("employeeId") && (
              <div><label htmlFor="employeeId" className="text-xs font-medium text-slate-600">Employee</label><Select id="employeeId" name="employeeId" defaultValue={p.employeeId ?? ""}><option value="">Choose…</option>{d.employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></div>
            )}
            {def.params.includes("from") && <div><label htmlFor="from" className="text-xs font-medium text-slate-600">From</label><Input id="from" name="from" type="date" defaultValue={p.from} /></div>}
            {def.params.includes("to") && <div><label htmlFor="to" className="text-xs font-medium text-slate-600">To</label><Input id="to" name="to" type="date" defaultValue={p.to} /></div>}
            {def.params.includes("days") && <div><label htmlFor="days" className="text-xs font-medium text-slate-600">Days</label><Input id="days" name="days" type="number" min={1} max={730} defaultValue={p.days ?? 90} className="w-28" /></div>}
            {def.params.includes("year") && <div><label htmlFor="year" className="text-xs font-medium text-slate-600">Year</label><Input id="year" name="year" type="number" min={2000} max={2100} defaultValue={p.year ?? new Date().getFullYear()} className="w-28" /></div>}
            <Button type="submit" variant="secondary">Run report</Button>
          </form>
        </Card>
      )}
      {missing.length > 0 ? <Alert tone="blue">Choose {missing.map((m) => (m === "employeeId" ? "an employee" : m)).join(", ")} to run this report.</Alert> : d.result && (
        <Card title={d.result.subtitle ?? `${d.result.rows.length} rows`}>
          <Table head={d.result.columns.map((c) => c.label)} empty={d.result.rows.length === 0 ? <EmptyState>No records match.</EmptyState> : undefined}>
            {d.result.rows.slice(0, MAX_ROWS).map((r, i) => (
              <tr key={i}>{d.result!.columns.map((c) => <Td key={c.key} className="text-sm">{r[c.key] ?? "—"}</Td>)}</tr>
            ))}
          </Table>
          {d.result.rows.length > MAX_ROWS && <p className="mt-2 text-xs text-slate-500">Showing {MAX_ROWS} of {d.result.rows.length} rows — export for the full report.</p>}
          {d.result.notes?.map((n) => <p key={n} className="mt-2 text-xs text-slate-500">{n}</p>)}
        </Card>
      )}
    </>
  );
}
