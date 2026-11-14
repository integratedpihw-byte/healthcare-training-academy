"use client";
import { useMemo, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, Field, Input, Select, Textarea, cn } from "@/components/ui";
import { saveDraftAction } from "@/app/(app)/competency/actions";

type Criterion = { id: string; text: string; critical: boolean };
type Comp = { id: string; name: string; description: string | null; criteria: Criterion[] };
type Emp = { id: string; name: string; jobTitle: string; facilityIds: string[] };
type Fac = { id: string; name: string };
type Existing = { id: string; employeeId: string; facilityId: string; competencyId: string; assessedOn: string; criteriaResults: { id: string; outcome: string; note?: string }[]; remediationRequired: string | null; evaluatorComments: string | null; evidenceUrls: string[]; nextAssessmentDue: string | null };

export function EvaluationForm({ employees, facilities, competencies, existing, defaultEmployeeId }: { employees: Emp[]; facilities: Fac[]; competencies: Comp[]; existing?: Existing; defaultEmployeeId?: string }) {
  const [empId, setEmpId] = useState(existing?.employeeId ?? defaultEmployeeId ?? "");
  const [compId, setCompId] = useState(existing?.competencyId ?? "");
  const [outcomes, setOutcomes] = useState<Record<string, string>>(Object.fromEntries((existing?.criteriaResults ?? []).map((r) => [r.id, r.outcome])));
  const emp = employees.find((e) => e.id === empId);
  const comp = competencies.find((c) => c.id === compId);
  const facs = facilities.filter((f) => emp?.facilityIds.includes(f.id));
  const preview = useMemo(() => {
    if (!comp) return null;
    if (comp.criteria.some((c) => !outcomes[c.id])) return null;
    if (comp.criteria.some((c) => c.critical && outcomes[c.id] === "NOT_MET")) return "FAIL";
    if (comp.criteria.some((c) => outcomes[c.id] === "NOT_MET")) return "NEEDS_REMEDIATION";
    return "PASS";
  }, [comp, outcomes]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ActionForm action={saveDraftAction} submitLabel="Save evaluation (draft)" pendingText="Saving…">
      {existing && <input type="hidden" name="assessmentId" value={existing.id} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Employee" name="employeeId">
          <Select id="employeeId" name="employeeId" value={empId} onChange={(e) => setEmpId(e.target.value)} required>
            <option value="" disabled>Select…</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.jobTitle}</option>)}
          </Select>
        </Field>
        <Field label="Facility" name="facilityId">
          <Select id="facilityId" name="facilityId" defaultValue={existing?.facilityId ?? ""} key={empId} required>
            <option value="" disabled>{emp ? "Select…" : "Choose an employee first"}</option>
            {facs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Field label="Skill checklist" name="competencyId">
          <Select id="competencyId" name="competencyId" value={compId} onChange={(e) => setCompId(e.target.value)} required>
            <option value="" disabled>Select…</option>
            {competencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Assessment date" name="assessedOn"><Input id="assessedOn" name="assessedOn" type="date" max={today} defaultValue={existing?.assessedOn ?? today} required /></Field>
      </div>
      {comp && (
        <div className="rounded-xl border border-slate-200">
          <div className="border-b border-slate-100 bg-navy-50/60 px-4 py-2 text-sm"><strong>{comp.name}</strong>{comp.description && <span className="text-slate-600"> — {comp.description}</span>}</div>
          <ol className="divide-y divide-slate-100">
            {comp.criteria.map((c, n) => (
              <li key={c.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto]">
                <div className="text-sm">
                  <span className="mr-1 text-slate-500">{n + 1}.</span>{c.text} {c.critical && <Badge tone="red">Critical</Badge>}
                  <Input name={`n_${c.id}`} aria-label={`Note for criterion ${n + 1}`} placeholder="Observation note (optional)" defaultValue={existing?.criteriaResults.find((r) => r.id === c.id)?.note ?? ""} className="mt-2 text-xs" />
                </div>
                <div className="flex items-start gap-1" role="radiogroup" aria-label={`Criterion ${n + 1} outcome`}>
                  {(["MET", "NOT_MET", "NA"] as const).map((o) => (
                    <label key={o} className={cn("cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-semibold", outcomes[c.id] === o ? (o === "MET" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : o === "NOT_MET" ? "border-red-600 bg-red-50 text-red-800" : "border-slate-500 bg-slate-100") : "border-slate-200 text-slate-600", o === "NA" && c.critical && "cursor-not-allowed opacity-40")}>
                      <input type="radio" className="sr-only" name={`c_${c.id}`} value={o} checked={outcomes[c.id] === o} disabled={o === "NA" && c.critical} onChange={() => setOutcomes((x) => ({ ...x, [c.id]: o }))} />
                      {o === "MET" ? "Met" : o === "NOT_MET" ? "Not met" : "N/A"}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      {preview && <Alert tone={preview === "PASS" ? "green" : preview === "FAIL" ? "red" : "amber"}>Derived result: <strong>{preview.replace("_", " ")}</strong>{preview !== "PASS" && " — describe the remediation required below."}</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Remediation required" name="remediationRequired"><Textarea id="remediationRequired" name="remediationRequired" rows={3} defaultValue={existing?.remediationRequired ?? ""} /></Field>
        <Field label="Evaluator comments" name="evaluatorComments"><Textarea id="evaluatorComments" name="evaluatorComments" rows={3} defaultValue={existing?.evaluatorComments ?? ""} /></Field>
        <Field label="Supporting evidence links" name="evidenceUrls" hint="https links, separated by spaces (no patient information)"><Input id="evidenceUrls" name="evidenceUrls" defaultValue={existing?.evidenceUrls.join(" ") ?? ""} /></Field>
        <Field label="Next assessment / follow-up date" name="nextAssessmentDue" hint="Optional; defaults from the checklist's renewal interval when set"><Input id="nextAssessmentDue" name="nextAssessmentDue" type="date" defaultValue={existing?.nextAssessmentDue ?? ""} /></Field>
      </div>
      <p className="text-xs text-slate-500">Saving creates a draft. Review it, then apply your electronic signature to make it an official record. Course completion never substitutes for this observed evaluation.</p>
    </ActionForm>
  );
}
