import Link from "next/link";
import { requirePermission } from "@/lib/auth/context";
import { REPORTS } from "@/lib/reports/definitions";
import { ButtonLink, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const ctx = await requirePermission("reports.view");
  const groups = ["Compliance", "Training", "Workforce"] as const;
  return (
    <>
      <PageHeader title="Reports" description={`Audit-ready reports limited to the facilities and staff you may see.${ctx.can("reports.export") ? " Export to PDF, Excel or CSV." : ""}`} actions={ctx.has("analytics") ? <ButtonLink href="/reports/analytics" variant="teal">Analytics dashboard</ButtonLink> : <ButtonLink href="/billing?upgrade=analytics" variant="secondary">Analytics dashboard (Enterprise)</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g} title={g}>
            <ul className="space-y-4">
              {REPORTS.filter((r) => r.group === g).sort((a, b) => a.number - b.number).map((r) => (
                <li key={r.key}>
                  <Link href={`/reports/${r.key}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">{r.title}</Link>
                  <p className="text-sm text-slate-600">{r.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Course attendance for instructor-led classes is added with live sessions. Every export is recorded in the audit log.</p>
    </>
  );
}
