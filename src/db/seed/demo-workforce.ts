/**
 * DEMO workforce data for Sunshine Care Group (DEMO), created through the real services:
 *  - Four DEMO organizational-policy training requirements (clearly labeled DEMO).
 *  - Licenses: an RN license (verified), a phlebotomy certification expiring soon,
 *    and an unverified medical assistant certification.
 *  - Onboarding is run for every employee → assignments, deadlines, notifications.
 *  - One assignment is backdated to show the overdue/escalation path, then the daily
 *    renewal engine runs once (queued emails are delivered by the email job).
 * Idempotent: skipped when the tenant already has training requirements.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import { withTenant } from "../client";
import { competencies, courses, employees, tenants, trainingAssignments, trainingRequirements, users } from "../schema";
import { loadAccess } from "@/lib/rbac/access";
import { saveRequirement } from "@/lib/workforce/requirements";
import { saveLicense, verifyLicense } from "@/lib/workforce/licenses";
import { runOnboarding } from "@/lib/workforce/onboarding";
import { runRenewalEngine } from "@/lib/workforce/renewal";
import { addDays, todayIso } from "@/lib/workforce/rules";

export async function seedDemoWorkforce(sys: Db): Promise<string[]> {
  const done: string[] = [];
  const [t] = await sys.select().from(tenants).where(eq(tenants.slug, "demo-sunshine"));
  if (!t) return done;
  const [existing] = await sys.select({ id: trainingRequirements.id }).from(trainingRequirements).where(eq(trainingRequirements.tenantId, t.id)).limit(1);
  if (existing) return done;
  const [admin] = await sys.select().from(users).where(eq(users.email, "orgadmin@sunshine.example"));
  const course = async (code: string) => (await sys.select({ id: courses.id, status: courses.status }).from(courses).where(and(isNull(courses.tenantId), eq(courses.code, code))))[0];
  const [hh] = await sys.select({ id: competencies.id }).from(competencies).where(and(isNull(competencies.tenantId), eq(competencies.code, "COMP-HH")));
  const hipaa = await course("CHTA-MC-001");
  const bbp = await course("CHTA-MC-004");
  const sp = await course("CHTA-MC-006");
  const today = todayIso();

  await withTenant({ tenantId: t.id, userId: admin.id }, async (tx) => {
    const access = (await loadAccess(tx, t.id, admin.id))!;
    const ctx = { tenantId: t.id, userId: admin.id, access };
    const reqs = [
      hipaa?.status === "PUBLISHED" && { title: "DEMO policy: HIPAA privacy & security — all staff", target: "course", courseId: hipaa.id, source: "ORGANIZATIONAL_POLICY", positionCodes: "", dueWithinDaysOfHire: "30", frequencyMonths: "12", notes: "DEMO organizational policy for demonstration only — not a regulatory determination." },
      bbp?.status === "PUBLISHED" && { title: "DEMO policy: Bloodborne pathogens — exposed staff", target: "course", courseId: bbp.id, source: "ORGANIZATIONAL_POLICY", requiresBloodborneExposure: true, dueWithinDaysOfHire: "10", reminderLeadDays: "30, 14, 7, 1", notes: "DEMO organizational policy. Confirm OSHA 29 CFR 1910.1030 obligations in the Compliance Center." },
      sp?.status === "PUBLISHED" && { title: "DEMO policy: Standard precautions & PPE — clinical staff", target: "course", courseId: sp.id, source: "ORGANIZATIONAL_POLICY", requiresClinicalExposure: true, dueWithinDaysOfHire: "30" },
      hh && { title: "DEMO policy: Hand hygiene skills check — clinical staff", target: "competency", competencyId: hh.id, source: "ORGANIZATIONAL_POLICY", requiresClinicalExposure: true },
    ].filter(Boolean) as Record<string, unknown>[];
    for (const r of reqs) {
      const res = await saveRequirement(tx, ctx, r);
      if (!res.ok) throw new Error(`requirement: ${res.error} ${JSON.stringify(res.fieldErrors)}`);
    }
    done.push(`${reqs.length} DEMO organizational training requirements`);

    const emp = async (no: string) => (await tx.select().from(employees).where(eq(employees.employeeNumber, no)))[0];
    const leah = await emp("SCG-2001");
    const tanya = await emp("SCG-2003");
    const chris = await emp("SCG-2002");
    const l1 = await saveLicense(tx, ctx, leah.id, { kind: "STATE_PROFESSIONAL_LICENSE", name: "Registered Nurse (DEMO)", licenseNumber: "DEMO-RN-1234567", issuingAuthority: "Florida Board of Nursing", state: "FL", issuedOn: "2022-07-01", expiresOn: addDays(today, 200), notes: "DEMO record" });
    if (!l1.ok) throw new Error(l1.error);
    await verifyLicense(tx, ctx, l1.data.id, "VERIFIED", "DEMO — illustrative verification entry (no real lookup performed)");
    const l2 = await saveLicense(tx, ctx, tanya.id, { kind: "THIRD_PARTY_CERTIFICATION", name: "Phlebotomy Technician Certification (DEMO)", licenseNumber: "DEMO-PBT-55021", issuingAuthority: "DEMO certifying body", state: "", issuedOn: "2024-12-01", expiresOn: addDays(today, 20), notes: "DEMO record" });
    if (!l2.ok) throw new Error(l2.error);
    const l3 = await saveLicense(tx, ctx, chris.id, { kind: "THIRD_PARTY_CERTIFICATION", name: "Medical Assistant Certification (DEMO)", licenseNumber: "DEMO-MA-88310", issuingAuthority: "DEMO certifying body", state: "", issuedOn: "2025-05-15", expiresOn: addDays(today, 540) });
    if (!l3.ok) throw new Error(l3.error);
    done.push("3 DEMO licenses/certifications (one verified, one expiring in 20 days)");

    const all = await tx.select({ id: employees.id }).from(employees);
    let assigned = 0;
    for (const e of all) {
      const r = await runOnboarding(tx, ctx, e.id);
      if (!r.ok) throw new Error(r.error);
      assigned += r.data.assigned;
    }
    done.push(`Onboarding run for ${all.length} employees (${assigned} assignments created)`);
  });

  // Show the overdue/escalation path: backdate Samuel Brooks' HIPAA assignment (DEMO only).
  const [samuel] = await sys.select().from(employees).where(and(eq(employees.tenantId, t.id), eq(employees.employeeNumber, "SCG-1004")));
  if (samuel && hipaa) {
    await sys.update(trainingAssignments).set({ dueDate: addDays(today, -9) }).where(and(eq(trainingAssignments.employeeId, samuel.id), eq(trainingAssignments.courseId, hipaa.id)));
  }
  const s = await runRenewalEngine(sys);
  done.push(`Renewal engine: ${s.markedOverdue} overdue, ${s.dueReminders} reminders, ${s.licenseWarnings} license warnings, ${s.escalations} escalations`);
  return done;
}
