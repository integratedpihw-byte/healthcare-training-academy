/**
 * Learner-side LMS services: catalog, course detail, enrollment, the course player,
 * lesson progress, bookmarks, knowledge checks, resume and course feedback.
 * Every function runs inside an RLS-scoped tenant transaction (withTenant).
 */
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import {
  courseCategories,
  courseReviews,
  courseVersions,
  courses,
  enrollments,
  examinations,
  learningObjectives,
  lessonProgress,
  lessons,
  modules,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { ServiceResult } from "@/lib/tenancy/service";
import type { CheckQuestion } from "@/content/types";

export interface Ctx {
  tenantId: string;
  userId: string;
}

const OPEN = ["NOT_STARTED", "IN_PROGRESS", "AWAITING_ASSESSMENT"] as const;

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const catalogFilterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  department: z.string().max(40).optional(),
  required: z.enum(["1"]).optional(),
});

export async function listCatalog(tx: Tx, userId: string, filter: z.infer<typeof catalogFilterSchema> = {}) {
  const conds = [eq(courses.status, "PUBLISHED"), sql`${courses.currentVersionId} is not null`];
  if (filter.q) conds.push(or(ilike(courses.title, `%${filter.q}%`), ilike(courses.code, `%${filter.q}%`))!);
  if (filter.department) conds.push(sql`${courseCategories.department}::text = ${filter.department}`);
  if (filter.required) conds.push(eq(courses.isRequiredByDefault, true));

  const rows = await tx
    .select({
      id: courses.id,
      code: courses.code,
      title: courses.title,
      isGlobal: sql<boolean>`${courses.tenantId} is null`,
      isRequired: courses.isRequiredByDefault,
      certificateEligible: courses.certificateEligible,
      estimatedMinutes: courses.estimatedMinutes,
      renewalMonths: courses.renewalMonths,
      category: courseCategories.name,
      department: courseCategories.department,
      description: courseVersions.description,
      versionNumber: courseVersions.versionNumber,
      lessonCount: sql<number>`(select count(*)::int from lessons l join modules m on m.id = l.module_id where m.course_version_id = "courses"."current_version_id")`,
    })
    .from(courses)
    .innerJoin(courseCategories, eq(courseCategories.id, courses.categoryId))
    .innerJoin(courseVersions, eq(courseVersions.id, courses.currentVersionId))
    .where(and(...conds))
    .orderBy(asc(courseCategories.sortOrder), asc(courses.code));

  const ids = rows.map((r) => r.id);
  const mine = ids.length
    ? await tx
        .select({ id: enrollments.id, courseId: enrollments.courseId, status: enrollments.status, progressPct: enrollments.progressPct, completedAt: enrollments.completedAt })
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), inArray(enrollments.courseId, ids)))
        .orderBy(desc(enrollments.createdAt))
    : [];
  const byCourse = new Map<string, (typeof mine)[number]>();
  for (const e of mine) if (!byCourse.has(e.courseId)) byCourse.set(e.courseId, e);
  return rows.map((r) => ({ ...r, enrollment: byCourse.get(r.id) ?? null }));
}

export async function getCourseDetail(tx: Tx, courseId: string, userId: string) {
  const [c] = await tx
    .select({ course: courses, version: courseVersions, category: courseCategories.name, department: courseCategories.department })
    .from(courses)
    .innerJoin(courseCategories, eq(courseCategories.id, courses.categoryId))
    .innerJoin(courseVersions, eq(courseVersions.id, courses.currentVersionId))
    .where(and(eq(courses.id, courseId), eq(courses.status, "PUBLISHED")));
  if (!c) return null;
  const objectives = await tx.select().from(learningObjectives).where(eq(learningObjectives.courseVersionId, c.version.id)).orderBy(asc(learningObjectives.sortOrder));
  const outline = await outlineFor(tx, c.version.id);
  const [enrollment] = await tx
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .orderBy(desc(enrollments.createdAt))
    .limit(1);
  const [rating] = await tx
    .select({ avg: sql<number | null>`round(avg(${courseReviews.rating})::numeric, 1)::float`, n: sql<number>`count(*)::int` })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId));
  return { ...c, objectives, outline, enrollment: enrollment ?? null, rating };
}

export async function outlineFor(tx: Tx, versionId: string) {
  const mods = await tx.select().from(modules).where(eq(modules.courseVersionId, versionId)).orderBy(asc(modules.sortOrder));
  const less = mods.length
    ? await tx
        .select({ id: lessons.id, moduleId: lessons.moduleId, title: lessons.title, type: lessons.type, durationMinutes: lessons.durationMinutes, isRequired: lessons.isRequired, sortOrder: lessons.sortOrder })
        .from(lessons)
        .where(inArray(lessons.moduleId, mods.map((m) => m.id)))
        .orderBy(asc(lessons.sortOrder))
    : [];
  return mods.map((m) => ({ ...m, lessons: less.filter((l) => l.moduleId === m.id) }));
}

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------

/** Enroll (or return the existing open enrollment). Pins the learner to the current version. */
export async function enroll(tx: Tx, ctx: Ctx, courseId: string, assignmentId?: string | null): Promise<ServiceResult<{ enrollmentId: string; created: boolean }>> {
  const [c] = await tx
    .select({ id: courses.id, versionId: courses.currentVersionId, status: courses.status, title: courses.title })
    .from(courses)
    .where(eq(courses.id, courseId));
  if (!c || c.status !== "PUBLISHED" || !c.versionId) return { ok: false, error: "This course is not available for enrollment." };

  const [open] = await tx
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, courseId), inArray(enrollments.status, [...OPEN])));
  if (open) return { ok: true, data: { enrollmentId: open.id, created: false } };

  // Prerequisites are stored as course codes; each must have a completed enrollment.
  const [v] = await tx.select({ prerequisites: courseVersions.prerequisites }).from(courseVersions).where(eq(courseVersions.id, c.versionId));
  if (v?.prerequisites.length) {
    const done = await tx
      .select({ code: courses.code })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.status, "COMPLETED"), inArray(courses.code, v.prerequisites)));
    const missing = v.prerequisites.filter((p) => !done.some((d) => d.code === p));
    if (missing.length) return { ok: false, error: `Complete the prerequisite course(s) first: ${missing.join(", ")}.` };
  }

  const [e] = await tx
    .insert(enrollments)
    .values({ tenantId: ctx.tenantId, userId: ctx.userId, courseId, courseVersionId: c.versionId, assignmentId: assignmentId ?? null })
    .returning({ id: enrollments.id });
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "enrollment.created", entityType: "enrollment", entityId: e.id, after: { courseId, versionId: c.versionId } });
  return { ok: true, data: { enrollmentId: e.id, created: true } };
}

export async function myLearning(tx: Tx, userId: string) {
  const rows = await tx
    .select({
      id: enrollments.id,
      status: enrollments.status,
      progressPct: enrollments.progressPct,
      startedAt: enrollments.startedAt,
      completedAt: enrollments.completedAt,
      updatedAt: enrollments.updatedAt,
      courseId: courses.id,
      code: courses.code,
      title: courses.title,
      estimatedMinutes: courses.estimatedMinutes,
      versionNumber: courseVersions.versionNumber,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(courseVersions, eq(courseVersions.id, enrollments.courseVersionId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.updatedAt));
  const bookmarks = await tx
    .select({ enrollmentId: lessonProgress.enrollmentId, lessonId: lessons.id, lessonTitle: lessons.title, courseTitle: courses.title })
    .from(lessonProgress)
    .innerJoin(enrollments, eq(enrollments.id, lessonProgress.enrollmentId))
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(enrollments.userId, userId), eq(lessonProgress.bookmarked, true)))
    .orderBy(asc(courses.title));
  return { enrollments: rows, bookmarks };
}

// ---------------------------------------------------------------------------
// Player and progress
// ---------------------------------------------------------------------------

export async function getPlayer(tx: Tx, enrollmentId: string, userId: string) {
  const [row] = await tx
    .select({ e: enrollments, course: courses, version: courseVersions })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(courseVersions, eq(courseVersions.id, enrollments.courseVersionId))
    .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, userId)));
  if (!row) return null;
  const outline = await outlineFor(tx, row.version.id);
  const progress = await tx.select().from(lessonProgress).where(eq(lessonProgress.enrollmentId, enrollmentId));
  const flat = outline.flatMap((m) => m.lessons);
  const done = new Set(progress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId));
  const resumeLessonId =
    (row.e.lastLessonId && flat.some((l) => l.id === row.e.lastLessonId) ? row.e.lastLessonId : null) ??
    flat.find((l) => !done.has(l.id))?.id ??
    flat[0]?.id ??
    null;
  const exams = await tx.select({ id: examinations.id, title: examinations.title, isMandatory: examinations.isMandatory }).from(examinations).where(eq(examinations.courseVersionId, row.version.id));
  return { ...row, outline, flat, progress: new Map(progress.map((p) => [p.lessonId, p])), resumeLessonId, exams };
}

export async function getLesson(tx: Tx, versionId: string, lessonId: string) {
  const [l] = await tx
    .select({ lesson: lessons, moduleTitle: modules.title })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(and(eq(lessons.id, lessonId), eq(modules.courseVersionId, versionId)));
  return l ?? null;
}

async function ownedEnrollment(tx: Tx, ctx: Ctx, enrollmentId: string) {
  const [e] = await tx.select().from(enrollments).where(and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, ctx.userId)));
  return e ?? null;
}

const VIDEO_COMPLETE_RATIO = 0.9;

export const progressSchema = z.object({
  enrollmentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  secondsSpent: z.number().int().min(0).max(3600).default(0),
  videoPositionS: z.number().int().min(0).max(36_000).optional(),
  videoDurationS: z.number().int().min(0).max(36_000).optional(),
  complete: z.boolean().default(false),
});

/**
 * Records time on a lesson, video position (resume), and completion. Completion rules:
 *  - VIDEO: requires a reported position ≥ 90% of the video's duration.
 *  - KNOWLEDGE_CHECK: completed only via submitKnowledgeCheck() with all answers correct.
 *  - other types: completed when the learner marks it complete.
 */
export async function recordProgress(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<{ lessonCompleted: boolean; enrollmentStatus: string; progressPct: number }>> {
  const p = progressSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Invalid progress update." };
  const v = p.data;
  const e = await ownedEnrollment(tx, ctx, v.enrollmentId);
  if (!e) return { ok: false, error: "Enrollment not found." };
  if (e.status === "COMPLETED" || e.status === "WITHDRAWN") {
    return { ok: true, data: { lessonCompleted: true, enrollmentStatus: e.status, progressPct: e.progressPct } };
  }
  const l = await getLesson(tx, e.courseVersionId, v.lessonId);
  if (!l) return { ok: false, error: "Lesson not found in this course." };

  let complete = v.complete;
  if (complete && l.lesson.type === "KNOWLEDGE_CHECK") complete = false;
  if (complete && l.lesson.type === "VIDEO") {
    const duration = (l.lesson.mediaMeta as { durationSeconds?: number } | null)?.durationSeconds ?? v.videoDurationS ?? 0;
    complete = duration > 0 && (v.videoPositionS ?? 0) >= duration * VIDEO_COMPLETE_RATIO;
    if (!complete) return { ok: false, error: "Watch at least 90% of the video to complete this lesson." };
  }
  await upsertProgress(tx, ctx, e.id, v.lessonId, { secondsDelta: v.secondsSpent, videoPositionS: v.videoPositionS, complete });
  const r = await recomputeEnrollment(tx, ctx, e.id, v.lessonId);
  return { ok: true, data: { lessonCompleted: complete, ...r } };
}

async function upsertProgress(tx: Tx, ctx: Ctx, enrollmentId: string, lessonId: string, u: { secondsDelta: number; videoPositionS?: number; complete: boolean }) {
  const now = new Date();
  await tx
    .insert(lessonProgress)
    .values({
      tenantId: ctx.tenantId,
      enrollmentId,
      lessonId,
      status: u.complete ? "COMPLETED" : "IN_PROGRESS",
      secondsSpent: u.secondsDelta,
      videoPositionS: u.videoPositionS ?? 0,
      completedAt: u.complete ? now : null,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
      set: {
        secondsSpent: sql`${lessonProgress.secondsSpent} + ${u.secondsDelta}`,
        ...(u.videoPositionS !== undefined ? { videoPositionS: sql`greatest(${lessonProgress.videoPositionS}, ${u.videoPositionS})` } : {}),
        ...(u.complete
          ? { status: "COMPLETED" as const, completedAt: sql`coalesce(${lessonProgress.completedAt}, now())` }
          : { status: sql`case when ${lessonProgress.status} = 'COMPLETED' then 'COMPLETED'::progress_status else 'IN_PROGRESS'::progress_status end` }),
      },
    });
}

/** Recomputes progress % and status; completes the enrollment when allowed (DB re-validates). */
async function recomputeEnrollment(tx: Tx, ctx: Ctx, enrollmentId: string, lastLessonId?: string) {
  const [e] = await tx.select().from(enrollments).where(eq(enrollments.id, enrollmentId));
  const [{ total, done }] = await tx.execute<{ total: number; done: number }>(sql`
    select count(*)::int as total,
           count(p.id) filter (where p.status = 'COMPLETED')::int as done
      from lessons l join modules m on m.id = l.module_id
      left join lesson_progress p on p.lesson_id = l.id and p.enrollment_id = ${enrollmentId}
     where m.course_version_id = ${e.courseVersionId} and l.is_required`).then((r) => r.rows);
  const pct = total === 0 ? 100 : Math.floor((done / total) * 100);
  const [{ n: mandatoryExams }] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(examinations)
    .where(and(eq(examinations.courseVersionId, e.courseVersionId), eq(examinations.isMandatory, true)));

  let status = e.status;
  if (done >= total) status = mandatoryExams > 0 ? "AWAITING_ASSESSMENT" : "COMPLETED";
  else status = "IN_PROGRESS";

  await tx
    .update(enrollments)
    .set({ progressPct: pct, status, startedAt: e.startedAt ?? new Date(), lastLessonId: lastLessonId ?? e.lastLessonId })
    .where(eq(enrollments.id, enrollmentId));
  if (status === "COMPLETED" && e.status !== "COMPLETED") {
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "enrollment.completed", entityType: "enrollment", entityId: enrollmentId, after: { courseId: e.courseId, versionId: e.courseVersionId } });
  }
  return { enrollmentStatus: status, progressPct: status === "COMPLETED" ? 100 : pct };
}

/** Grades a formative knowledge check server-side; the lesson completes when every answer is correct. */
export async function submitKnowledgeCheck(
  tx: Tx,
  ctx: Ctx,
  enrollmentId: string,
  lessonId: string,
  answers: Record<string, string | string[]>,
): Promise<ServiceResult<{ results: { id: string; correct: boolean; explanation: string }[]; allCorrect: boolean; enrollmentStatus: string }>> {
  const e = await ownedEnrollment(tx, ctx, enrollmentId);
  if (!e) return { ok: false, error: "Enrollment not found." };
  const l = await getLesson(tx, e.courseVersionId, lessonId);
  if (!l || l.lesson.type !== "KNOWLEDGE_CHECK") return { ok: false, error: "Knowledge check not found." };
  const qs = ((l.lesson.mediaMeta as { questions?: CheckQuestion[] } | null)?.questions ?? []);
  const results = qs.map((q) => ({ id: q.id, correct: isCorrect(q.correct, answers[q.id]), explanation: q.explanation }));
  const allCorrect = results.length > 0 && results.every((r) => r.correct);
  if (e.status === "COMPLETED") return { ok: true, data: { results, allCorrect, enrollmentStatus: e.status } };
  await upsertProgress(tx, ctx, e.id, lessonId, { secondsDelta: 0, complete: allCorrect });
  const r = await recomputeEnrollment(tx, ctx, e.id, lessonId);
  return { ok: true, data: { results, allCorrect, enrollmentStatus: r.enrollmentStatus } };
}

export function isCorrect(expected: string | string[], given: string | string[] | undefined): boolean {
  if (given === undefined) return false;
  const a = (Array.isArray(expected) ? expected : [expected]).slice().sort();
  const b = (Array.isArray(given) ? given : [given]).slice().sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export async function toggleBookmark(tx: Tx, ctx: Ctx, enrollmentId: string, lessonId: string): Promise<ServiceResult<{ bookmarked: boolean }>> {
  const e = await ownedEnrollment(tx, ctx, enrollmentId);
  if (!e) return { ok: false, error: "Enrollment not found." };
  if (!(await getLesson(tx, e.courseVersionId, lessonId))) return { ok: false, error: "Lesson not found." };
  const [row] = await tx
    .insert(lessonProgress)
    .values({ tenantId: ctx.tenantId, enrollmentId, lessonId, bookmarked: true })
    .onConflictDoUpdate({ target: [lessonProgress.enrollmentId, lessonProgress.lessonId], set: { bookmarked: sql`not ${lessonProgress.bookmarked}` } })
    .returning({ bookmarked: lessonProgress.bookmarked });
  return { ok: true, data: { bookmarked: row.bookmarked } };
}

export const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional() });

export async function submitCourseReview(tx: Tx, ctx: Ctx, courseId: string, raw: unknown): Promise<ServiceResult<null>> {
  const p = reviewSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Choose a rating from 1 to 5." };
  const [done] = await tx
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, courseId), ne(enrollments.status, "NOT_STARTED")));
  if (!done) return { ok: false, error: "You can rate a course after you start it." };
  await tx
    .insert(courseReviews)
    .values({ tenantId: ctx.tenantId, courseId, userId: ctx.userId, rating: p.data.rating, comment: p.data.comment || null })
    .onConflictDoUpdate({ target: [courseReviews.tenantId, courseReviews.courseId, courseReviews.userId], set: { rating: p.data.rating, comment: p.data.comment || null } });
  return { ok: true, data: null };
}

