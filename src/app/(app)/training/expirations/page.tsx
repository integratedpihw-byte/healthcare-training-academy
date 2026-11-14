import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth/context";
import { expirationsReport } from "@/lib/workforce/compliance";
import { Badge, Card, EmptyState, PageHeader, Select, Button, Table, Td } from "@/components/ui";
import { DueDate, SubNav, TRAINING_TABS } from "@/components/workforce/common";

export const metadata = { title: "Expirations" };

export default async function ExpirationsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const ctx = await requireAnyPermission(["training.view_all", "training.assign", "team.view"]);
  const sp = await searchParams;
  const days = [30, 60, 90, 180].includes(Number(sp.days)) ? Number(sp.days) : 90;
  const r = await ctx.tx((tx) => expirationsReport(tx, days));
  const past = (d: string) => d < r.today;
  return (
    <>
      <PageHeader title="Expirations" description="Certificates, professional licenses and skills reassessments that are expired or expire soon, for employees in your scope. Reminders go out automatically on your organization's schedule; expiration dates are never extended without a new completion or an audited correction." />
      <SubNav items={TRAINING_TABS((x) => ctx.can(x as never))} active="/training/expirations" />
      <form className="mb-4 flex items-end gap-3">
        <div><label htmlFor="days" className="text-xs font-medium text-slate-600">Look ahead</label>
          <Select id="days" name="days" defaultValue={String(days)}>{[30, 60, 90, 180].map((n) => <option key={n} value={n}>{n} days</option>)}</Select>
        </div>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>
      <div className="space-y-6">
        <Card title={`Course certificates (${r.certificates.length})`}>
          <Table head={["Employee", "Course", "Expires", "Status"]} empty={r.certificates.length === 0 ? <EmptyState>Nothing expiring in this window.</EmptyState> : undefined}>
            {r.certificates.map((c) => (
              <tr key={c.id}>
                <Td>{c.employee_id ? <Link className="font-medium text-navy-900 hover:underline" href={`/employees/${c.employee_id}`}>{c.recipient_name}</Link> : c.recipient_name}</Td>
                <Td><Link className="text-teal-700 hover:underline" href={`/certificates/${c.id}`}>{c.course_title}</Link></Td>
                <Td className="whitespace-nowrap"><DueDate date={c.expires_on} open /></Td>
                <Td>{past(c.expires_on) ? <Badge tone="red">Expired</Badge> : <Badge tone="amber">Expiring</Badge>}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title={`Professional licenses & certifications (${r.licenses.length})`}>
          <Table head={["Employee", "License", "Expires", "Verification"]} empty={r.licenses.length === 0 ? <EmptyState>Nothing expiring in this window.</EmptyState> : undefined}>
            {r.licenses.map((l) => (
              <tr key={l.id}>
                <Td><Link className="font-medium text-navy-900 hover:underline" href={`/employees/${l.employee_id}#licenses`}>{l.employee_name}</Link></Td>
                <Td>{l.name}<div className="font-mono text-xs text-slate-500">{l.license_number}</div></Td>
                <Td className="whitespace-nowrap"><DueDate date={l.expires_on} open /></Td>
                <Td>{past(l.expires_on) || l.verification_status === "EXPIRED" ? <Badge tone="red">Expired</Badge> : l.verification_status === "VERIFIED" ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title={`Skills reassessments (${r.competencies.length})`}>
          <Table head={["Employee", "Skill", "Reassessment due", ""]} empty={r.competencies.length === 0 ? <EmptyState>Nothing due in this window.</EmptyState> : undefined}>
            {r.competencies.map((c) => (
              <tr key={c.id}>
                <Td><Link className="font-medium text-navy-900 hover:underline" href={`/employees/${c.employee_id}`}>{c.employee_name}</Link></Td>
                <Td><Link className="text-teal-700 hover:underline" href={`/competency/${c.id}`}>{c.competency}</Link></Td>
                <Td className="whitespace-nowrap"><DueDate date={c.next_due} open /></Td>
                <Td>{past(c.next_due) ? <Badge tone="red">Overdue</Badge> : <Badge tone="amber">Due soon</Badge>}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
