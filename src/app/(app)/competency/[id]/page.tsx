import { FileList } from "@/components/files/file-list";
import { FileUpload } from "@/components/files/file-upload";
import { listFiles } from "@/lib/files/service";
import { removeFileAction } from "../../file-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireTenant, requireFeature } from "@/lib/auth/context";
import { evaluableEmployees, getAssessment, listCompetencies, verifySignature, type Criterion, type CriterionResult } from "@/lib/competency/service";
import { facilities } from "@/db/schema";
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Textarea, fmtDate } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { EvaluationForm } from "@/components/competency/evaluation-form";
import { PrintButton } from "@/app/(app)/learning/[enrollmentId]/materials/print-button";
import { deleteDraftAction, signAction, voidAction } from "../actions";

export const metadata = { title: "Skills evaluation" };

export default async function AssessmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; signed?: string; edit?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireTenant();
  requireFeature(ctx, "competency");
  const sp = await searchParams;
  const d = await ctx.tx(async (tx) => {
    const row = await getAssessment(tx, id);
    if (!row) return null;
    const editing = sp.edit && row.a.status === "DRAFT" && row.a.evaluatorUserId === ctx.user.id;
    return {
      row,
      evidence: await listFiles(tx, "COMPETENCY_EVIDENCE", id),
      form: editing ? { emps: await evaluableEmployees(tx, ctx.access), facs: await tx.select({ id: facilities.id, name: facilities.name }).from(facilities).where(eq(facilities.isActive, true)), comps: await listCompetencies(tx) } : null,
    };
  });
  if (!d) notFound();
  const { row } = d;
  const a = row.a;
  const own = row.employeeUserId === ctx.user.id;
  if (!own && !ctx.can("competency.view") && !ctx.can("competency.evaluate") && !ctx.can("team.view")) notFound();
  const criteria = row.competency.criteria as Criterion[];
  const results = new Map((a.criteriaResults as CriterionResult[]).map((r) => [r.id, r]));
  const isEvaluator = a.evaluatorUserId === ctx.user.id;
  const sigOk = a.status !== "DRAFT" ? verifySignature(a) : null;

  if (d.form) {
    return (
      <>
        <PageHeader title="Edit draft evaluation" actions={<Link href={`/competency/${id}`} className="text-sm font-semibold text-teal-700 hover:underline">Cancel</Link>} />
        <Card>
          <EvaluationForm
            employees={d.form.emps.map((e) => ({ id: e.id, name: e.name, jobTitle: e.jobTitle, facilityIds: e.facilityIds }))}
            facilities={d.form.facs}
            competencies={d.form.comps.map((c) => ({ id: c.id, name: c.name, description: c.description, criteria: c.criteria as Criterion[] }))}
            existing={{ ...a, criteriaResults: a.criteriaResults as CriterionResult[] }}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`${row.competency.name}: ${row.employeeName}`} description={`${row.jobTitle} · ${row.facilityName}`} actions={<div className="no-print flex items-center gap-3"><PrintButton /><Link href="/competency" className="text-sm font-semibold text-teal-700 hover:underline">← Competency</Link></div>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {sp.saved && <Alert tone="green">Draft saved. Review the record, then sign it to make it official.</Alert>}
          {sp.signed && <Alert tone="green">Signed. The record is now locked and the employee has been notified.</Alert>}
          {a.status === "VOIDED" && <Alert>Voided {fmtDate(a.voidedAt)} — {a.voidReason}</Alert>}
          <Card title={<span className="flex items-center gap-2">Competency verification record <Badge tone={a.result === "PASS" ? "green" : a.result === "FAIL" ? "red" : "amber"}>{a.result.replace("_", " ")}</Badge><Badge tone={a.status === "SIGNED" ? "green" : a.status === "VOIDED" ? "gray" : "amber"}>{a.status}</Badge></span>}>
            <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-slate-500">Assessment date</dt><dd>{fmtDate(a.assessedOn)}</dd></div>
              <div><dt className="text-xs text-slate-500">Evaluator</dt><dd>{row.evaluatorName}</dd></div>
              <div><dt className="text-xs text-slate-500">Next assessment</dt><dd>{a.nextAssessmentDue ? fmtDate(a.nextAssessmentDue) : "—"}</dd></div>
            </dl>
            <ol className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              {criteria.map((c, n) => {
                const r = results.get(c.id);
                return (
                  <li key={c.id} className="flex items-start justify-between gap-3 px-3 py-2">
                    <div>{n + 1}. {c.text} {c.critical && <Badge tone="red">Critical</Badge>}{r?.note && <div className="mt-0.5 text-xs text-slate-500">Note: {r.note}</div>}</div>
                    <Badge tone={r?.outcome === "MET" ? "green" : r?.outcome === "NOT_MET" ? "red" : "gray"}>{r?.outcome === "NOT_MET" ? "Not met" : r?.outcome === "NA" ? "N/A" : "Met"}</Badge>
                  </li>
                );
              })}
            </ol>
            {a.remediationRequired && <p className="mt-4 text-sm"><strong>Remediation required:</strong> {a.remediationRequired}</p>}
            {a.evaluatorComments && <p className="mt-2 text-sm"><strong>Comments:</strong> {a.evaluatorComments}</p>}
            {a.evidenceUrls.length > 0 && <p className="mt-2 text-sm"><strong>Evidence:</strong> {a.evidenceUrls.map((u) => <a key={u} href={u} className="mr-2 text-teal-700 underline" target="_blank" rel="noopener noreferrer">link</a>)}</p>}
            {(d.evidence.length > 0 || (a.status === "DRAFT" && isEvaluator)) && (
              <div className="mt-3">
                <div className="text-sm font-semibold text-navy-900">Evidence files</div>
                <FileList items={d.evidence} removeAction={a.status === "DRAFT" && isEvaluator ? removeFileAction : undefined} hidden={{ back: `/competency/${a.id}` }} />
                {a.status === "DRAFT" && isEvaluator && <div className="no-print mt-2"><FileUpload purpose="COMPETENCY_EVIDENCE" entityId={a.id} accept="application/pdf,image/png,image/jpeg,image/webp" label="Attach evidence (photo of a signed checklist, PDF)" hint="Do not upload images that show patients or residents. Files are locked once the evaluation is signed." /></div>}
              </div>
            )}
            {a.status !== "DRAFT" && (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="font-semibold text-navy-900">Electronic signature</div>
                <p className="mt-1">Signed by <strong>{a.signerName}</strong>{a.signerCredentials ? `, ${a.signerCredentials}` : ""} on {a.signedAt?.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-500">SHA-256 {a.signatureHash}</p>
                <p className={`mt-1 text-xs font-semibold ${sigOk ? "text-emerald-700" : "text-red-700"}`}>{sigOk ? "Signature verified — record unchanged since signing." : "Signature does not match the record. Contact support."}</p>
              </div>
            )}
          </Card>
        </div>
        <div className="no-print space-y-6">
          {a.status === "DRAFT" && isEvaluator && (
            <>
              <Card title="Sign this evaluation">
                {ctx.can("competency.sign") ? (
                  <ActionForm action={signAction} submitLabel="Apply electronic signature" variant="teal">
                    <input type="hidden" name="assessmentId" value={a.id} />
                    <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="attest" className="mt-1" required /> I attest that I personally observed this performance and that this record is accurate. I understand my electronic signature is legally binding as my handwritten signature under my organization&apos;s policy.</label>
                    <Field label="Your credentials (optional)" name="credentials"><Input id="credentials" name="credentials" placeholder="e.g. RN, Clinical Educator" /></Field>
                    <Field label="Re-enter your password to sign" name="password"><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
                  </ActionForm>
                ) : <p className="text-sm text-slate-600">You can record evaluations but your role cannot sign them. Ask a supervisor or instructor with signing authority.</p>}
              </Card>
              <Card title="Draft actions">
                <div className="flex gap-3">
                  <Link href={`/competency/${a.id}?edit=1`} className="text-sm font-semibold text-teal-700 hover:underline">Edit draft</Link>
                  <form action={deleteDraftAction}><input type="hidden" name="assessmentId" value={a.id} /><Button type="submit" variant="ghost" className="px-0 py-0 text-sm text-red-700">Delete draft</Button></form>
                </div>
              </Card>
            </>
          )}
          {a.status === "SIGNED" && ctx.can("competency.sign") && (
            <Card title="Void record">
              <ActionForm action={voidAction} submitLabel="Void record" variant="danger" confirm="Void this signed record? It remains in history but no longer counts.">
                <input type="hidden" name="assessmentId" value={a.id} />
                <p className="text-xs text-slate-600">Signed records cannot be edited. Void a record recorded in error and complete a new evaluation.</p>
                <Field label="Reason" name="reason"><Textarea id="reason" name="reason" rows={2} required minLength={10} /></Field>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
