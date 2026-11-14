/**
 * DEMO compliance setup for Sunshine Care Group (DEMO), through the real services:
 * facility designations and job duties, a few documented applicability decisions
 * (clearly labeled DEMO), regulation-to-course mappings, and one compliance snapshot.
 * Idempotent: skipped when the tenant already has decisions.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import { withTenant } from "../client";
import { courses, employees, facilities, regulatoryRules, tenantRuleDecisions, tenants, users } from "../schema";
import { loadAccess } from "@/lib/rbac/access";
import { mapRuleToTraining, recordDecision, snapshotCompliance } from "@/lib/compliance/service";

export async function seedDemoCompliance(sys: Db): Promise<string[]> {
  const done: string[] = [];
  const [t] = await sys.select().from(tenants).where(eq(tenants.slug, "demo-sunshine"));
  if (!t) return done;
  const [already] = await sys.select({ id: tenantRuleDecisions.id }).from(tenantRuleDecisions).where(eq(tenantRuleDecisions.tenantId, t.id)).limit(1);
  if (already) return done;
  const [admin] = await sys.select().from(users).where(eq(users.email, "orgadmin@sunshine.example"));

  // Facility designations and employee job duties (DEMO).
  const facs = await sys.select().from(facilities).where(eq(facilities.tenantId, t.id));
  const alf = facs.find((f) => f.facilityType === "ASSISTED_LIVING_FACILITY");
  const clinic = facs.find((f) => f.facilityType === "CLINIC");
  if (alf) await sys.update(facilities).set({ licenseType: "ALF_STANDARD", designations: ["ALF_STANDARD"] }).where(eq(facilities.id, alf.id));
  if (clinic) await sys.update(facilities).set({ designations: ["VFC_PROVIDER"] }).where(eq(facilities.id, clinic.id));
  const duties: Record<string, string[]> = {
    "SCG-1001": ["PERSONAL_CARE"],
    "SCG-1002": ["PERSONAL_CARE"],
    "SCG-1003": ["PERSONAL_CARE", "MEDICATION_ASSISTANCE"],
    "SCG-1004": ["FOOD_SERVICE"],
    "SCG-2001": ["PATIENT_INTERACTION", "VACCINE_COORDINATOR"],
    "SCG-2002": ["PATIENT_INTERACTION"],
    "SCG-2003": ["PATIENT_INTERACTION"],
    "SCG-2004": ["PATIENT_INTERACTION", "BILLING"],
  };
  for (const [no, d] of Object.entries(duties)) await sys.update(employees).set({ jobDuties: d }).where(and(eq(employees.tenantId, t.id), eq(employees.employeeNumber, no)));
  done.push("Facility designations (ALF standard license, VFC provider) and employee job duties");

  const rule = async (citation: string) => (await sys.select().from(regulatoryRules).where(eq(regulatoryRules.citation, citation)))[0];
  const libCourse = async (code: string) => (await sys.select({ id: courses.id, status: courses.status }).from(courses).where(and(isNull(courses.tenantId), eq(courses.code, code))))[0];

  await withTenant({ tenantId: t.id, userId: admin.id }, async (tx) => {
    const access = (await loadAccess(tx, t.id, admin.id))!;
    const ctx = { tenantId: t.id, userId: admin.id, access };
    const decisions: [string, "APPLICABLE" | "NOT_APPLICABLE" | "UNDER_REVIEW", string, string | null][] = [
      ["45 CFR 164.530(b)", "APPLICABLE", "DEMO: Sunshine bills health plans electronically for clinic services and is a HIPAA covered entity (DEMO rationale).", null],
      ["29 CFR 1910.1030(g)(2)", "APPLICABLE", "DEMO: direct care, nursing and phlebotomy staff have occupational exposure (DEMO rationale).", null],
      ["45 CFR 92.9", "UNDER_REVIEW", "DEMO: counsel is reviewing current enforceability of the 2024 Section 1557 rule (DEMO rationale).", null],
      ["42 CFR 483.95(a)–(f), (i)", "NOT_APPLICABLE", "DEMO: no Medicare/Medicaid-certified nursing facility is operated (DEMO rationale).", null],
    ];
    for (const [citation, decision, rationale, facilityId] of decisions) {
      const r = await rule(citation);
      if (!r) continue;
      const res = await recordDecision(tx, ctx, { ruleId: r.id, facilityId: facilityId ?? "", decision, rationale });
      if (!res.ok) throw new Error(`decision ${citation}: ${res.error}`);
    }
    done.push(`${decisions.length} DEMO applicability decisions`);

    const maps: [string, "course" | "competency", string | undefined][] = [
      ["45 CFR 164.530(b)", "course", (await libCourse("CHTA-MC-001"))?.id],
      ["29 CFR 1910.1030(g)(2)", "course", (await libCourse("CHTA-MC-004"))?.id],
      ["Rule 59A-36.011(3)(a), F.A.C.", "course", (await libCourse("CHTA-MC-006"))?.id],
    ];
    let mapped = 0;
    for (const [citation, target, id] of maps) {
      const r = await rule(citation);
      if (!r || !id) continue;
      const res = await mapRuleToTraining(tx, ctx, { ruleId: r.id, target, courseId: id, notes: "DEMO mapping — confirm the course content satisfies the rule." });
      if (res.ok) mapped++;
    }
    done.push(`${mapped} DEMO regulation-to-course mappings`);
  });
  const n = await snapshotCompliance(sys);
  done.push(`Compliance snapshot recorded (${n} rows)`);
  return done;
}
