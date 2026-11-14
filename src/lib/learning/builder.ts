/**
 * Course builder and content approval workflow (no-code authoring).
 *
 * Works in two scopes with identical rules:
 *  - TENANT scope: organization-specific courses (tenant_id = tenant), RLS-scoped tx,
 *    permissions from the user's tenant roles.
 *  - PLATFORM scope: master-library courses (tenant_id NULL), system client,
 *    available to platform super administrators.
 *
 * Workflow: Draft → Review → [Clinical Approval] → Compliance Approval → Published → Archived.
 * Published versions are frozen by database triggers; editing a published course
 * creates a new draft version (full version history).
 */
import { and, asc, desc, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import {
  courseApprovals,
  courseCategories,
  courseVersions,
  courses,
  examinations,
  learningObjectives,
  lessons,
  modules,
  questions,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { PermissionKey } from "@/lib/rbac/catalog";
import type { ServiceResult } from "@/lib/tenancy/service";
import type { CheckQuestion } from "@/content/types";

export interface AuthorScope {
  db: Db | Tx;
  tenantId: string | null;
  userId: string;
  can: (p: PermissionKey) => boolean;
}

const LESSON_TYPES = ["TEXT", "PRESENTATION", "VIDEO", "ILLUSTRATION", "INTERACTIVE", "CASE_STUDY", "KNOWLEDGE_CHECK", "DOWNLOAD"] as const;
const EDITABLE = ["DRAFT"] as const;

const err = (error: string): ServiceResult<never> => ({ ok: false, error });
const fieldErr = (e: z.ZodError): ServiceResult<never> => ({ ok: false, error: "Please correct the highlighted fields.", fieldErrors: e.flatten().fieldErrors as Record<string, string[]> });

/** Course rows the scope may manage (tenant: own courses; platform: global courses). */
function ownCourse(scope: AuthorScope) {
  return scope.tenantId ? eq(courses.tenantId, scope.tenantId) : isNull(courses.tenantId);
}

async function audit(scope: AuthorScope, action: string, entityType: string, entityId: string, after?: unknown) {
  await writeAudit(scope.db, { tenantId: scope.tenantId, actorUserId: scope.userId, action, entityType, entityId, after });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listManagedCourses(scope: AuthorScope) {
  return scope.db
    .select({
      id: courses.id,
      code: courses.code,
      title: courses.title,
      status: courses.status,
      category: courseCategories.name,
      updatedAt: courses.updatedAt,
      latestVersion: sql<number>`(select max(v.version_number)::int from course_versions v where v.course_id = "courses"."id")`,
      latestStatus: sql<string>`(select v.status::text from course_versions v where v.course_id = "courses"."id" order by v.version_number desc limit 1)`,
      publishedVersion: sql<number | null>`(select v.version_number from course_versions v where v.id = "courses"."current_version_id")`,
    })
    .from(courses)
    .innerJoin(courseCategories, eq(courseCategories.id, courses.categoryId))
    .where(ownCourse(scope))
    .orderBy(asc(courses.code));
}

export async function getBuilderCourse(scope: AuthorScope, courseId: string) {
  const [course] = await scope.db.select().from(courses).where(and(eq(courses.id, courseId), ownCourse(scope)));
  if (!course) return null;
  const versions = await scope.db.select().from(courseVersions).where(eq(courseVersions.courseId, courseId)).orderBy(desc(courseVersions.versionNumber));
  const working = versions[0];
  const objectives = await scope.db.select().from(learningObjectives).where(eq(learningObjectives.courseVersionId, working.id)).orderBy(asc(learningObjectives.sortOrder));
  const mods = await scope.db.select().from(modules).where(eq(modules.courseVersionId, working.id)).orderBy(asc(modules.sortOrder));
  const less = mods.length
    ? await scope.db.select().from(lessons).where(inArray(lessons.moduleId, mods.map((m) => m.id))).orderBy(asc(lessons.sortOrder))
    : [];
  const approvals = await scope.db
    .select()
    .from(courseApprovals)
    .where(inArray(courseApprovals.courseVersionId, versions.map((v) => v.id)))
    .orderBy(desc(courseApprovals.decidedAt));
  return {
    course,
    versions,
    working,
    objectives,
    modules: mods.map((m) => ({ ...m, lessons: less.filter((l) => l.moduleId === m.id) })),
    approvals,
    nextStage: nextStage(working, approvals.filter((a) => a.courseVersionId === working.id)),
  };
}

export async function getBuilderLesson(scope: AuthorScope, lessonId: string) {
  const [row] = await scope.db
    .select({ lesson: lessons, module: modules, version: courseVersions, course: courses })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courseVersions, eq(courseVersions.id, modules.courseVersionId))
    .innerJoin(courses, eq(courses.id, courseVersions.courseId))
    .where(and(eq(lessons.id, lessonId), ownCourse(scope)));
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Course and version metadata
// ---------------------------------------------------------------------------

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(min).max(max).nullable());

export const courseSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{2,29}$/, "Use 3–30 letters, numbers or dashes"),
  title: z.string().trim().min(3).max(200),
  categoryId: z.string().uuid("Choose a category"),
  isRequiredByDefault: z.coerce.boolean().default(false),
  certificateEligible: z.coerce.boolean().default(true),
  passingScore: z.coerce.number().int().min(50).max(100),
  renewalMonths: optionalInt(1, 120),
  estimatedMinutes: z.coerce.number().int().min(5).max(2400),
});

export const versionSchema = z.object({
  description: z.string().trim().min(20, "Write at least a short description").max(5000),
  targetAudience: z.string().trim().min(3).max(1000),
  prerequisites: z.string().max(500).default(""),
  completionCriteria: z.string().trim().max(2000).default(""),
  clinicalReviewRequired: z.coerce.boolean().default(false),
  regulatoryReferences: z.string().max(10000).default(""),
  sourceReferences: z.string().max(10000).default(""),
});

/** "Agency | Citation | Title | URL" per line → objects. */
export function parseRefs(text: string, keys: string[]): Record<string, string>[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      return Object.fromEntries(keys.map((k, i) => [k, parts[i] ?? ""]));
    });
}
export const REG_KEYS = ["agency", "citation", "title", "url"];
export const SRC_KEYS = ["title", "publisher", "url", "publishedOn", "accessedOn"];
export function refsToText(refs: unknown, keys: string[]): string {
  return Array.isArray(refs) ? refs.map((r) => keys.map((k) => (r as Record<string, string>)[k] ?? "").join(" | ")).join("\n") : "";
}

export async function createCourse(scope: AuthorScope, raw: Record<string, unknown>): Promise<ServiceResult<{ courseId: string }>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const c = courseSchema.safeParse(raw);
  if (!c.success) return fieldErr(c.error);
  const v = versionSchema.safeParse(raw);
  if (!v.success) return fieldErr(v.error);
  const [cat] = await scope.db.select({ id: courseCategories.id }).from(courseCategories).where(eq(courseCategories.id, c.data.categoryId));
  if (!cat) return err("Category not found.");
  const [dupe] = await scope.db.select({ id: courses.id }).from(courses).where(and(eq(courses.code, c.data.code), ownCourse(scope)));
  if (dupe) return { ok: false, error: "A course with this code already exists.", fieldErrors: { code: ["Already in use"] } };

  const [course] = await scope.db.insert(courses).values({ ...c.data, tenantId: scope.tenantId, status: "DRAFT" }).returning({ id: courses.id });
  await scope.db.insert(courseVersions).values({
    tenantId: scope.tenantId,
    courseId: course.id,
    versionNumber: 1,
    status: "DRAFT",
    description: v.data.description,
    targetAudience: v.data.targetAudience,
    prerequisites: splitList(v.data.prerequisites),
    completionCriteria: v.data.completionCriteria || null,
    clinicalReviewRequired: v.data.clinicalReviewRequired,
    regulatoryReferences: parseRefs(v.data.regulatoryReferences, REG_KEYS),
    sourceReferences: parseRefs(v.data.sourceReferences, SRC_KEYS),
    authorUserId: scope.userId,
  });
  await audit(scope, "course.created", "course", course.id, { code: c.data.code, title: c.data.title });
  return { ok: true, data: { courseId: course.id } };
}

const splitList = (s: string) => s.split(/[,\n]/).map((x) => x.trim().toUpperCase()).filter(Boolean);

export async function updateCourse(scope: AuthorScope, courseId: string, raw: Record<string, unknown>): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const b = await getBuilderCourse(scope, courseId);
  if (!b) return err("Course not found.");
  const c = courseSchema.safeParse({ ...raw, code: b.course.currentVersionId ? b.course.code : raw.code });
  if (!c.success) return fieldErr(c.error);
  await scope.db.update(courses).set(c.data).where(eq(courses.id, courseId));
  if (b.working.status === "DRAFT") {
    const v = versionSchema.safeParse(raw);
    if (!v.success) return fieldErr(v.error);
    await scope.db
      .update(courseVersions)
      .set({
        description: v.data.description,
        targetAudience: v.data.targetAudience,
        prerequisites: splitList(v.data.prerequisites),
        completionCriteria: v.data.completionCriteria || null,
        clinicalReviewRequired: v.data.clinicalReviewRequired,
        regulatoryReferences: parseRefs(v.data.regulatoryReferences, REG_KEYS),
        sourceReferences: parseRefs(v.data.sourceReferences, SRC_KEYS),
      })
      .where(eq(courseVersions.id, b.working.id));
  }
  await audit(scope, "course.updated", "course", courseId, c.data);
  return { ok: true, data: null };
}

async function draftVersion(scope: AuthorScope, versionId: string) {
  const [v] = await scope.db
    .select({ v: courseVersions })
    .from(courseVersions)
    .innerJoin(courses, eq(courses.id, courseVersions.courseId))
    .where(and(eq(courseVersions.id, versionId), ownCourse(scope)));
  if (!v) return { error: "Version not found." } as const;
  if (!(EDITABLE as readonly string[]).includes(v.v.status)) return { error: "Only draft versions can be edited. Create a new version or request changes." } as const;
  return { version: v.v } as const;
}

export async function setObjectives(scope: AuthorScope, versionId: string, text: string): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const d = await draftVersion(scope, versionId);
  if ("error" in d) return err(d.error!);
  const items = text.split("\n").map((s) => s.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
  if (items.length === 0) return err("Add at least one learning objective.");
  if (items.length > 20 || items.some((i) => i.length > 400)) return err("Up to 20 objectives of 400 characters each.");
  await scope.db.delete(learningObjectives).where(eq(learningObjectives.courseVersionId, versionId));
  await scope.db.insert(learningObjectives).values(items.map((t, i) => ({ tenantId: scope.tenantId, courseVersionId: versionId, sortOrder: i + 1, text: t })));
  return { ok: true, data: null };
}

// ---------------------------------------------------------------------------
// Modules and lessons
// ---------------------------------------------------------------------------

export const moduleSchema = z.object({ title: z.string().trim().min(2).max(200), summary: z.string().trim().max(1000).optional().or(z.literal("")) });

export async function addModule(scope: AuthorScope, versionId: string, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const d = await draftVersion(scope, versionId);
  if ("error" in d) return err(d.error!);
  const p = moduleSchema.safeParse(raw);
  if (!p.success) return fieldErr(p.error);
  const [{ n }] = await scope.db.select({ n: max(modules.sortOrder) }).from(modules).where(eq(modules.courseVersionId, versionId));
  const [m] = await scope.db
    .insert(modules)
    .values({ tenantId: scope.tenantId, courseVersionId: versionId, sortOrder: (n ?? 0) + 1, title: p.data.title, summary: p.data.summary || null })
    .returning({ id: modules.id });
  return { ok: true, data: { id: m.id } };
}

async function moduleInDraft(scope: AuthorScope, moduleId: string) {
  const [m] = await scope.db.select().from(modules).where(eq(modules.id, moduleId));
  if (!m) return { error: "Module not found." } as const;
  const d = await draftVersion(scope, m.courseVersionId);
  if ("error" in d) return { error: d.error } as const;
  return { module: m } as const;
}

export async function updateModule(scope: AuthorScope, moduleId: string, raw: unknown): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const m = await moduleInDraft(scope, moduleId);
  if ("error" in m) return err(m.error!);
  const p = moduleSchema.safeParse(raw);
  if (!p.success) return fieldErr(p.error);
  await scope.db.update(modules).set({ title: p.data.title, summary: p.data.summary || null }).where(eq(modules.id, moduleId));
  return { ok: true, data: null };
}

export async function deleteModule(scope: AuthorScope, moduleId: string): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const m = await moduleInDraft(scope, moduleId);
  if ("error" in m) return err(m.error!);
  await scope.db.delete(modules).where(eq(modules.id, moduleId));
  await resequence(scope, "modules", m.module.courseVersionId);
  return { ok: true, data: null };
}

export async function moveModule(scope: AuthorScope, moduleId: string, dir: "up" | "down"): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const m = await moduleInDraft(scope, moduleId);
  if ("error" in m) return err(m.error!);
  const siblings = await scope.db.select().from(modules).where(eq(modules.courseVersionId, m.module.courseVersionId)).orderBy(asc(modules.sortOrder));
  await swap(scope, siblings, moduleId, dir, (id, sortOrder) => scope.db.update(modules).set({ sortOrder }).where(eq(modules.id, id)));
  return { ok: true, data: null };
}

async function swap<T extends { id: string; sortOrder: number }>(_scope: AuthorScope, list: T[], id: string, dir: "up" | "down", set: (id: string, s: number) => Promise<unknown>) {
  const i = list.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  await set(list[i].id, j + 1);
  await set(list[j].id, i + 1);
}

async function resequence(scope: AuthorScope, kind: "modules" | "lessons", parentId: string) {
  if (kind === "modules") {
    const list = await scope.db.select({ id: modules.id }).from(modules).where(eq(modules.courseVersionId, parentId)).orderBy(asc(modules.sortOrder));
    for (const [i, r] of list.entries()) await scope.db.update(modules).set({ sortOrder: i + 1 }).where(eq(modules.id, r.id));
  } else {
    const list = await scope.db.select({ id: lessons.id }).from(lessons).where(eq(lessons.moduleId, parentId)).orderBy(asc(lessons.sortOrder));
    for (const [i, r] of list.entries()) await scope.db.update(lessons).set({ sortOrder: i + 1 }).where(eq(lessons.id, r.id));
  }
}

const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((u) => {
    try {
      return new URL(u).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a secure https:// link");

export const lessonSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    type: z.enum(LESSON_TYPES),
    body: z.string().max(100_000).default(""),
    mediaUrl: httpsUrl.or(z.string().regex(/^\/api\/files\/[0-9a-f-]{36}$/i, "Use a secure https:// link or an uploaded file")).optional().or(z.literal("")),
    durationMinutes: z.coerce.number().int().min(1).max(600),
    videoDurationSeconds: optionalInt(1, 36_000),
    isRequired: z.coerce.boolean().default(true),
    questionsJson: z.string().max(50_000).optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    if ((v.type === "VIDEO" || v.type === "DOWNLOAD") && !v.mediaUrl) ctx.addIssue({ code: "custom", path: ["mediaUrl"], message: "A media link is required for this lesson type" });
    if (v.type === "VIDEO" && !v.videoDurationSeconds && !isEmbed(v.mediaUrl ?? "")) ctx.addIssue({ code: "custom", path: ["videoDurationSeconds"], message: "Enter the video length so watch progress can be verified" });
    if (["TEXT", "CASE_STUDY", "PRESENTATION", "ILLUSTRATION"].includes(v.type) && v.body.trim().length < 10) ctx.addIssue({ code: "custom", path: ["body"], message: "Add lesson content" });
  });

export function isEmbed(url: string) {
  return /^https:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|player\.vimeo\.com|vimeo\.com)\//.test(url);
}

export const checkQuestionSchema = z.array(
  z.object({
    id: z.string().min(1).max(20),
    prompt: z.string().min(3).max(1000),
    options: z.array(z.object({ id: z.string().min(1).max(10), text: z.string().min(1).max(500) })).min(2).max(8),
    correct: z.union([z.string(), z.array(z.string()).min(1)]),
    explanation: z.string().min(3).max(2000),
  }),
).min(1).max(20);

function lessonValues(p: z.infer<typeof lessonSchema>): ServiceResult<{ mediaMeta: Record<string, unknown> | null }> {
  if (p.type === "KNOWLEDGE_CHECK") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(p.questionsJson || "[]");
    } catch {
      return { ok: false, error: "Knowledge check questions are not valid JSON.", fieldErrors: { questionsJson: ["Invalid JSON"] } };
    }
    const q = checkQuestionSchema.safeParse(parsed);
    if (!q.success) return { ok: false, error: "Each question needs an id, prompt, 2–8 options, a correct answer and an explanation.", fieldErrors: { questionsJson: q.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) } };
    for (const item of q.data as CheckQuestion[]) {
      const ids = new Set(item.options.map((o) => o.id));
      const correct = Array.isArray(item.correct) ? item.correct : [item.correct];
      if (!correct.every((c) => ids.has(c))) return { ok: false, error: `Question "${item.id}": the correct answer must match an option id.` };
    }
    return { ok: true, data: { mediaMeta: { questions: q.data } } };
  }
  if (p.type === "VIDEO") return { ok: true, data: { mediaMeta: p.videoDurationSeconds ? { durationSeconds: p.videoDurationSeconds } : {} } };
  return { ok: true, data: { mediaMeta: null } };
}

export async function addLesson(scope: AuthorScope, moduleId: string, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const m = await moduleInDraft(scope, moduleId);
  if ("error" in m) return err(m.error!);
  const p = lessonSchema.safeParse(raw);
  if (!p.success) return fieldErr(p.error);
  const extra = lessonValues(p.data);
  if (!extra.ok) return extra;
  const [{ n }] = await scope.db.select({ n: max(lessons.sortOrder) }).from(lessons).where(eq(lessons.moduleId, moduleId));
  const [l] = await scope.db
    .insert(lessons)
    .values({
      tenantId: scope.tenantId,
      moduleId,
      sortOrder: (n ?? 0) + 1,
      title: p.data.title,
      type: p.data.type,
      body: p.data.body,
      mediaUrl: p.data.mediaUrl || null,
      mediaMeta: extra.data.mediaMeta,
      durationMinutes: p.data.durationMinutes,
      isRequired: p.data.isRequired,
    })
    .returning({ id: lessons.id });
  return { ok: true, data: { id: l.id } };
}

export async function updateLesson(scope: AuthorScope, lessonId: string, raw: unknown): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const row = await getBuilderLesson(scope, lessonId);
  if (!row) return err("Lesson not found.");
  if (row.version.status !== "DRAFT") return err("Only draft versions can be edited.");
  const p = lessonSchema.safeParse(raw);
  if (!p.success) return fieldErr(p.error);
  const extra = lessonValues(p.data);
  if (!extra.ok) return extra;
  await scope.db
    .update(lessons)
    .set({ title: p.data.title, type: p.data.type, body: p.data.body, mediaUrl: p.data.mediaUrl || null, mediaMeta: extra.data.mediaMeta, durationMinutes: p.data.durationMinutes, isRequired: p.data.isRequired })
    .where(eq(lessons.id, lessonId));
  return { ok: true, data: null };
}

export async function deleteLesson(scope: AuthorScope, lessonId: string): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const row = await getBuilderLesson(scope, lessonId);
  if (!row) return err("Lesson not found.");
  if (row.version.status !== "DRAFT") return err("Only draft versions can be edited.");
  await scope.db.delete(lessons).where(eq(lessons.id, lessonId));
  await resequence(scope, "lessons", row.module.id);
  return { ok: true, data: null };
}

export async function moveLesson(scope: AuthorScope, lessonId: string, dir: "up" | "down"): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const row = await getBuilderLesson(scope, lessonId);
  if (!row) return err("Lesson not found.");
  if (row.version.status !== "DRAFT") return err("Only draft versions can be edited.");
  const siblings = await scope.db.select().from(lessons).where(eq(lessons.moduleId, row.module.id)).orderBy(asc(lessons.sortOrder));
  await swap(scope, siblings, lessonId, dir, (id, sortOrder) => scope.db.update(lessons).set({ sortOrder }).where(eq(lessons.id, id)));
  return { ok: true, data: null };
}

// ---------------------------------------------------------------------------
// Approval workflow
// ---------------------------------------------------------------------------

type Stage = "REVIEW" | "CLINICAL_APPROVAL" | "COMPLIANCE_APPROVAL" | "PUBLISH";
const STAGE_PERMISSION: Record<Stage, PermissionKey> = {
  REVIEW: "courses.review",
  CLINICAL_APPROVAL: "courses.approve.clinical",
  COMPLIANCE_APPROVAL: "courses.approve.compliance",
  PUBLISH: "courses.publish",
};
export const STAGE_LABEL: Record<Stage, string> = {
  REVIEW: "Editorial review",
  CLINICAL_APPROVAL: "Clinical approval",
  COMPLIANCE_APPROVAL: "Compliance approval",
  PUBLISH: "Publish",
};

/** Next stage for a version, computed from approvals recorded since its latest submission. */
export function nextStage(
  version: { status: string; clinicalReviewRequired: boolean; revisedAt: Date | null },
  approvals: { stage: string; decision: string; decidedAt: Date }[],
): Stage | null {
  if (version.status !== "IN_REVIEW" && version.status !== "CLINICAL_APPROVED" && version.status !== "COMPLIANCE_APPROVED") return null;
  const since = version.revisedAt?.getTime() ?? 0;
  const ok = (s: Stage) => approvals.some((a) => a.stage === s && a.decision === "APPROVED" && a.decidedAt.getTime() >= since);
  if (!ok("REVIEW")) return "REVIEW";
  if (version.clinicalReviewRequired && !ok("CLINICAL_APPROVAL")) return "CLINICAL_APPROVAL";
  if (!ok("COMPLIANCE_APPROVAL")) return "COMPLIANCE_APPROVAL";
  return "PUBLISH";
}

export async function submitForReview(scope: AuthorScope, courseId: string): Promise<ServiceResult<null>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const b = await getBuilderCourse(scope, courseId);
  if (!b) return err("Course not found.");
  if (b.working.status !== "DRAFT") return err("Only drafts can be submitted for review.");
  const problems: string[] = [];
  if (b.objectives.length === 0) problems.push("add learning objectives");
  if (b.modules.length === 0) problems.push("add at least one module");
  if (b.modules.some((m) => m.lessons.length === 0)) problems.push("every module needs at least one lesson");
  const exams = await scope.db.select().from(examinations).where(eq(examinations.courseVersionId, b.working.id));
  for (const x of exams) {
    const [{ n }] = await scope.db.select({ n: sql<number>`count(*)::int` }).from(questions).where(and(eq(questions.bankId, x.questionBankId), eq(questions.isActive, true)));
    if (n === 0) problems.push("the final examination needs active questions");
  }
  if (problems.length) return err(`Before submitting: ${problems.join("; ")}.`);
  await scope.db.update(courseVersions).set({ status: "IN_REVIEW", revisedAt: sql`now()` }).where(eq(courseVersions.id, b.working.id));
  await scope.db.update(courses).set({ status: b.course.currentVersionId ? b.course.status : "IN_REVIEW" }).where(eq(courses.id, courseId));
  await audit(scope, "course.submitted_for_review", "course_version", b.working.id, { versionNumber: b.working.versionNumber });
  return { ok: true, data: null };
}

export const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "CHANGES_REQUESTED", "REJECTED"]),
  comments: z.string().trim().max(2000).optional().or(z.literal("")),
  reviewerCredentials: z.string().trim().max(200).optional().or(z.literal("")),
});

/**
 * Records a decision for the version's next stage. Separation of duties: the author
 * cannot perform editorial review or clinical approval of their own version.
 * Clinical approval requires the reviewer's credentials (e.g. "RN, FL License #…").
 */
export async function decide(scope: AuthorScope, courseId: string, raw: unknown): Promise<ServiceResult<{ status: string }>> {
  const b = await getBuilderCourse(scope, courseId);
  if (!b) return err("Course not found.");
  const stage = b.nextStage;
  if (!stage) return err("This version is not awaiting a decision.");
  if (!scope.can(STAGE_PERMISSION[stage])) return err(`You do not have permission for ${STAGE_LABEL[stage].toLowerCase()}.`);
  const p = decisionSchema.safeParse(raw);
  if (!p.success) return fieldErr(p.error);
  const d = p.data;
  if (stage === "PUBLISH" && d.decision !== "APPROVED") return err("Use 'request changes' at an approval stage instead.");
  if ((stage === "REVIEW" || stage === "CLINICAL_APPROVAL") && b.working.authorUserId === scope.userId) {
    return err("Separation of duties: authors cannot review or clinically approve their own content.");
  }
  if (stage === "CLINICAL_APPROVAL" && d.decision === "APPROVED" && !d.reviewerCredentials) {
    return { ok: false, error: "Enter your clinical credentials (license type and number).", fieldErrors: { reviewerCredentials: ["Required for clinical approval"] } };
  }
  if (d.decision !== "APPROVED" && !d.comments) return { ok: false, error: "Explain what needs to change.", fieldErrors: { comments: ["Required"] } };

  await scope.db.insert(courseApprovals).values({
    tenantId: scope.tenantId,
    courseVersionId: b.working.id,
    stage,
    decision: d.decision,
    reviewerUserId: scope.userId,
    reviewerCredentials: d.reviewerCredentials || null,
    comments: d.comments || null,
  });

  let status: string;
  if (d.decision !== "APPROVED") {
    status = "DRAFT";
    await scope.db.update(courseVersions).set({ status: "DRAFT" }).where(eq(courseVersions.id, b.working.id));
  } else if (stage === "PUBLISH") {
    status = "PUBLISHED";
    const previous = b.course.currentVersionId;
    if (previous) await scope.db.update(courseVersions).set({ status: "ARCHIVED" }).where(eq(courseVersions.id, previous));
    await scope.db.update(courseVersions).set({ status: "PUBLISHED" }).where(eq(courseVersions.id, b.working.id)); // DB trigger verifies the approval chain
    await scope.db.update(courses).set({ status: "PUBLISHED", currentVersionId: b.working.id }).where(eq(courses.id, courseId));
  } else {
    status = stage === "CLINICAL_APPROVAL" ? "CLINICAL_APPROVED" : stage === "COMPLIANCE_APPROVAL" ? "COMPLIANCE_APPROVED" : "IN_REVIEW";
    await scope.db.update(courseVersions).set({ status: status as "IN_REVIEW" }).where(eq(courseVersions.id, b.working.id));
  }
  await audit(scope, `course.${stage.toLowerCase()}.${d.decision.toLowerCase()}`, "course_version", b.working.id, { stage, decision: d.decision, comments: d.comments || null });
  return { ok: true, data: { status } };
}

/** Copies the latest version into a new DRAFT (objectives, modules, lessons). */
export async function createNewVersion(scope: AuthorScope, courseId: string): Promise<ServiceResult<{ versionId: string }>> {
  if (!scope.can("courses.author")) return err("You do not have permission to author courses.");
  const b = await getBuilderCourse(scope, courseId);
  if (!b) return err("Course not found.");
  if (!["PUBLISHED", "ARCHIVED"].includes(b.working.status)) return err("Finish or withdraw the current draft before starting a new version.");
  const src = b.working;
  const [v] = await scope.db
    .insert(courseVersions)
    .values({
      tenantId: scope.tenantId,
      courseId,
      versionNumber: src.versionNumber + 1,
      status: "DRAFT",
      description: src.description,
      targetAudience: src.targetAudience,
      prerequisites: src.prerequisites,
      regulatoryReferences: src.regulatoryReferences,
      sourceReferences: src.sourceReferences,
      completionCriteria: src.completionCriteria,
      clinicalReviewRequired: src.clinicalReviewRequired,
      authorUserId: scope.userId,
    })
    .returning({ id: courseVersions.id });
  if (b.objectives.length) {
    await scope.db.insert(learningObjectives).values(b.objectives.map((o) => ({ tenantId: scope.tenantId, courseVersionId: v.id, sortOrder: o.sortOrder, text: o.text })));
  }
  for (const m of b.modules) {
    const [nm] = await scope.db.insert(modules).values({ tenantId: scope.tenantId, courseVersionId: v.id, sortOrder: m.sortOrder, title: m.title, summary: m.summary }).returning({ id: modules.id });
    if (m.lessons.length) {
      await scope.db.insert(lessons).values(
        m.lessons.map((l) => ({ tenantId: scope.tenantId, moduleId: nm.id, sortOrder: l.sortOrder, title: l.title, type: l.type, body: l.body, mediaUrl: l.mediaUrl, mediaMeta: l.mediaMeta, durationMinutes: l.durationMinutes, isRequired: l.isRequired })),
      );
    }
  }
  const exams = await scope.db.select().from(examinations).where(eq(examinations.courseVersionId, src.id));
  if (exams.length) {
    await scope.db.insert(examinations).values(
      exams.map((x) => ({ tenantId: scope.tenantId, courseVersionId: v.id, questionBankId: x.questionBankId, title: x.title, isFinal: x.isFinal, isMandatory: x.isMandatory, passingScore: x.passingScore, questionCount: x.questionCount, randomize: x.randomize, maxAttempts: x.maxAttempts, timeLimitMinutes: x.timeLimitMinutes })),
    );
  }
  await audit(scope, "course.version_created", "course_version", v.id, { versionNumber: src.versionNumber + 1, from: src.id });
  return { ok: true, data: { versionId: v.id } };
}

/** Archives a published course: hidden from the catalog; enrolled learners keep their pinned version. */
export async function archiveCourse(scope: AuthorScope, courseId: string): Promise<ServiceResult<null>> {
  if (!scope.can("courses.publish")) return err("You do not have permission to archive courses.");
  const b = await getBuilderCourse(scope, courseId);
  if (!b) return err("Course not found.");
  if (b.course.status !== "PUBLISHED") return err("Only published courses can be archived.");
  await scope.db.update(courses).set({ status: "ARCHIVED" }).where(eq(courses.id, courseId));
  await audit(scope, "course.archived", "course", courseId);
  return { ok: true, data: null };
}

export async function listCategories(db: Db | Tx) {
  return db.select().from(courseCategories).orderBy(asc(courseCategories.sortOrder));
}
