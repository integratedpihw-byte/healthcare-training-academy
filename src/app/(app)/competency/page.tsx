import Link from "next/link";
import { requireAnyPermission, requireFeature } from "@/lib/auth/context";
import { competencyMatrix, evaluableEmployees, listAssessments, listCompetencies } from "@/lib/competency/service";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Table, Td, fmtDate, type Tone } from "@/components/ui";

export const metadata = { title: "Competency Management" };

const RESULT: Record<string, { label: string; tone: Tone }> = { PASS: { label: "Pass", tone: "green" }, FAIL: { label: "Fail", tone: "red" }, NEEDS_REMEDIATION: { label: "Remediation", tone: "amber" } };

export default async function CompetencyPage() {
  const ctx = await requireAnyPermission(["competency.view", "competency.evaluate"]);
  requireFeature(ctx, "competency");
  const today = new Date().toISOString().slice(0, 10);
  const d = await ctx.tx(async (tx) => {
    const comps = await listCompetencies(tx);
    const emps = await evaluableEmployees(tx, ctx.access);
    const matrix = await competencyMatrix(tx, emps.map((e) => e.id));
    const recent = await listAssessments(tx, { limit: 15 });
    return { comps, emps, matrix, recent };
  });
  const cell = new Map(d.matrix.map((m) => [`${m.employee_id}:${m.competency_id}`, m]));
  const overdue = d.matrix.filter((m) => m.next_due && m.next_due < today).length;
  return (
    <>
      <PageHeader title="Competency Management" description="Observed, signed practical skills evaluations. Course completion never implies clinical competency or authorization to perform procedures." actions={ctx.can("competency.evaluate") ? <ButtonLink href="/competency/new" variant="teal">New evaluation</ButtonLink> : undefined} />
      <div className="space-y-6">
        <Card title={`Competency matrix${overdue ? ` · ${overdue} overdue` : ""}`}>
          {d.emps.length === 0 ? <EmptyState>No employees in your scope.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-navy-50">
                    <th className="sticky left-0 bg-navy-50 px-3 py-2 text-left font-semibold text-navy-800">Employee</th>
                    {d.comps.map((c) => <th key={c.id} className="px-2 py-2 text-left font-semibold text-navy-800" title={c.name}><span className="block max-w-24 truncate">{c.name}</span></th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.emps.map((e) => (
                    <tr key={e.id}>
                      <td className="sticky left-0 bg-white px-3 py-2"><div className="font-medium text-navy-900">{e.name}</div><div className="text-slate-500">{e.jobTitle}</div></td>
                      {d.comps.map((c) => {
                        const m = cell.get(`${e.id}:${c.id}`);
                        if (!m) return <td key={c.id} className="px-2 py-2 text-slate-300">—</td>;
                        const late = m.next_due && m.next_due < today;
                        return (
                          <td key={c.id} className="px-2 py-2">
                            <Link href={`/competency/${m.id}`} className="inline-flex flex-col">
                              <Badge tone={late ? "red" : RESULT[m.result].tone}>{late ? "Overdue" : RESULT[m.result].label}</Badge>
                              <span className="mt-0.5 text-[10px] text-slate-500">{fmtDate(m.assessed_on)}</span>
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Recent evaluations">
          <Table head={["Date", "Employee", "Skill", "Facility", "Result", "Status"]} empty={d.recent.length === 0 ? <EmptyState>No evaluations recorded yet.</EmptyState> : undefined}>
            {d.recent.map((r) => (
              <tr key={r.id}>
                <Td>{fmtDate(r.assessedOn)}</Td>
                <Td><Link href={`/competency/${r.id}`} className="font-medium text-teal-700 hover:underline">{r.employeeName}</Link></Td>
                <Td>{r.competency}</Td>
                <Td>{r.facilityName}</Td>
                <Td><Badge tone={RESULT[r.result].tone}>{RESULT[r.result].label}</Badge></Td>
                <Td><Badge tone={r.status === "SIGNED" ? "green" : r.status === "VOIDED" ? "gray" : "amber"}>{r.status === "DRAFT" ? "Draft — unsigned" : r.status}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
