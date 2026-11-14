import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { requireAnyPermission, requireFeature } from "@/lib/auth/context";
import { evaluateCompliance, facilityScope, getRuleDetail } from "@/lib/compliance/service";
import { CATEGORY_LABELS, KIND_LABELS } from "@/lib/compliance/engine";
import { JOB_DUTY_TAGS, LICENSE_TYPE_TAGS } from "@/content/regulatory";
import { assignableCourses } from "@/lib/workforce/assignments";
import { listCompetencies } from "@/lib/competency/service";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, Card, FACILITY_TYPE_LABELS, Field, Input, PageHeader, Select, Table, Td, Textarea, fmtDate } from "@/components/ui";
import { ComplianceTabs, ItemBadge, RuleStateBadge, VerificationBadge } from "@/components/compliance/common";
import { mapRuleAction, recordDecisionAction } from "../../actions";

export const metadata = { title: "Regulatory requirement" };

const MSG: Record<string, string> = { decision: "Decision recorded.", mapped: "Training requirement created. Onboarding and re-evaluations now apply it to the employees in scope." };
const tag = (list: { code: string; label: string }[], c: string) => list.find((t) => t.code === c)?.label ?? c;

export default async function RulePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireAnyPermission(["compliance.view", "compliance.manage"]);
  requireFeature(ctx, "compliance");
  const d = await ctx.tx(async (tx) => {
    const detail = await getRuleDetail(tx, ctx.tenant.id, id);
    if (!detail) return null;
    const all = (await tx.execute<{ id: string; name: string }>(sql`select id, name from facilities where tenant_id = ${ctx.tenant.id}::uuid and is_active order by name`)).rows;
    const scope = facilityScope(ctx.access, "compliance.view", all.map((f) => f.id));
    const ev = await evaluateCompliance(tx, ctx.tenant.id, { facilityIds: scope });
    return { detail, facilities: all, ev, courses: await assignableCourses(tx), comps: await listCompetencies(tx) };
  });
  if (!d) notFound();
  const { rule, source, versions, decisions, mappings, suggested } = d.detail;
  const applies = d.ev.facilities.map((f) => ({ f, fr: f.rules.find((r) => r.rule.id === id) })).filter((x) => x.fr);
  const items = d.ev.facilities.flatMap((f) => f.items.filter((i) => i.ruleId === id).map((i) => ({ ...i, facility: f.name })));
  const canManage = ctx.can("compliance.manage");
  const canMap = canManage && ctx.can("training.requirements.manage");
  const decisionFacilities = d.facilities.filter((f) => ctx.can("compliance.manage", f.id));
  return (
    <>
      <PageHeader title={rule.title} description={`${rule.citation} · ${CATEGORY_LABELS[rule.category]} · ${rule.jurisdiction === "FL" ? "Florida" : "Federal"}`} actions={<Link href="/compliance/rules" className="self-center text-sm text-slate-600 hover:underline">← Library</Link>} />
      <ComplianceTabs active="/compliance/rules" />
      {sp.msg && MSG[sp.msg] && <div className="mb-4"><Alert tone="green">{MSG[sp.msg]}</Alert></div>}
      {rule.pendingChangeNote && <div className="mb-4"><Alert tone="amber"><strong>Pending change:</strong> {rule.pendingChangeNote}</Alert></div>}
      {rule.complianceStatus !== "VERIFIED" && <div className="mb-4"><Alert tone="amber">This requirement has not been verified against its source. No deadline or frequency is asserted; your compliance reviewer should determine what applies before relying on it.</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card title="Requirement" actions={<VerificationBadge status={rule.complianceStatus} />}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Agency</dt><dd>{rule.agency}</dd>
              <dt className="text-slate-500">Citation</dt><dd className="font-mono text-xs">{rule.citation}</dd>
              <dt className="text-slate-500">Type</dt><dd>{KIND_LABELS[rule.kind]}</dd>
              <dt className="text-slate-500">Training requirement</dt><dd>{rule.requirementText}</dd>
              <dt className="text-slate-500">Applicable roles</dt><dd>{rule.audienceText ?? "—"}</dd>
              <dt className="text-slate-500">Facility types</dt><dd>{rule.facilityTypes.length ? rule.facilityTypes.map((t) => FACILITY_TYPE_LABELS[t]).join(", ") : "All"}</dd>
              {rule.facilityLicenseTypes.length > 0 && <><dt className="text-slate-500">License / program</dt><dd>{rule.facilityLicenseTypes.map((t) => tag(LICENSE_TYPE_TAGS, t)).join(", ")}</dd></>}
              {rule.positionCodes.length > 0 && <><dt className="text-slate-500">Positions</dt><dd>{rule.positionCodes.join(", ")}</dd></>}
              {rule.jobDuties.length > 0 && <><dt className="text-slate-500">Job duties</dt><dd>{rule.jobDuties.map((t) => tag(JOB_DUTY_TAGS, t)).join(", ")}</dd></>}
              {(rule.requiresClinicalExposure || rule.requiresBloodborneExposure) && <><dt className="text-slate-500">Exposure</dt><dd>{[rule.requiresClinicalExposure && "Clinical", rule.requiresBloodborneExposure && "Bloodborne"].filter(Boolean).join(", ")}</dd></>}
              <dt className="text-slate-500">Initial timing</dt><dd>{rule.initialTimingText ?? "—"}</dd>
              <dt className="text-slate-500">Frequency</dt><dd>{rule.frequencyText ?? "—"}{rule.frequencyVerified && rule.frequencyMonths && <span className="text-xs text-slate-500"> (tracked as every {rule.frequencyMonths} months)</span>}</dd>
              <dt className="text-slate-500">Effective date</dt><dd>{rule.effectiveDate ? fmtDate(rule.effectiveDate) : "—"}</dd>
              <dt className="text-slate-500">Source</dt><dd><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{source.title}</a>{!source.isOfficial && <span className="text-xs text-slate-500"> (secondary copy)</span>}</dd>
              <dt className="text-slate-500">Last verified</dt><dd>{rule.lastVerifiedAt ? fmtDate(rule.lastVerifiedAt) : "Not verified"}</dd>
              <dt className="text-slate-500">Verification note</dt><dd className="text-slate-700">{rule.verificationNote ?? "—"}</dd>
              <dt className="text-slate-500">Compliance reviewer</dt><dd>{rule.reviewerName ?? "—"}</dd>
              <dt className="text-slate-500">Version</dt><dd>{rule.version}</dd>
            </dl>
          </Card>

          <Card title="Applicability at your facilities">
            {applies.length === 0 ? <p className="text-sm text-slate-600">By facility type, state and designations, this rule does not apply to any facility in your scope. If you believe it does, record a decision and map training.</p> : (
              <Table head={["Facility", "Status", "Decision"]}>
                {applies.map(({ f, fr }) => (
                  <tr key={f.id}>
                    <Td className="font-medium text-navy-900">{f.name}</Td>
                    <Td><RuleStateBadge state={fr!.state} />{fr!.reReview && <div className="text-xs text-amber-700">Rule changed since your decision — re-review</div>}</Td>
                    <Td className="text-xs">{fr!.decision ? <>{fr!.decision.decision.replace("_", " ").toLowerCase()} on v{fr!.decision.ruleVersion}{fr!.decision.facilityId ? "" : " (organization-wide)"}</> : <span className="text-slate-500">None recorded</span>}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title={`Staff status (${items.length})`}>
            {items.length === 0 ? <p className="text-sm text-slate-600">{mappings.length ? "No current employees are in scope for the mapped training." : "Map this rule to training to track staff completion."}</p> : (
              <Table head={["Employee", "Facility", "Training", "Status", "Valid until"]}>
                {items.map((i) => (
                  <tr key={`${i.facility}:${i.employeeId}:${i.requirementId}`}>
                    <Td><Link href={`/employees/${i.employeeId}`} className="text-teal-700 hover:underline">{i.employeeName}</Link></Td>
                    <Td className="text-xs">{i.facility}</Td>
                    <Td className="text-xs">{i.requirementTitle}</Td>
                    <Td><ItemBadge status={i.status} /></Td>
                    <Td className="text-xs">{i.validUntil ? fmtDate(i.validUntil) : i.dueDate ? `Due ${fmtDate(i.dueDate)}` : "—"}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Version history">
            <ul className="space-y-2 text-sm">
              {versions.map((v) => <li key={v.id}><span className="font-medium text-navy-900">Version {v.version}</span> <span className="text-xs text-slate-500">{fmtDate(v.createdAt)}</span><div className="text-slate-600">{v.changeSummary}</div></li>)}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Mapped training">
            {mappings.length === 0 ? <p className="text-sm text-slate-600">No training mapped yet.</p> : (
              <ul className="space-y-2 text-sm">
                {mappings.map((m) => (
                  <li key={m.r.id}>
                    <div className="font-medium text-navy-900">{m.courseTitle ?? m.competencyName}</div>
                    <div className="text-xs text-slate-500">{m.r.frequencyMonths ? `Every ${m.r.frequencyMonths} months` : "No recurrence"} · {m.r.dueWithinDaysOfHire != null ? `due ${m.r.dueWithinDaysOfHire} days after hire` : "default due window"}{m.r.needsAdminReview ? " · review before auto-assigning" : ""}{m.r.isActive ? "" : " · inactive"}</div>
                  </li>
                ))}
              </ul>
            )}
            {canMap && (
              <details className="mt-4 rounded-lg border border-slate-200 p-3" open={mappings.length === 0}>
                <summary className="cursor-pointer text-sm font-semibold text-navy-900">Map to a course or skills checklist</summary>
                {suggested.length > 0 && <p className="mt-2 text-xs text-slate-600">Library courses that may help: {suggested.map((s) => `${s.title}${s.status !== "PUBLISHED" ? " (not yet published)" : ""}`).join("; ")}. Confirm the content meets the rule — completing a course documents training but is not a legal determination.</p>}
                <ActionForm action={mapRuleAction} submitLabel="Create requirement" className="mt-3 space-y-3">
                  <input type="hidden" name="ruleId" value={id} />
                  <Field label="Type" name="target" htmlFor="map-target"><Select id="map-target" name="target" defaultValue={rule.kind === "COMPETENCY_ASSESSMENT" ? "competency" : "course"}><option value="course">Course</option><option value="competency">Skills checklist</option></Select></Field>
                  <Field label="Course" name="courseId" htmlFor="map-course"><Select id="map-course" name="courseId" defaultValue={suggested.find((s) => s.status === "PUBLISHED")?.id ?? ""}><option value="">—</option>{d.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
                  <Field label="Skills checklist" name="competencyId" htmlFor="map-comp"><Select id="map-comp" name="competencyId" defaultValue=""><option value="">—</option>{d.comps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Due within (days of hire)" name="dueWithinDaysOfHire" htmlFor="map-due" hint={rule.complianceStatus === "VERIFIED" && rule.initialDueDaysFromHire != null ? `Rule: ${rule.initialDueDaysFromHire}` : "Blank = rule value if verified"}><Input id="map-due" name="dueWithinDaysOfHire" type="number" min={0} max={730} /></Field>
                    <Field label="Repeat every (months)" name="frequencyMonths" htmlFor="map-freq" hint={rule.frequencyVerified && rule.frequencyMonths ? `Rule: ${rule.frequencyMonths}` : "Rule sets none — optional policy"}><Input id="map-freq" name="frequencyMonths" type="number" min={1} max={120} /></Field>
                  </div>
                  <Field label="Notes" name="notes" htmlFor="map-notes"><Textarea id="map-notes" name="notes" rows={2} maxLength={2000} /></Field>
                </ActionForm>
              </details>
            )}
          </Card>

          {canManage && (
            <Card title="Record an applicability decision">
              <ActionForm action={recordDecisionAction} submitLabel="Record decision" resetOnSuccess>
                <input type="hidden" name="ruleId" value={id} />
                <Field label="Scope" name="facilityId" htmlFor="dec-fac">
                  <Select id="dec-fac" name="facilityId" defaultValue={ctx.can("compliance.manage", null) ? "" : decisionFacilities[0]?.id}>
                    {ctx.can("compliance.manage", null) && <option value="">Organization-wide</option>}
                    {decisionFacilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </Field>
                <Field label="Decision" name="decision" htmlFor="dec-decision">
                  <Select id="dec-decision" name="decision" defaultValue="APPLICABLE">
                    <option value="APPLICABLE">Applicable</option>
                    <option value="NOT_APPLICABLE">Not applicable</option>
                    <option value="UNDER_REVIEW">Under review</option>
                  </Select>
                </Field>
                <Field label="Rationale (kept for audits)" name="rationale" htmlFor="dec-rationale" hint="e.g. who reviewed it, the basis (license type, services offered, covered-entity status)."><Textarea id="dec-rationale" name="rationale" rows={3} required minLength={10} maxLength={2000} /></Field>
              </ActionForm>
            </Card>
          )}

          <Card title="Decision history">
            {decisions.length === 0 ? <p className="text-sm text-slate-600">No decisions recorded.</p> : (
              <ul className="space-y-3 text-sm">
                {decisions.map((x) => (
                  <li key={x.id}>
                    <div><Badge tone={x.decision === "APPLICABLE" ? "green" : x.decision === "NOT_APPLICABLE" ? "gray" : "amber"}>{x.decision.replace("_", " ").toLowerCase()}</Badge> <span className="text-xs text-slate-500">{x.facility_name ?? "Organization-wide"} · v{x.rule_version} · {fmtDate(x.created_at)}{x.decided_by ? ` · ${x.decided_by}` : ""}</span></div>
                    <p className="text-slate-700">{x.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
