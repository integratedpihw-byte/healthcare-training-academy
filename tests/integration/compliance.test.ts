/**
 * Phase 5 — regulatory compliance engine: versioned platform rules, organization
 * decisions and mappings, applicability evaluation, snapshots, update notifications
 * and audit reports.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import { auditLogs, complianceSnapshots, courseCategories, employees, facilities, notifications, regulatoryRuleVersions, regulatoryRules, tenantRuleDecisions, trainingRequirements } from "@/db/schema";
import { addLesson, addModule, createCourse, decide, getBuilderCourse, setObjectives, submitForReview, type AuthorScope } from "@/lib/learning/builder";
import { enroll, getPlayer, recordProgress } from "@/lib/learning/learner";
import { issueForEnrollment } from "@/lib/certificates/service";
import { can, loadAccess } from "@/lib/rbac/access";
import { evaluateCompliance, facilityScope, mapRuleToTraining, recordDecision, snapshotCompliance } from "@/lib/compliance/service";
import { saveRule } from "@/lib/compliance/platform";
import { REPORTS } from "@/lib/reports/definitions";
import { toCsv, toPdf, toXlsx } from "@/lib/reports/export";
import { addMember, createTenant, expectPgError, platformAdmin, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
let director: { userId: string };
let reviewer: { userId: string };
let facAdmin: { userId: string };
let learner: { userId: string };
let courseId: string;
let clinicId: string;

const as = (userId: string) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: T.tenantId, userId }, fn);
async function ctxFor(userId: string) {
  return { tenantId: T.tenantId, userId, access: (await as(userId)((tx) => loadAccess(tx, T.tenantId, userId)))! };
}
async function scope<R>(userId: string, fn: (s: AuthorScope) => Promise<R>) {
  return as(userId)(async (tx) => {
    const access = await loadAccess(tx, T.tenantId, userId);
    return fn({ db: tx, tenantId: T.tenantId, userId, can: (p) => can(access, p) });
  });
}
const rule = async (citation: string) => (await systemDb().select().from(regulatoryRules).where(eq(regulatoryRules.citation, citation)))[0];

beforeAll(async () => {
  T = await createTenant("comp");
  director = await addMember(T, "training_director");
  reviewer = await addMember(T, "org_admin");
  facAdmin = await addMember(T, "facility_admin", T.facilityId);
  learner = await addMember(T, "learner");
  const sys = systemDb();
  [{ id: clinicId }] = await sys.insert(facilities).values({ tenantId: T.tenantId, organizationId: T.orgId, name: "Comp Clinic", facilityType: "CLINIC", state: "FL", designations: ["VFC_PROVIDER"] }).returning({ id: facilities.id });
  await sys.update(employees).set({ userId: learner.userId, bloodborneExposure: true, jobDuties: ["PERSONAL_CARE"] }).where(eq(employees.id, T.employeeId));
  // A published tenant course (no exam) to map rules to.
  const [cat] = await sys.select().from(courseCategories).where(eq(courseCategories.slug, "facility-programs"));
  const r = await scope(director.userId, (s) => createCourse(s, { code: "CMP-BBP", title: "Exposure control basics", categoryId: cat.id, passingScore: 80, estimatedMinutes: 30, renewalMonths: "12", description: "Course used by compliance integration tests.", targetAudience: "All", certificateEligible: true }));
  if (!r.ok) throw new Error(r.error);
  courseId = r.data.courseId;
  const b = (await scope(director.userId, (s) => getBuilderCourse(s, courseId)))!;
  await scope(director.userId, (s) => setObjectives(s, b.working.id, "Know the exposure control plan"));
  const m = await scope(director.userId, (s) => addModule(s, b.working.id, { title: "Module" }));
  if (!m.ok) throw new Error(m.error);
  await scope(director.userId, (s) => addLesson(s, m.data.id, { title: "Lesson", type: "TEXT", body: "Exposure control plan overview.", durationMinutes: 5 }));
  expect((await scope(director.userId, (s) => submitForReview(s, courseId))).ok).toBe(true);
  for (let i = 0; i < 3; i++) await scope(reviewer.userId, (s) => decide(s, courseId, { decision: "APPROVED", comments: "ok" }));
});
afterAll(() => closePools());

describe("platform regulatory library", () => {
  it("is seeded with cited Florida and federal rules; unverified rules assert no frequency", async () => {
    const rows = await systemDb().select().from(regulatoryRules);
    expect(rows.length).toBeGreaterThanOrEqual(30);
    expect(rows.filter((r) => r.complianceStatus === "NEEDS_REVIEW").every((r) => r.frequencyMonths === null)).toBe(true);
    const versions = await systemDb().select().from(regulatoryRuleVersions).where(eq(regulatoryRuleVersions.version, 1));
    expect(versions.length).toBe(rows.length);
  });

  it("refuses unverified frequencies, edits without a change summary, deletes and history tampering", async () => {
    const r = await rule("45 CFR 164.530(b)");
    const sys = systemDb();
    const f = await expectPgError(sys.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.change_summary', 'Testing frequency guard', true)`);
      await tx.update(regulatoryRules).set({ frequencyMonths: 12, frequencyVerified: false }).where(eq(regulatoryRules.id, r.id));
    }));
    expect(f.message).toMatch(/frequency/);
    const noSummary = await expectPgError(sys.update(regulatoryRules).set({ title: r.title }).where(eq(regulatoryRules.id, r.id)));
    expect(noSummary.message).toMatch(/change summary/);
    const del = await expectPgError(sys.delete(regulatoryRules).where(eq(regulatoryRules.id, r.id)));
    expect(del.message).toMatch(/never deleted/);
    const tamper = await expectPgError(sys.update(regulatoryRuleVersions).set({ changeSummary: "x" }).where(eq(regulatoryRuleVersions.ruleId, r.id)));
    expect(tamper.message).toMatch(/immutable/);
    // The application role cannot write platform rules at all.
    const app = await expectPgError(as(T.adminUserId)((tx) => tx.update(regulatoryRules).set({ title: "x" }).where(eq(regulatoryRules.id, r.id))));
    expect(app.code).toBe("42501");
  });
});

describe("organization decisions and mappings", () => {
  it("records decisions only with compliance.manage, stamps the rule version and keeps them immutable", async () => {
    const r = await rule("29 CFR 1910.1030(g)(2)");
    const denied = await as(facAdmin.userId)(async (tx) => recordDecision(tx, await ctxFor(facAdmin.userId), { ruleId: r.id, decision: "APPLICABLE", rationale: "Facility admin attempt" }));
    expect(denied.ok).toBe(false);
    const raw = await expectPgError(as(facAdmin.userId)((tx) => tx.insert(tenantRuleDecisions).values({ tenantId: T.tenantId, ruleId: r.id, decision: "APPLICABLE", rationale: "Direct insert attempt", ruleVersion: 1, decidedById: facAdmin.userId })));
    expect(raw.message).toMatch(/row-level security|permission/);
    const short = await as(T.adminUserId)(async (tx) => recordDecision(tx, await ctxFor(T.adminUserId), { ruleId: r.id, decision: "APPLICABLE", rationale: "short" }));
    expect(short.ok).toBe(false);
    const ok = await as(director.userId)(async (tx) => recordDecision(tx, await ctxFor(director.userId), { ruleId: r.id, decision: "APPLICABLE", rationale: "Direct care staff have occupational exposure." }));
    expect(ok.ok).toBe(true);
    const [d] = await systemDb().select().from(tenantRuleDecisions).where(and(eq(tenantRuleDecisions.tenantId, T.tenantId), eq(tenantRuleDecisions.ruleId, r.id)));
    expect(d.ruleVersion).toBe(r.version);
    const upd = await expectPgError(as(T.adminUserId)((tx) => tx.update(tenantRuleDecisions).set({ rationale: "Changed after the fact" }).where(eq(tenantRuleDecisions.id, d.id))));
    expect(upd.code).toBe("42501");
  });

  it("maps a rule to training with the rule's applicability; unverified rules are created for review", async () => {
    const r = await rule("29 CFR 1910.1030(g)(2)");
    const res = await as(T.adminUserId)(async (tx) => mapRuleToTraining(tx, await ctxFor(T.adminUserId), { ruleId: r.id, target: "course", courseId }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const [q] = await systemDb().select().from(trainingRequirements).where(eq(trainingRequirements.id, res.data.id));
    expect(q.source).toBe("FEDERAL_REGULATION");
    expect(q.regulatoryRuleId).toBe(r.id);
    expect(q.requiresBloodborneExposure).toBe(true);
    expect(q.frequencyMonths).toBe(12);
    expect(q.needsAdminReview).toBe(false);

    const vfc = await rule("CDC Vaccines for Children Program — provider requirements");
    const res2 = await as(T.adminUserId)(async (tx) => mapRuleToTraining(tx, await ctxFor(T.adminUserId), { ruleId: vfc.id, target: "course", courseId }));
    expect(res2.ok).toBe(true);
    if (res2.ok) {
      const [q2] = await systemDb().select().from(trainingRequirements).where(eq(trainingRequirements.id, res2.data.id));
      expect(q2.needsAdminReview).toBe(true);
      expect(q2.frequencyMonths).toBeNull();
    }
    // A requirement cannot claim to be a regulation without citing the rule.
    const e = await expectPgError(as(T.adminUserId)((tx) => tx.insert(trainingRequirements).values({ tenantId: T.tenantId, courseId, source: "STATE_REGULATION", title: "Uncited" })));
    expect(e.message).toMatch(/regulation_ck/);
  });
});

describe("applicability evaluation", () => {
  it("applies rules by state, facility type, designations, duties and exposure, and tracks staff status", async () => {
    let ev = await as(T.adminUserId)((tx) => evaluateCompliance(tx, T.tenantId));
    const alf = ev.facilities.find((f) => f.id === T.facilityId)!;
    const clinic = ev.facilities.find((f) => f.id === clinicId)!;
    const cites = (f: typeof alf) => f.rules.map((r) => r.rule.citation);
    expect(cites(alf)).toContain("Rule 59A-36.011(3)(f), F.A.C."); // ALF elopement
    expect(cites(clinic)).not.toContain("Rule 59A-36.011(3)(f), F.A.C.");
    expect(cites(clinic)).toContain("CDC Vaccines for Children Program — provider requirements"); // VFC designation
    expect(cites(alf)).not.toContain("42 CFR 482.15(d)(1)"); // hospital-only
    const bbp = alf.rules.find((r) => r.rule.citation === "29 CFR 1910.1030(g)(2)")!;
    expect(bbp.state).toBe("MAPPED");
    expect(alf.rules.find((r) => r.rule.citation === "Rule 59A-36.011(3)(f), F.A.C.")!.state).toBe("GAP"); // all staff
    expect(alf.rules.find((r) => r.rule.citation === "Rule 59A-36.011(3)(e), F.A.C.")!.state).toBe("NO_STAFF"); // nobody serves food
    expect(alf.rules.find((r) => r.rule.citation === "CDC Core Infection Prevention and Control Practices")!.state).toBe("NEEDS_REVIEW"); // unverified, staff in scope
    expect(clinic.rules.find((r) => r.rule.citation === "Rule 64B9-5.002, F.A.C.")!.state).toBe("NO_STAFF"); // no nurses at the clinic
    const item = alf.items.find((i) => i.employeeId === T.employeeId && i.ruleId === bbp.rule.id)!;
    expect(item.status).toBe("MISSING");

    // Complete the mapped course → satisfied until the earlier of certificate expiry / 12 months.
    const enrollmentId = await as(learner.userId)(async (tx) => {
      const e = await enroll(tx, { tenantId: T.tenantId, userId: learner.userId }, courseId);
      if (!e.ok) throw new Error(e.error);
      const p = (await getPlayer(tx, e.data.enrollmentId, learner.userId))!;
      for (const l of p.flat) await recordProgress(tx, { tenantId: T.tenantId, userId: learner.userId }, { enrollmentId: e.data.enrollmentId, lessonId: l.id, complete: true });
      return e.data.enrollmentId;
    });
    await issueForEnrollment(systemDb(), enrollmentId);
    ev = await as(T.adminUserId)((tx) => evaluateCompliance(tx, T.tenantId));
    const after = ev.facilities.find((f) => f.id === T.facilityId)!.items.find((i) => i.employeeId === T.employeeId && i.ruleId === bbp.rule.id)!;
    expect(after.status).toBe("SATISFIED");
    expect(after.validUntil).not.toBeNull();
    expect(ev.org.compliancePct).toBeGreaterThan(0);
  });

  it("documented not-applicable decisions remove a rule; facility scope limits what a facility admin sees", async () => {
    const r = await rule("Rule 59A-36.011(3)(e), F.A.C.");
    await as(T.adminUserId)(async (tx) => recordDecision(tx, await ctxFor(T.adminUserId), { ruleId: r.id, facilityId: T.facilityId, decision: "NOT_APPLICABLE", rationale: "Meals are provided by a licensed contractor; no staff prepare or serve food." }));
    const ev = await as(T.adminUserId)((tx) => evaluateCompliance(tx, T.tenantId));
    expect(ev.facilities.find((f) => f.id === T.facilityId)!.rules.find((x) => x.rule.id === r.id)!.state).toBe("NOT_APPLICABLE");
    const access = (await ctxFor(facAdmin.userId)).access;
    expect(facilityScope(access, "compliance.view", [T.facilityId, clinicId])).toEqual([T.facilityId]);
    expect(facilityScope((await ctxFor(T.adminUserId)).access, "compliance.view", [T.facilityId, clinicId])).toBeNull();
  });
});

describe("regulatory updates", () => {
  it("versions a rule change, flags decisions on the old version for re-review and notifies compliance managers", async () => {
    const r = await rule("29 CFR 1910.1030(g)(2)");
    const pa = await platformAdmin();
    const { id: _id, version: _v, createdAt: _c, updatedAt: _u, lastVerifiedAt, sourceId, ...rest } = r;
    const res = await saveRule(systemDb(), pa.id, { ...rest, sourceId, positionCodes: rest.positionCodes.join(","), suggestedCourseCodes: rest.suggestedCourseCodes.join(","), audienceText: rest.audienceText ?? "", frequencyMonths: rest.frequencyMonths ?? "", initialDueDaysFromHire: rest.initialDueDaysFromHire ?? "", effectiveDate: rest.effectiveDate ?? "", lastVerifiedOn: lastVerifiedAt!.toISOString().slice(0, 10), verificationNote: `${rest.verificationNote} Re-checked.`, changeSummary: "Re-verified against osha.gov; clarified the annual window." }, r.id);
    if (!res.ok) throw new Error(`${res.error} ${JSON.stringify(res.fieldErrors)}`);
    expect(res.data.version).toBe(r.version + 1);
    expect(res.data.notified).toBeGreaterThan(0);
    const notes = await systemDb().select().from(notifications).where(and(eq(notifications.tenantId, T.tenantId), eq(notifications.type, "compliance.rule_updated")));
    expect(notes.map((n) => n.userId)).toEqual(expect.arrayContaining([T.adminUserId, director.userId]));
    expect(notes.map((n) => n.userId)).not.toContain(learner.userId);
    const ev = await as(T.adminUserId)((tx) => evaluateCompliance(tx, T.tenantId));
    const fr = ev.facilities.find((f) => f.id === T.facilityId)!.rules.find((x) => x.rule.id === r.id)!;
    expect(fr.state).toBe("NEEDS_REVIEW");
    expect(fr.reReview).toBe(true);
    const audit = await systemDb().select().from(auditLogs).where(and(eq(auditLogs.action, "regulatory.rule_updated"), eq(auditLogs.entityId, r.id)));
    expect(audit).toHaveLength(1);
    expect(audit[0].tenantId).toBeNull();
    // Unverified frequencies are refused by the editor too.
    const bad = await saveRule(systemDb(), pa.id, { ...rest, sourceId, frequencyMonths: 6, frequencyVerified: false, positionCodes: "", suggestedCourseCodes: "", lastVerifiedOn: "2026-11-13", changeSummary: "Trying an unverified frequency" }, r.id);
    expect(bad.ok).toBe(false);
  });
});

describe("snapshots and audit reports", () => {
  it("records daily snapshots (platform job only)", async () => {
    const n = await snapshotCompliance(systemDb());
    expect(n).toBeGreaterThan(0);
    const rows = await as(T.adminUserId)((tx) => tx.select().from(complianceSnapshots));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.tenantId === T.tenantId)).toBe(true);
    const e = await expectPgError(as(T.adminUserId)((tx) => tx.insert(complianceSnapshots).values({ tenantId: T.tenantId, snapshotDate: "2026-01-01", applicable: 1, satisfied: 1, overdue: 0, gaps: 0, needsReview: 0 })));
    expect(e.code).toBe("42501");
  });

  it("runs every report and exports CSV, Excel and PDF", async () => {
    const ctx = await ctxFor(T.adminUserId);
    for (const def of REPORTS) {
      const r = await as(T.adminUserId)((tx) => def.run(tx, ctx, { employeeId: T.employeeId, days: 365 }));
      expect(r.columns.length, def.key).toBeGreaterThan(0);
    }
    const audit = await as(T.adminUserId)((tx) => REPORTS.find((r) => r.key === "regulatory-audit")!.run(tx, ctx, {}));
    expect(audit.rows.some((r) => String(r.citation).includes("1910.1030"))).toBe(true);
    const transcript = await as(T.adminUserId)((tx) => REPORTS.find((r) => r.key === "transcript")!.run(tx, ctx, { employeeId: T.employeeId }));
    expect(transcript.rows.some((r) => r.type === "Course" && r.result === "Completed")).toBe(true);
    expect(toCsv(audit)).toContain("Citation");
    expect((await toXlsx(audit, new Date(), "Org")).subarray(0, 2).toString()).toBe("PK");
    expect(Buffer.from(await toPdf(audit, new Date(), "Org")).subarray(0, 4).toString()).toBe("%PDF");
    // Facility admins only see their facility in compliance reports.
    const fa = await ctxFor(facAdmin.userId);
    const scoped = await as(facAdmin.userId)((tx) => REPORTS.find((r) => r.key === "org-compliance")!.run(tx, fa, {}));
    expect(scoped.rows.some((r) => r.facility === "Comp Clinic")).toBe(false);
  });
});
