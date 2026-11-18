import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { requireTenant } from "@/lib/auth/context";
import { certificates, certificateVerifications } from "@/db/schema";
import { disclaimerFor, effectiveStatus, getCertificate, verificationUrl } from "@/lib/certificates/service";
import { CERT_KIND, CERT_STATUS, CERT_TITLE, PROGRAM_LABEL } from "@/lib/certificates/labels";
import { Alert, Badge, ButtonLink, Card, Field, Input, PageHeader, Textarea, fmtDate, fmtDateTime } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { correctAction, revokeAction } from "../actions";

export const metadata = { title: "Certificate" };

export default async function CertificatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ revoked?: string; corrected?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireTenant();
  const data = await ctx.tx(async (tx) => {
    const c = await getCertificate(tx, id);
    if (!c) return null;
    const history = c.courseId
      ? await tx.select().from(certificates).where(and(eq(certificates.userId, c.userId), eq(certificates.courseId, c.courseId), eq(certificates.kind, c.kind))).orderBy(desc(certificates.issuedAt))
      : [];
    const verifications = (ctx.can("certificates.view_all") || ctx.can("team.view")) ? await tx.select().from(certificateVerifications).where(eq(certificateVerifications.certificateId, id)).orderBy(desc(certificateVerifications.verifiedAt)).limit(10) : [];
    return { c, history, verifications };
  });
  if (!data) notFound();
  const { c, history, verifications } = data;
  if (c.userId !== ctx.user.id && !ctx.can("certificates.view_all") && !ctx.can("team.view")) notFound();
  const st = CERT_STATUS[effectiveStatus(c)];
  const url = verificationUrl(c.verificationCode);
  return (
    <>
      <PageHeader title={c.courseTitle} description={`${CERT_KIND[c.kind]} · ${c.recipientName}`} actions={<Link href="/certificates" className="text-sm font-semibold text-teal-700 hover:underline">← Certificates</Link>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {(await searchParams).revoked && <Alert tone="green">Certificate revoked. The holder was notified and public verification now shows it as revoked.</Alert>}
          {(await searchParams).corrected && <Alert tone="green">Corrected certificate issued. The earlier certificate now shows as superseded, and the holder was notified.</Alert>}
          {c.correctionReason && <Alert tone="amber">This certificate corrects an earlier one. Reason: {c.correctionReason}</Alert>}
          {c.status === "REVOKED" && <Alert>Revoked on {fmtDate(c.revokedAt)}. Reason: {c.revocationReason}</Alert>}
          {effectiveStatus(c) === "EXPIRED" && <Alert tone="amber">This certificate has expired. Retake the course to renew it.</Alert>}
          <Card title={<span className="flex items-center gap-2">Certificate details <Badge tone={st.tone}>{st.label}</Badge></span>}>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Recipient</dt><dd className="font-medium text-navy-900">{c.recipientName}</dd></div>
              <div><dt className="text-xs text-slate-500">Certificate type</dt><dd>{CERT_TITLE[c.kind] ?? c.kind}</dd></div>
              <div><dt className="text-xs text-slate-500">{c.kind === "COMPETENCY_VERIFICATION" ? "Skill" : "Course"}</dt><dd>{c.courseTitle}{c.courseCode ? ` (${c.courseCode})` : ""}</dd></div>
              {c.programClassification && <div><dt className="text-xs text-slate-500">Program type</dt><dd>{PROGRAM_LABEL[c.programClassification]?.label}</dd></div>}
              {c.instructorName && <div><dt className="text-xs text-slate-500">{c.kind === "COMPETENCY_VERIFICATION" ? "Evaluator" : "Instructor"}</dt><dd>{c.instructorName}</dd></div>}
              {c.signatoryName && <div><dt className="text-xs text-slate-500">Authorized signatory</dt><dd>{c.signatoryName}{c.signatoryTitle ? `, ${c.signatoryTitle}` : ""}</dd></div>}
              {c.renewalRequirements && <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Renewal</dt><dd>{c.renewalRequirements}</dd></div>}
              <div><dt className="text-xs text-slate-500">Completion date</dt><dd>{fmtDate(c.completedOn)}</dd></div>
              <div><dt className="text-xs text-slate-500">Valid through</dt><dd>{c.expiresOn ? fmtDate(c.expiresOn) : "No expiration"}</dd></div>
              <div><dt className="text-xs text-slate-500">Training hours</dt><dd>{Number(c.trainingHours).toFixed(2)}</dd></div>
              <div><dt className="text-xs text-slate-500">Certificate number</dt><dd className="font-mono">{c.certificateNumber}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Issuing authority</dt><dd>{c.issuingAuthority}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Verification</dt><dd><a className="break-all text-teal-700 underline" href={url} target="_blank" rel="noopener noreferrer">{url}</a> · code <span className="font-mono">{c.verificationCode}</span></dd></div>
            </dl>
            {c.programNotice && <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{c.programNotice}</p>}
            <p className="mt-4 text-xs text-slate-500">{disclaimerFor(c.kind)}</p>
            <ButtonLink href={`/api/certificates/${c.id}/pdf`} variant="teal" className="mt-4">Download PDF</ButtonLink>
          </Card>
          {history.length > 1 && (
            <Card title="Certificate history for this course">
              <ul className="space-y-2 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between">
                    <Link href={`/certificates/${h.id}`} className={h.id === c.id ? "font-semibold" : "text-teal-700 underline"}>{h.certificateNumber}</Link>
                    <span className="flex items-center gap-2 text-xs text-slate-500">{fmtDate(h.completedOn)} <Badge tone={CERT_STATUS[effectiveStatus(h)].tone}>{CERT_STATUS[effectiveStatus(h)].label}</Badge></span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          {ctx.can("certificates.revoke") && c.status !== "REVOKED" && (
            <Card title="Revoke certificate">
              <ActionForm action={revokeAction} submitLabel="Revoke permanently" variant="danger" confirm="Revoke this certificate? This cannot be undone.">
                <input type="hidden" name="certificateId" value={c.id} />
                <p className="text-xs text-slate-600">Revocation is permanent and audited. The holder is notified and public verification shows the certificate as revoked.</p>
                <Field label="Reason" name="reason"><Textarea id="reason" name="reason" rows={3} required minLength={10} /></Field>
              </ActionForm>
            </Card>
          )}
          {ctx.can("certificates.revoke") && (c.status === "ACTIVE" || c.status === "EXPIRED") && (
            <Card title="Correct the name">
              <ActionForm action={correctAction} submitLabel="Issue corrected certificate" confirm="Issue a corrected certificate? The current certificate will show as superseded.">
                <input type="hidden" name="certificateId" value={c.id} />
                <p className="text-xs text-slate-600">Certificates cannot be edited. A correction issues a new certificate number with the corrected full legal name; the current one is marked superseded. Both steps are audited.</p>
                <Field label="Corrected full legal name" name="recipientName"><Input id="recipientName" name="recipientName" defaultValue={c.recipientName} required maxLength={120} /></Field>
                <Field label="Reason for correction" name="reason"><Textarea id="reason-correct" name="reason" rows={2} required minLength={10} /></Field>
              </ActionForm>
            </Card>
          )}
          {verifications.length > 0 && (
            <Card title="Recent verifications">
              <ul className="space-y-1 text-xs text-slate-600">{verifications.map((v) => <li key={v.id}>{fmtDateTime(v.verifiedAt, false, ctx.tenant.timeZone)}</li>)}</ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
