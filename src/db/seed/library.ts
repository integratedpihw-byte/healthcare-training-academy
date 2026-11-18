/**
 * Seeds the platform course library (global courses, tenant_id NULL) from src/content.
 * Idempotent: a course code that already exists is skipped — content changes after
 * the first load go through the versioning workflow, never silent overwrites.
 * New library versions start IN_REVIEW and must pass the approval workflow.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  courseApprovals,
  courseCategories,
  courseVersions,
  courses,
  examinations,
  learningObjectives,
  lessons,
  modules,
  questionBanks,
  questions,
} from "../schema";
import { AUTHOR_NOTE, LIBRARY, type CourseContent } from "@/content";

export async function seedLibrary(db: Db): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  for (const c of LIBRARY) {
    const [existing] = await db.select({ id: courses.id }).from(courses).where(and(isNull(courses.tenantId), eq(courses.code, c.code)));
    if (existing) {
      skipped.push(c.code);
      continue;
    }
    await db.transaction(async (tx) => insertCourse(tx as unknown as Db, c));
    created.push(c.code);
  }
  // Course-level labels (not lesson content) follow the library so existing courses
  // pick up a corrected program type; content itself changes only through versioning.
  // A classification backed by a recorded approval is never overwritten.
  for (const c of LIBRARY) {
    await db
      .update(courses)
      .set({ programClassification: c.programClassification ?? "GENERAL_EDUCATION", certificateType: c.certificateType ?? "COURSE_COMPLETION" })
      .where(and(isNull(courses.tenantId), eq(courses.code, c.code), sql`${courses.programClassification}::text not in ('STATE_APPROVED_PROGRAM', 'CONTINUING_EDUCATION')`, sql`(${courses.programClassification}::text, ${courses.certificateType}::text) is distinct from (${c.programClassification ?? "GENERAL_EDUCATION"}, ${c.certificateType ?? "COURSE_COMPLETION"})`));
  }
  return { created, skipped };
}

async function insertCourse(tx: Db, c: CourseContent) {
  const [cat] = await tx.select({ id: courseCategories.id }).from(courseCategories).where(and(isNull(courseCategories.tenantId), eq(courseCategories.slug, c.categorySlug)));
  if (!cat) throw new Error(`Unknown category ${c.categorySlug} for ${c.code}`);
  const [course] = await tx
    .insert(courses)
    .values({
      code: c.code,
      title: c.title,
      categoryId: cat.id,
      status: "IN_REVIEW",
      isRequiredByDefault: c.isRequiredByDefault,
      certificateEligible: c.certificateEligible,
      passingScore: c.passingScore,
      renewalMonths: c.renewalMonths,
      estimatedMinutes: c.estimatedMinutes,
      programClassification: c.programClassification ?? "GENERAL_EDUCATION",
      certificateType: c.certificateType ?? "COURSE_COMPLETION",
    })
    .returning({ id: courses.id });
  const [version] = await tx
    .insert(courseVersions)
    .values({
      courseId: course.id,
      versionNumber: 1,
      status: "IN_REVIEW",
      description: c.description,
      targetAudience: c.targetAudience,
      prerequisites: c.prerequisites,
      regulatoryReferences: c.regulatoryReferences,
      sourceReferences: [...c.sourceReferences, ...(c.renewalBasis ? [{ title: "Renewal basis", publisher: "CHITA", note: c.renewalBasis }] : [])],
      completionCriteria: c.completionCriteria,
      authorName: AUTHOR_NOTE,
      clinicalReviewRequired: c.clinicalReviewRequired,
      credentialNotice: c.credentialNotice ?? null,
      renewalRequirements: c.renewalRequirements ?? null,
      instructorResources: c.instructorResources ?? null,
      revisedAt: new Date(),
    })
    .returning({ id: courseVersions.id });
  await tx.insert(learningObjectives).values(c.objectives.map((text, i) => ({ courseVersionId: version.id, sortOrder: i + 1, text })));
  for (const [mi, m] of c.modules.entries()) {
    const [mod] = await tx.insert(modules).values({ courseVersionId: version.id, sortOrder: mi + 1, title: m.title, summary: m.summary }).returning({ id: modules.id });
    await tx.insert(lessons).values(
      m.lessons.map((l, li) => ({
        moduleId: mod.id,
        sortOrder: li + 1,
        title: l.title,
        type: l.type,
        body: l.body ?? "",
        mediaUrl: l.mediaUrl ?? null,
        mediaMeta: l.mediaMeta ?? null,
        durationMinutes: l.durationMinutes,
        isRequired: l.isRequired ?? true,
      })),
    );
  }
  // Final exam: question bank + mandatory examination on version 1 (before publication,
  // since published versions are frozen).
  const [bank] = await tx.insert(questionBanks).values({ courseId: course.id, name: c.finalExam.title }).returning({ id: questionBanks.id });
  await tx.insert(questions).values(
    c.finalExam.questions.map((q) => ({
      bankId: bank.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctAnswer: q.correct,
      explanation: q.explanation,
      difficulty: q.difficulty ?? 2,
    })),
  );
  await tx.insert(examinations).values({
    courseVersionId: version.id,
    questionBankId: bank.id,
    title: c.finalExam.title,
    isFinal: true,
    isMandatory: true,
    passingScore: c.finalExam.passingScore,
    questionCount: Math.min(c.finalExam.questionCount, c.finalExam.questions.length),
    randomize: true,
    maxAttempts: 3,
  });
}

/**
 * DEMO ONLY: moves IN_REVIEW library courses through the approval chain so demo
 * learners can use them. Every approval is recorded with an explicit note that no
 * qualified review took place. Never run in production.
 */
export async function demoPublishLibrary(db: Db, platformAdminId: string): Promise<string[]> {
  const pending = await db
    .select({ courseId: courses.id, code: courses.code, versionId: courseVersions.id, clinical: courseVersions.clinicalReviewRequired })
    .from(courses)
    .innerJoin(courseVersions, eq(courseVersions.courseId, courses.id))
    .where(and(isNull(courses.tenantId), eq(courseVersions.status, "IN_REVIEW")));
  const published: string[] = [];
  for (const p of pending) {
    await db.transaction(async (tx) => {
      const note = "DEMO auto-approval for demonstration only — NOT a qualified subject-matter or clinical review.";
      const stages: ("REVIEW" | "CLINICAL_APPROVAL" | "COMPLIANCE_APPROVAL" | "PUBLISH")[] = ["REVIEW", ...(p.clinical ? (["CLINICAL_APPROVAL"] as const) : []), "COMPLIANCE_APPROVAL", "PUBLISH"];
      for (const stage of stages) {
        await tx.insert(courseApprovals).values({ courseVersionId: p.versionId, stage, decision: "APPROVED", reviewerUserId: platformAdminId, comments: note, reviewerCredentials: "DEMO" });
      }
      await tx.update(courseVersions).set({ status: "PUBLISHED", reviewerName: "DEMO — pending qualified review" }).where(eq(courseVersions.id, p.versionId));
      await tx.update(courses).set({ status: "PUBLISHED", currentVersionId: p.versionId }).where(eq(courses.id, p.courseId));
    });
    published.push(p.code);
  }
  return published;
}
