import Link from "next/link";
import { requireTenant } from "@/lib/auth/context";
import { systemDb } from "@/db/server";
import { effectiveStatus, ensureCertificates, listCertificates } from "@/lib/certificates/service";
import { CERT_STATUS } from "@/lib/certificates/labels";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Table, Td, fmtDate } from "@/components/ui";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ view?: string; status?: string; q?: string }> }) {
  const ctx = await requireTenant();
  const sp = await searchParams;
  const canAll = ctx.can("certificates.view_all") || ctx.can("team.view");
  const view = canAll && sp.view === "org" ? "org" : "mine";
  await ensureCertificates(systemDb(), ctx.tenant.id, ctx.user.id); // self-healing: issue any missing certificate
  const status = ["ACTIVE", "EXPIRED", "REVOKED", "SUPERSEDED"].includes(sp.status ?? "") ? sp.status : undefined;
  const rows = await ctx.tx((tx) => listCertificates(tx, { userId: view === "mine" ? ctx.user.id : undefined, status, q: sp.q?.slice(0, 80) }));
  return (
    <>
      <PageHeader title="Certificates" description="Course-completion certificates issued by the academy. These are internal training records — not state licenses, professional certifications or accredited CE unless stated. Anyone can confirm a certificate at /verify." />
      {canAll && (
        <nav className="mb-4 flex gap-2" aria-label="Certificate view">
          <Link href="/certificates" className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "mine" ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"}`}>My certificates</Link>
          <Link href="/certificates?view=org" className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "org" ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"}`}>Organization</Link>
        </nav>
      )}
      <Card>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          {view === "org" && <input type="hidden" name="view" value="org" />}
          <div className="min-w-56 flex-1"><label htmlFor="q" className="text-xs font-medium text-slate-600">Search</label><Input id="q" name="q" defaultValue={sp.q} placeholder="Name, course or certificate number" /></div>
          <div><label htmlFor="status" className="text-xs font-medium text-slate-600">Status</label>
            <Select id="status" name="status" defaultValue={status ?? ""}><option value="">All</option>{Object.entries(CERT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
          </div>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
        <Table head={[...(view === "org" ? ["Recipient"] : []), "Course", "Certificate #", "Completed", "Valid through", "Status", ""]} empty={rows.length === 0 ? <EmptyState>{view === "mine" ? "Complete a course to earn your first certificate." : "No certificates match."}</EmptyState> : undefined}>
          {rows.map((c) => {
            const st = CERT_STATUS[effectiveStatus(c)];
            return (
              <tr key={c.id}>
                {view === "org" && <Td className="font-medium text-navy-900">{c.recipientName}</Td>}
                <Td>{c.courseTitle}<div className="text-xs text-slate-500">{c.courseCode} · {Number(c.trainingHours).toFixed(2)} h</div></Td>
                <Td className="font-mono text-xs">{c.number}</Td>
                <Td>{fmtDate(c.completedOn)}</Td>
                <Td>{c.expiresOn ? fmtDate(c.expiresOn) : "—"}</Td>
                <Td><Badge tone={st.tone}>{st.label}</Badge></Td>
                <Td className="whitespace-nowrap text-right">
                  <Link href={`/certificates/${c.id}`} className="mr-3 text-sm font-semibold text-teal-700 hover:underline">Details</Link>
                  <a href={`/api/certificates/${c.id}/pdf`} className="text-sm text-slate-600 hover:underline">PDF</a>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
