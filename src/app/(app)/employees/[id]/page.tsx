import { and, eq, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnyPermission } from "@/lib/auth/context";
import { effectiveStatus, listCertificates } from "@/lib/certificates/service";
import { CERT_STATUS } from "@/lib/certificates/labels";
import { listAssessments } from "@/lib/competency/service";
import { listAssignments, SOURCE_LABELS } from "@/lib/workforce/assignments";
import { complianceFor } from "@/lib/workforce/compliance";
import { EMPLOYMENT_LABELS, employeeFormOptions, getEmployee } from "@/lib/workforce/employees";
import { FileList } from "@/components/files/file-list";
import { FileUpload } from "@/components/files/file-upload";
import { removeFileAction } from "../../file-actions";
import { files } from "@/db/schema";
import { LICENSE_KIND_LABELS, LICENSE_KINDS, listLicenses } from "@/lib/workforce/licenses";
import { ACTION_LABELS, onboardingChecklist, type OnboardingResult, type StepState } from "@/lib/workforce/onboarding";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, ButtonLink, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, Textarea, cn, fmtDate } from "@/components/ui";
import { AssignmentBadge, ComplianceBadge, DueDate } from "@/components/workforce/common";
import { addFacilityAction, deleteLicenseAction, provisionAccountAction, removeFacilityAction, runOnboardingAction, saveLicenseAction, verifyLicenseAction } from "../actions";

export const metadata = { title: "Employee profile" };

const MESSAGES: Record<string, { tone: "green" | "amber" | "red"; text: string }> = {
  created: { tone: "green", text: "Employee created." },
  updated: { tone: "green", text: "Profile saved." },
  "updated-reevaluate": { tone: "amber", text: "Profile saved. The position, facility or exposure changed — re-evaluate training requirements below." },
  "facility-removed": { tone: "green", text: "Facility assignment removed." },
  "facility-remove-failed": { tone: "red", text: "The facility assignment could not be removed (primary facility, or outside your scope)." },
  "license-saved": { tone: "green", text: "License updated." },
  "license-verified": { tone: "green", text: "License marked verified." },
  "license-rejected": { tone: "amber", text: "License marked rejected." },
  "license-removed": { tone: "green", text: "License removed." },
};

const STEP_STYLE: Record<StepState, { dot: string; label: string }> = {
  done: { dot: "bg-emerald-500", label: "Done" },
  in_progress: { dot: "bg-teal-500", label: "In progress" },
  pending: { dot: "bg-slate-300", label: "Pending" },
  attention: { dot: "bg-amber-500", label: "Needs attention" },
};

const LIC_STATUS: Record<string, { label: string; tone: "green" | "amber" | "red" | "gray" }> = {
  UNVERIFIED: { label: "Unverified", tone: "amber" },
  VERIFIED: { label: "Verified", tone: "green" },
  EXPIRED: { label: "Expired", tone: "red" },
  REJECTED: { label: "Rejected", tone: "gray" },
};

export default async function EmployeeProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireAnyPermission(["employees.view", "employees.manage", "team.view", "training.view_all", "training.assign"]);
  const d = await ctx.tx(async (tx) => {
    const p = await getEmployee(tx, id);
    if (!p) return null;
    return {
      p,
      checklist: await onboardingChecklist(tx, id),
      assignments: await listAssignments(tx, { employeeId: id, status: "ALL" }),
      licenses: await listLicenses(tx, id),
      licenseFiles: await tx.select().from(files).where(and(eq(files.purpose, "LICENSE_DOCUMENT"), isNull(files.deletedAt), sql`${files.entityId} in (select id from licenses where employee_id = ${id}::uuid)`)),
      skills: await listAssessments(tx, { employeeId: id, limit: 20 }),
      certs: p.employee.userId ? await listCertificates(tx, { userId: p.employee.userId }) : [],
      compliance: (await complianceFor(tx, [id])).get(id)!,
      opts: await employeeFormOptions(tx, ctx.access),
    };
  });
  if (!d) notFound();
  const e = d.p.employee;
  const facIds = d.p.facilities.map((f) => f.id);
  const canManage = ctx.can("employees.manage", e.primaryFacilityId) || facIds.some((f) => ctx.can("employees.manage", f));
  const canAssign = ctx.can("training.assign", e.primaryFacilityId) || facIds.some((f) => ctx.can("training.assign", f));
  const msg = sp.msg ? MESSAGES[sp.msg] : undefined;
  const results = (d.checklist?.lastRun?.results ?? []) as OnboardingResult[];
  const addable = d.opts.facilities.filter((f) => !facIds.includes(f.id));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title={`${e.firstName} ${e.lastName}`}
        description={`${e.jobTitle} · ${e.employeeNumber}`}
        actions={
          <>
            <Link href="/employees" className="self-center text-sm text-slate-600 hover:underline">← Employees</Link>
            {canManage && <ButtonLink href={`/employees/${id}/edit`} variant="secondary">Edit profile</ButtonLink>}
            {canAssign && <ButtonLink href={`/training/assign?employeeId=${id}`} variant="teal">Assign course</ButtonLink>}
          </>
        }
      />
      {msg && <div className="mb-4"><Alert tone={msg.tone}>{msg.text}</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <Card title="Profile" actions={<ComplianceBadge status={d.compliance.status} />}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Status</dt><dd>{EMPLOYMENT_LABELS[e.employmentStatus]}{e.terminationDate && ` (${fmtDate(e.terminationDate)})`}</dd>
              <dt className="text-slate-500">Position</dt><dd>{e.jobTitle} <span className="text-xs text-slate-500">({e.positionCode})</span></dd>
              <dt className="text-slate-500">Department</dt><dd>{d.p.department ?? "—"}</dd>
              <dt className="text-slate-500">Supervisor</dt><dd>{d.p.supervisor ? <Link className="text-teal-700 hover:underline" href={`/employees/${d.p.supervisor.id}`}>{d.p.supervisor.name}</Link> : "—"}</dd>
              <dt className="text-slate-500">Hire date</dt><dd>{fmtDate(e.hireDate)}</dd>
              <dt className="text-slate-500">Email</dt><dd className="break-all">{e.email ?? "—"}</dd>
              <dt className="text-slate-500">Phone</dt><dd>{e.phone ?? "—"}</dd>
              <dt className="text-slate-500">Pathway</dt><dd>{e.trainingPathway ?? "—"}</dd>
              <dt className="text-slate-500">Exposure</dt><dd>{[e.clinicalExposure && "Clinical", e.bloodborneExposure && "Bloodborne"].filter(Boolean).join(", ") || "None recorded"}</dd>
            </dl>
            {d.p.reports.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
                <div className="mb-1 font-medium text-navy-900">Direct reports ({d.p.reports.length})</div>
                <ul className="space-y-1">{d.p.reports.map((r) => <li key={r.id}><Link href={`/employees/${r.id}`} className="text-teal-700 hover:underline">{r.name}</Link> <span className="text-xs text-slate-500">{r.jobTitle}</span></li>)}</ul>
              </div>
            )}
          </Card>

          <Card title="Academy account">
            {d.p.account ? (
              <p className="text-sm text-slate-700">Linked to <span className="font-medium">{d.p.account.email}</span>. The employee receives assignments, reminders and certificates in the academy.</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-slate-700">No account yet. Without one, the employee cannot be notified or complete online training.</p>
                {canManage && (
                  <ActionForm action={provisionAccountAction} submitLabel="Create account and send invitation" variant="secondary">
                    <input type="hidden" name="employeeId" value={id} />
                  </ActionForm>
                )}
              </>
            )}
          </Card>

          <Card title="Facilities">
            <ul className="mb-3 space-y-2 text-sm">
              {d.p.facilities.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2">
                  <span>{f.name}{f.id === e.primaryFacilityId && <Badge tone="blue">Primary</Badge>}</span>
                  {canManage && f.id !== e.primaryFacilityId && ctx.can("employees.manage", f.id) && (
                    <form action={removeFacilityAction}><input type="hidden" name="employeeId" value={id} /><input type="hidden" name="facilityId" value={f.id} /><button className="text-xs font-semibold text-red-700 hover:underline" type="submit">Remove</button></form>
                  )}
                </li>
              ))}
            </ul>
            {canManage && addable.length > 0 && (
              <ActionForm action={addFacilityAction} submitLabel="Assign to facility" variant="secondary" className="space-y-2">
                <input type="hidden" name="employeeId" value={id} />
                <Field label="Additional facility" name="facilityId" htmlFor="add-facility"><Select id="add-facility" name="facilityId" required defaultValue="">{[<option key="" value="" disabled>Choose…</option>, ...addable.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)]}</Select></Field>
              </ActionForm>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Onboarding checklist"
            actions={canAssign ? (
              <ActionForm action={runOnboardingAction} submitLabel={d.checklist?.lastRun ? "Re-evaluate requirements" : "Run onboarding"} pendingText="Evaluating…" variant="secondary" className="flex flex-col items-end gap-2">
                <input type="hidden" name="employeeId" value={id} />
              </ActionForm>
            ) : undefined}
          >
            <ol className="space-y-2">
              {d.checklist?.steps.map((s) => (
                <li key={s.n} className="flex gap-3 text-sm">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", STEP_STYLE[s.state].dot)} aria-hidden />
                  <div className="flex-1">
                    <div className="font-medium text-navy-900">{s.n}. {s.title} <span className="sr-only">— {STEP_STYLE[s.state].label}</span></div>
                    <div className="text-slate-600">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
            {results.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable requirements (last evaluation)</h3>
                <Table head={["Requirement", "Type", "Outcome", "Due"]}>
                  {results.map((r) => (
                    <tr key={r.requirementId}>
                      <Td>{r.title}<div className="text-xs text-slate-500">{r.targetName}</div>{r.note && <div className="text-xs text-amber-700">{r.note}</div>}</Td>
                      <Td>{r.kind === "course" ? "Course" : "Skills evaluation"}</Td>
                      <Td><Badge tone={ACTION_LABELS[r.action].tone}>{ACTION_LABELS[r.action].label}</Badge></Td>
                      <Td className="whitespace-nowrap">{r.dueDate ? fmtDate(r.dueDate) : "—"}</Td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </Card>

          <Card title={`Training assignments (${d.assignments.length})`}>
            <Table head={["Course", "Source", "Due", "Progress", "Status", ""]} empty={d.assignments.length === 0 ? <EmptyState>No training assigned.</EmptyState> : undefined}>
              {d.assignments.map((a) => {
                const open = ["ASSIGNED", "IN_PROGRESS", "OVERDUE"].includes(a.status);
                return (
                  <tr key={a.id}>
                    <Td className="font-medium text-navy-900">{a.courseTitle}<div className="text-xs font-normal text-slate-500">{a.courseCode}</div></Td>
                    <Td>{SOURCE_LABELS[a.source]}</Td>
                    <Td className="whitespace-nowrap">{a.status === "COMPLETED" ? <span className="text-xs text-slate-500">Completed {fmtDate(a.completedAt)}</span> : <DueDate date={a.dueDate} open={open} />}</Td>
                    <Td>{a.progressPct != null ? `${a.progressPct}%` : "—"}</Td>
                    <Td><AssignmentBadge status={a.status} /></Td>
                    <Td className="text-right"><Link href={`/training/assignments/${a.id}`} className="text-sm font-semibold text-teal-700 hover:underline">Details</Link></Td>
                  </tr>
                );
              })}
            </Table>
          </Card>

          <Card title={`Licenses & external certifications (${d.licenses.length})`}>
            <div id="licenses" />
            <p className="mb-3 text-xs text-slate-500">Recorded for expiration tracking. The academy does not issue licenses; verify each one with the issuing authority (for Florida health professions, the Department of Health license verification service).</p>
            <Table head={["License", "Number", "Expires", "Status", ""]} empty={d.licenses.length === 0 ? <EmptyState>No licenses recorded.</EmptyState> : undefined}>
              {d.licenses.map((l) => {
                const st = l.verificationStatus !== "EXPIRED" && l.expiresOn && l.expiresOn < today ? LIC_STATUS.EXPIRED : LIC_STATUS[l.verificationStatus];
                return (
                  <tr key={l.id}>
                    <Td>
                      <div className="font-medium text-navy-900">{l.name}</div>
                      <div className="text-xs text-slate-500">{LICENSE_KIND_LABELS[l.kind]} · {l.issuingAuthority}{l.state && ` (${l.state})`}</div>
                      {l.verificationSource && <div className="text-xs text-slate-500">Verified via: {l.verificationSource}{l.verifiedAt && ` on ${fmtDate(l.verifiedAt)}`}</div>}
                      {d.licenseFiles.some((f) => f.entityId === l.id) && <div className="mt-1"><FileList items={d.licenseFiles.filter((f) => f.entityId === l.id)} removeAction={canManage ? removeFileAction : undefined} hidden={{ back: `/employees/${id}` }} /></div>}
                    </Td>
                    <Td className="font-mono text-xs">{l.licenseNumber}</Td>
                    <Td className="whitespace-nowrap">{l.expiresOn ? <DueDate date={l.expiresOn} open={l.verificationStatus !== "REJECTED"} /> : "No expiry"}</Td>
                    <Td><Badge tone={st.tone}>{st.label}</Badge></Td>
                    <Td className="text-right">
                      {canManage && (
                        <details className="text-left">
                          <summary className="cursor-pointer text-sm font-semibold text-teal-700">Manage</summary>
                          <div className="mt-2 w-72 space-y-3">
                            {l.verificationStatus !== "VERIFIED" && (!l.expiresOn || l.expiresOn >= today) && (
                              <ActionForm action={verifyLicenseAction} submitLabel="Record verification" variant="secondary" className="space-y-2">
                                <input type="hidden" name="employeeId" value={id} /><input type="hidden" name="licenseId" value={l.id} />
                                <Field label="Verification source" name="source" htmlFor={`src-${l.id}`}><Input id={`src-${l.id}`} name="source" required minLength={3} placeholder="e.g. FL DOH MQA online lookup" /></Field>
                                <Field label="Result" name="decision" htmlFor={`dec-${l.id}`}><Select id={`dec-${l.id}`} name="decision"><option value="VERIFIED">Verified — active and matches</option><option value="REJECTED">Could not verify / does not match</option></Select></Field>
                              </ActionForm>
                            )}
                            <details>
                              <summary className="cursor-pointer text-xs font-semibold text-slate-700">Edit details (renewal)</summary>
                              <ActionForm action={saveLicenseAction} submitLabel="Save license" variant="secondary" className="mt-2 space-y-2">
                                <input type="hidden" name="employeeId" value={id} /><input type="hidden" name="licenseId" value={l.id} />
                                <LicenseFields prefix={l.id} d={l} />
                              </ActionForm>
                            </details>
                            <FileUpload purpose="LICENSE_DOCUMENT" entityId={l.id} accept="application/pdf,image/png,image/jpeg,image/webp" label="Attach a copy (PDF or image)" hint="Up to 10 MB. Stored privately; every view is logged." />
                            <form action={deleteLicenseAction}><input type="hidden" name="employeeId" value={id} /><input type="hidden" name="licenseId" value={l.id} /><button type="submit" className="text-xs font-semibold text-red-700 hover:underline">Remove record</button></form>
                          </div>
                        </details>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
            {canManage && (
              <details className="mt-4 rounded-lg border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-navy-900">Add license or certification</summary>
                <ActionForm action={saveLicenseAction} submitLabel="Add license" resetOnSuccess className="mt-3 space-y-3">
                  <input type="hidden" name="employeeId" value={id} />
                  <LicenseFields prefix="new" />
                </ActionForm>
              </details>
            )}
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Skills evaluations">
              {d.skills.length === 0 ? <p className="text-sm text-slate-600">No evaluations recorded.</p> : (
                <ul className="space-y-2 text-sm">
                  {d.skills.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-2">
                      <div><Link href={`/competency/${s.id}`} className="font-medium text-teal-700 hover:underline">{s.competency}</Link><div className="text-xs text-slate-500">{fmtDate(s.assessedOn)}{s.nextAssessmentDue && ` · next due ${fmtDate(s.nextAssessmentDue)}`}</div></div>
                      <Badge tone={s.status === "VOIDED" ? "gray" : s.status === "DRAFT" ? "blue" : s.result === "PASS" ? "green" : s.result === "FAIL" ? "red" : "amber"}>{s.status === "SIGNED" ? s.result.replace("_", " ").toLowerCase() : s.status.toLowerCase()}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Certificates">
              {d.certs.length === 0 ? <p className="text-sm text-slate-600">{e.userId ? "No certificates yet." : "Certificates appear once the employee has an account and completes courses."}</p> : (
                <ul className="space-y-2 text-sm">
                  {d.certs.map((c) => {
                    const st = CERT_STATUS[effectiveStatus(c)];
                    return (
                      <li key={c.id} className="flex items-start justify-between gap-2">
                        <div><Link href={`/certificates/${c.id}`} className="font-medium text-teal-700 hover:underline">{c.courseTitle}</Link><div className="text-xs text-slate-500">Completed {fmtDate(c.completedOn)}{c.expiresOn && ` · valid through ${fmtDate(c.expiresOn)}`}</div></div>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function LicenseFields({ prefix, d }: { prefix: string; d?: { kind: string; name: string; licenseNumber: string; issuingAuthority: string; state: string | null; issuedOn: string | null; expiresOn: string | null; notes: string | null } }) {
  const idf = (n: string) => `${prefix}-${n}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Type" name="kind" htmlFor={idf("kind")}><Select id={idf("kind")} name="kind" defaultValue={d?.kind ?? "STATE_PROFESSIONAL_LICENSE"}>{LICENSE_KINDS.map((k) => <option key={k} value={k}>{LICENSE_KIND_LABELS[k]}</option>)}</Select></Field>
      <Field label="Name" name="name" htmlFor={idf("name")}><Input id={idf("name")} name="name" required maxLength={150} defaultValue={d?.name} placeholder="e.g. Registered Nurse, BLS Provider" /></Field>
      <Field label="License / certificate number" name="licenseNumber" htmlFor={idf("licenseNumber")}><Input id={idf("licenseNumber")} name="licenseNumber" required maxLength={60} defaultValue={d?.licenseNumber} /></Field>
      <Field label="Issuing authority" name="issuingAuthority" htmlFor={idf("issuingAuthority")}><Input id={idf("issuingAuthority")} name="issuingAuthority" required maxLength={150} defaultValue={d?.issuingAuthority} placeholder="e.g. Florida Board of Nursing" /></Field>
      <Field label="State" name="state" htmlFor={idf("state")}><Input id={idf("state")} name="state" maxLength={2} defaultValue={d?.state ?? ""} placeholder="FL" /></Field>
      <div />
      <Field label="Issued" name="issuedOn" htmlFor={idf("issuedOn")}><Input id={idf("issuedOn")} name="issuedOn" type="date" defaultValue={d?.issuedOn ?? ""} /></Field>
      <Field label="Expires" name="expiresOn" htmlFor={idf("expiresOn")}><Input id={idf("expiresOn")} name="expiresOn" type="date" defaultValue={d?.expiresOn ?? ""} /></Field>
      <div className="sm:col-span-2"><Field label="Notes" name="notes" htmlFor={idf("notes")}><Textarea id={idf("notes")} name="notes" rows={2} maxLength={1000} defaultValue={d?.notes ?? ""} /></Field></div>
    </div>
  );
}

