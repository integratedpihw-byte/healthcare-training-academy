/**
 * DEMO learning activity, created through the real services (so it obeys every rule):
 *  - Grace Kim (supervisor) completes HIPAA and passes the final exam → certificate.
 *  - Jordan Lee (learner) finishes every lesson of Standard Precautions → exam pending.
 *  - Grace signs a hand hygiene skills evaluation for Ana Morales.
 * Idempotent: skipped when Grace already has a HIPAA enrollment.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import { withTenant } from "../client";
import { competencies, courses, employees, enrollments, facilities, tenants, users } from "../schema";
import { LIBRARY } from "@/content";
import { enroll, getPlayer, recordProgress, submitKnowledgeCheck } from "@/lib/learning/learner";
import { applyExamOutcome, getAttempt, startAttempt, submitAttempt } from "@/lib/assessment/engine";
import { saveDraft, signAssessment } from "@/lib/competency/service";
import { loadAccess } from "@/lib/rbac/access";
import { DEMO_PASSWORD } from "./demo";

async function completeLessons(tenantId: string, userId: string, courseCode: string): Promise<string> {
  const content = LIBRARY.find((c) => c.code === courseCode)!;
  const answers = new Map(content.modules.flatMap((m) => m.lessons).filter((l) => l.type === "KNOWLEDGE_CHECK").map((l) => [l.title, Object.fromEntries((l.mediaMeta?.questions ?? []).map((q) => [q.id, q.correct]))]));
  return withTenant({ tenantId, userId }, async (tx) => {
    const [course] = await tx.select({ id: courses.id }).from(courses).where(and(isNull(courses.tenantId), eq(courses.code, courseCode)));
    const ctx = { tenantId, userId };
    const r = await enroll(tx, ctx, course.id);
    if (!r.ok) throw new Error(r.error);
    const p = (await getPlayer(tx, r.data.enrollmentId, userId))!;
    for (const l of p.flat) {
      const res = l.type === "KNOWLEDGE_CHECK"
        ? await submitKnowledgeCheck(tx, ctx, r.data.enrollmentId, l.id, answers.get(l.title)!)
        : await recordProgress(tx, ctx, { enrollmentId: r.data.enrollmentId, lessonId: l.id, secondsSpent: l.durationMinutes * 60, complete: true });
      if (!res.ok) throw new Error(res.error);
    }
    return r.data.enrollmentId;
  });
}

export async function seedDemoActivity(sys: Db): Promise<string[]> {
  const done: string[] = [];
  const [t] = await sys.select().from(tenants).where(eq(tenants.slug, "demo-sunshine"));
  if (!t) return done;
  const [grace] = await sys.select().from(users).where(eq(users.email, "supervisor@sunshine.example"));
  const [jordan] = await sys.select().from(users).where(eq(users.email, "learner@sunshine.example"));
  const [hipaa] = await sys.select().from(courses).where(and(isNull(courses.tenantId), eq(courses.code, "CHTA-MC-001")));
  if (!grace || !jordan || !hipaa) return done;
  const [existing] = await sys.select().from(enrollments).where(and(eq(enrollments.userId, grace.id), eq(enrollments.courseId, hipaa.id)));
  if (existing) return done;

  // 1) Grace: HIPAA lessons + exam with correct answers → completion + certificate
  const enrollmentId = await completeLessons(t.id, grace.id, "CHTA-MC-001");
  const content = LIBRARY.find((c) => c.code === "CHTA-MC-001")!;
  const key = new Map(content.finalExam.questions.map((q) => [q.prompt, q.correct]));
  const attemptId = await withTenant({ tenantId: t.id, userId: grace.id }, async (tx) => {
    const s = await startAttempt(tx, { tenantId: t.id, userId: grace.id }, enrollmentId);
    if (!s.ok) throw new Error(s.error);
    const a = (await getAttempt(tx, s.data.attemptId))!;
    const answers = Object.fromEntries(a.questions.map((q) => [q.id, key.get(q.prompt)]));
    const r = await submitAttempt(tx, { tenantId: t.id, userId: grace.id }, s.data.attemptId, answers);
    if (!r.ok) throw new Error(r.error);
    return s.data.attemptId;
  });
  const outcome = await applyExamOutcome(sys, attemptId);
  done.push(`Grace Kim passed HIPAA (certificate ${outcome.certificateId ? "issued" : "not issued"})`);

  // 2) Jordan: Standard Precautions lessons complete, exam pending
  await completeLessons(t.id, jordan.id, "CHTA-MC-006");
  done.push("Jordan Lee completed all Standard Precautions lessons (final exam pending)");

  // 3) Grace signs a hand hygiene evaluation for Ana Morales
  const [ana] = await sys.select().from(employees).where(and(eq(employees.tenantId, t.id), eq(employees.employeeNumber, "SCG-1003")));
  const [comp] = await sys.select().from(competencies).where(and(isNull(competencies.tenantId), eq(competencies.code, "COMP-HH")));
  const [fac] = await sys.select().from(facilities).where(eq(facilities.id, ana.primaryFacilityId!));
  await withTenant({ tenantId: t.id, userId: grace.id }, async (tx) => {
    const access = (await loadAccess(tx, t.id, grace.id))!;
    const ctx = { tenantId: t.id, userId: grace.id, access };
    const criteria = comp.criteria as { id: string }[];
    const d = await saveDraft(tx, ctx, {
      employeeId: ana.id,
      facilityId: fac.id,
      competencyId: comp.id,
      assessedOn: new Date().toISOString().slice(0, 10),
      criteriaResults: criteria.map((c) => ({ id: c.id, outcome: "MET" })),
      evaluatorComments: "DEMO record — observed during morning medication pass.",
      evidenceUrls: [],
    });
    if (!d.ok) throw new Error(d.error);
    const s = await signAssessment(tx, sys, ctx, d.data.id, { password: DEMO_PASSWORD, credentials: "Resident Care Supervisor (DEMO)", attest: true });
    if (!s.ok) throw new Error(s.error);
  });
  done.push("Grace Kim signed a hand hygiene evaluation for Ana Morales");
  return done;
}
