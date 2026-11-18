import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { APPROVAL_KIND_LABEL, listPrograms } from "@/lib/compliance/programs";
import { CERT_TITLE, PROGRAM_LABEL } from "@/lib/certificates/labels";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, Card, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea, fmtDate } from "@/components/ui";
import { recordApprovalAction, setClassificationAction, withdrawApprovalAction } from "./actions";

export const metadata = { title: "Programs and approvals" };

const CERT_CHOICES = ["COURSE_COMPLETION", "PROFESSIONAL_DEVELOPMENT", "SPECIALIZED_TRAINING", "CONTINUING_EDUCATION"] as const;

export default async function ProgramsPage() {
  await requirePlatformAdmin();
  const { rows, approvals } = await listPrograms(systemDb());
  const today = new Date().toISOString().slice(0, 10);
  const active = approvals.filter((x) => x.a.status === "ACTIVE" && (!x.a.expiresOn || x.a.expiresOn >= today));
  return (
    <>
      <PageHeader
        title="Programs and approvals"
        description="The program type of every library course, and the register of real approvals behind any state-approved or continuing education claim. Record an approval only from the approving body's own record, with its link."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Library courses" value={rows.length} />
        <StatCard label="Active approvals" value={active.length} tone="teal" />
        <StatCard label="State-approved programs" value={rows.filter((r) => r.programClassification === "STATE_APPROVED_PROGRAM").length} />
        <StatCard label="CE courses" value={rows.filter((r) => r.programClassification === "CONTINUING_EDUCATION").length} />
      </div>
      <Alert tone="amber">
        Never invent an approval. CHITA may describe a course as state-approved or as continuing education only while an active approval is recorded here. The database refuses the
        claim otherwise, and courses fall back automatically when an approval expires or is withdrawn.
      </Alert>
      <div className="mt-6 space-y-6">
        <Card title="Program type by course">
          <Table head={["Course", "Program type", "Certificate", "Approvals", "Change"]}>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td><div className="font-medium text-navy-900">{r.title}</div><div className="text-xs text-slate-500">{r.code} · {r.category} · {r.status.replace("_", " ").toLowerCase()}</div></Td>
                <Td className="text-xs">{PROGRAM_LABEL[r.programClassification]?.label}</Td>
                <Td className="text-xs">{CERT_TITLE[r.certificateType]}</Td>
                <Td>{r.activeApprovals ? <Badge tone="green">{r.activeApprovals} active</Badge> : <span className="text-xs text-slate-500">None</span>}</Td>
                <Td>
                  <details>
                    <summary className="cursor-pointer text-xs font-semibold text-teal-700">Edit</summary>
                    <ActionForm action={setClassificationAction} submitLabel="Save" className="mt-2 w-72 space-y-2">
                      <input type="hidden" name="courseId" value={r.id} />
                      <Select name="programClassification" defaultValue={r.programClassification} aria-label={`Program type for ${r.code}`}>
                        {Object.entries(PROGRAM_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </Select>
                      <Select name="certificateType" defaultValue={CERT_CHOICES.includes(r.certificateType as (typeof CERT_CHOICES)[number]) ? r.certificateType : "COURSE_COMPLETION"} aria-label={`Certificate type for ${r.code}`}>
                        {CERT_CHOICES.map((k) => <option key={k} value={k}>{CERT_TITLE[k]}</option>)}
                      </Select>
                      <Input name="reason" placeholder="Reason for the change" required minLength={5} aria-label="Reason for the change" />
                    </ActionForm>
                  </details>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Card title="Approvals register">
            {approvals.length === 0 ? (
              <p className="text-sm text-slate-600">No approvals are on record. No CHITA course is state-approved or approved for continuing education.</p>
            ) : (
              <Table head={["Course", "Approval", "Dates", "Status", ""]}>
                {approvals.map(({ a, code, title }) => (
                  <tr key={a.id}>
                    <Td><div className="font-medium">{code}</div><div className="text-xs text-slate-500">{title}</div></Td>
                    <Td className="text-xs"><div className="font-medium text-navy-900">{a.approvingBody}</div><div>{APPROVAL_KIND_LABEL[a.kind]} · no. {a.approvalNumber}</div>{a.sourceUrl && <a className="text-teal-700 underline" href={a.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a>} · verified {fmtDate(a.verifiedOn)}</Td>
                    <Td className="text-xs">{fmtDate(a.effectiveOn)} – {a.expiresOn ? fmtDate(a.expiresOn) : "no end date"}</Td>
                    <Td><Badge tone={a.status === "ACTIVE" ? "green" : a.status === "EXPIRED" ? "amber" : "gray"}>{a.status.toLowerCase()}</Badge></Td>
                    <Td>
                      {a.status === "ACTIVE" && (
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-red-700">Withdraw</summary>
                          <ActionForm action={withdrawApprovalAction} submitLabel="Withdraw approval" variant="danger" className="mt-2 w-60 space-y-2">
                            <input type="hidden" name="approvalId" value={a.id} />
                            <Textarea name="reason" rows={2} required minLength={10} aria-label="Reason for withdrawal" />
                          </ActionForm>
                        </details>
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
          <Card title="Record an approval">
            <ActionForm action={recordApprovalAction} submitLabel="Record approval" resetOnSuccess className="space-y-3">
              <Field label="Course" name="courseId"><Select id="courseId" name="courseId" required>{rows.map((r) => <option key={r.id} value={r.id}>{r.code} — {r.title}</option>)}</Select></Field>
              <Field label="Type of approval" name="kind"><Select id="kind" name="kind" required>{Object.entries(APPROVAL_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
              <Field label="Approving body" name="approvingBody" hint="For example: Florida Board of Nursing; Florida Department of Elder Affairs."><Input id="approvingBody" name="approvingBody" required /></Field>
              <Field label="Approval or provider number" name="approvalNumber"><Input id="approvalNumber" name="approvalNumber" required /></Field>
              <Field label="Scope" name="scope" hint="What the approval covers (setting, hours, audience)."><Input id="scope" name="scope" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Effective" name="effectiveOn"><Input id="effectiveOn" name="effectiveOn" type="date" required /></Field>
                <Field label="Expires" name="expiresOn"><Input id="expiresOn" name="expiresOn" type="date" /></Field>
              </div>
              <Field label="Link to the approving body's record" name="sourceUrl"><Input id="sourceUrl" name="sourceUrl" type="url" required placeholder="https://" /></Field>
              <Field label="Date you verified it" name="verifiedOn"><Input id="verifiedOn" name="verifiedOn" type="date" defaultValue={today} required /></Field>
              <Field label="Notes" name="notes"><Textarea id="notes" name="notes" rows={2} /></Field>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
