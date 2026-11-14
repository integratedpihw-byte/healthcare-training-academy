import Link from "next/link";
import { systemDb } from "@/db/server";
import { requestMeta } from "@/lib/auth/context";
import { verifyCertificate } from "@/lib/certificates/service";
import { CERTIFICATE_DISCLAIMER } from "@/lib/certificates/service";
import { Alert, Card, fmtDate } from "@/components/ui";

export const metadata = { title: "Certificate verification", robots: { index: false } };

const STATUS: Record<string, { tone: "green" | "amber" | "red"; label: string; text: string }> = {
  ACTIVE: { tone: "green", label: "Valid", text: "This certificate is authentic and currently valid." },
  EXPIRED: { tone: "amber", label: "Expired", text: "This certificate is authentic but has expired." },
  SUPERSEDED: { tone: "amber", label: "Superseded", text: "This certificate is authentic but has been replaced by a newer certificate for the same course." },
  REVOKED: { tone: "red", label: "Revoked", text: "This certificate has been revoked by the issuing organization and is not valid." },
};

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const r = await verifyCertificate(systemDb(), decodeURIComponent(code), await requestMeta());
  if (r.rateLimited) return <Alert>Too many verification requests. Please try again later.</Alert>;
  if (!r.found || !r.certificate) {
    return (
      <Card>
        <h1 className="text-xl font-bold text-navy-900">Certificate not found</h1>
        <p className="mt-2 text-sm text-slate-700">No certificate matches this verification code. Check the code and try again, or contact the issuing organization.</p>
        <Link href="/verify" className="mt-4 inline-block text-sm font-semibold text-teal-700 underline">Verify another code</Link>
      </Card>
    );
  }
  const c = r.certificate;
  const s = STATUS[c.status];
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Certificate verification</p>
      <div className="mt-3"><Alert tone={s.tone}><strong>{s.label}.</strong> {s.text}{c.revokedAt ? ` Revoked on ${fmtDate(c.revokedAt)}.` : ""}</Alert></div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-slate-500">Recipient</dt><dd className="text-base font-semibold text-navy-900">{c.recipientName}</dd></div>
        <div><dt className="text-xs text-slate-500">Course</dt><dd className="font-medium text-navy-900">{c.courseTitle}{c.courseCode ? ` (${c.courseCode})` : ""}</dd></div>
        <div><dt className="text-xs text-slate-500">Completion date</dt><dd>{fmtDate(c.completedOn)}</dd></div>
        <div><dt className="text-xs text-slate-500">Valid through</dt><dd>{c.expiresOn ? fmtDate(c.expiresOn) : "No expiration"}</dd></div>
        <div><dt className="text-xs text-slate-500">Training hours</dt><dd>{Number(c.trainingHours).toFixed(2)}</dd></div>
        <div><dt className="text-xs text-slate-500">Certificate number</dt><dd className="font-mono">{c.number}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Issued by</dt><dd>{c.issuingAuthority}</dd></div>
      </dl>
      <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">{c.kind === "COURSE_COMPLETION" ? CERTIFICATE_DISCLAIMER : ""}</p>
    </Card>
  );
}
