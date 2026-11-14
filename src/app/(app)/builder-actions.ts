"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requireFeature, requirePlatformAdmin, requireTenant } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import {
  addLesson,
  addModule,
  archiveCourse,
  createCourse,
  createNewVersion,
  decide,
  deleteLesson,
  deleteModule,
  moveLesson,
  moveModule,
  setObjectives,
  submitForReview,
  updateCourse,
  updateLesson,
  updateModule,
  type AuthorScope,
} from "@/lib/learning/builder";
import type { ServiceResult } from "@/lib/tenancy/service";
import { addQuestion, parseQuestionForm, saveExamSettings, setQuestionActive, updateQuestion } from "@/lib/assessment/authoring";


type Kind = "tenant" | "platform";
const BASE: Record<Kind, string> = { tenant: "/catalog/manage", platform: "/platform/courses" };

/** Builds the authoring scope and runs `fn` in one transaction (tenant: RLS; platform: system role). */
async function withScope<T>(kindRaw: FormDataEntryValue | null, fn: (s: AuthorScope) => Promise<T>): Promise<T> {
  const kind = kindRaw === "platform" ? "platform" : "tenant";
  if (kind === "platform") {
    const ctx = await requirePlatformAdmin();
    return systemDb().transaction((tx) => fn({ db: tx, tenantId: null, userId: ctx.user.id, can: () => true }));
  }
  const ctx = await requireTenant();
  requireFeature(ctx, "customCourses");
  return ctx.tx((tx) => fn({ db: tx, tenantId: ctx.tenant.id, userId: ctx.user.id, can: ctx.can }));
}

const kindOf = (fd: FormData): Kind => (fd.get("scope") === "platform" ? "platform" : "tenant");
const id = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "");
  return /^[0-9a-f-]{36}$/i.test(v) ? v : "";
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

function toState<T>(r: ServiceResult<T>, fd: FormData, message: string): FormState {
  return r.ok ? { ok: true, message } : { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
}

function courseInput(fd: FormData) {
  return {
    code: fd.get("code"),
    title: fd.get("title"),
    categoryId: fd.get("categoryId"),
    isRequiredByDefault: bool(fd, "isRequiredByDefault"),
    certificateEligible: bool(fd, "certificateEligible"),
    passingScore: fd.get("passingScore"),
    renewalMonths: fd.get("renewalMonths"),
    estimatedMinutes: fd.get("estimatedMinutes"),
    description: fd.get("description"),
    targetAudience: fd.get("targetAudience"),
    prerequisites: fd.get("prerequisites") ?? "",
    completionCriteria: fd.get("completionCriteria") ?? "",
    clinicalReviewRequired: bool(fd, "clinicalReviewRequired"),
    regulatoryReferences: fd.get("regulatoryReferences") ?? "",
    sourceReferences: fd.get("sourceReferences") ?? "",
  };
}

export async function createCourseAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await withScope(fd.get("scope"), (s) => createCourse(s, courseInput(fd)));
  if (!r.ok) return toState(r, fd, "");
  redirect(`${BASE[kindOf(fd)]}/${r.data.courseId}?created=1`);
}

export async function updateCourseAction(_: FormState, fd: FormData): Promise<FormState> {
  const courseId = id(fd, "courseId");
  const r = await withScope(fd.get("scope"), (s) => updateCourse(s, courseId, courseInput(fd)));
  revalidatePath(`${BASE[kindOf(fd)]}/${courseId}`);
  return toState(r, fd, "Course settings saved.");
}

export async function objectivesAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await withScope(fd.get("scope"), (s) => setObjectives(s, id(fd, "versionId"), String(fd.get("objectives") ?? "")));
  revalidatePath(`${BASE[kindOf(fd)]}/${id(fd, "courseId")}`);
  return toState(r, fd, "Learning objectives saved.");
}

export async function addModuleAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await withScope(fd.get("scope"), (s) => addModule(s, id(fd, "versionId"), { title: fd.get("title"), summary: fd.get("summary") ?? "" }));
  revalidatePath(`${BASE[kindOf(fd)]}/${id(fd, "courseId")}`);
  return toState(r, fd, "Module added.");
}

export async function updateModuleAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await withScope(fd.get("scope"), (s) => updateModule(s, id(fd, "moduleId"), { title: fd.get("title"), summary: fd.get("summary") ?? "" }));
  revalidatePath(`${BASE[kindOf(fd)]}/${id(fd, "courseId")}`);
  return toState(r, fd, "Module saved.");
}

/** Simple structural edits (move/delete) posted from buttons. */
export async function structureAction(fd: FormData) {
  const op = String(fd.get("op"));
  const target = id(fd, "targetId");
  const r = await withScope(fd.get("scope"), (s) => {
    switch (op) {
      case "module-up":
        return moveModule(s, target, "up");
      case "module-down":
        return moveModule(s, target, "down");
      case "module-delete":
        return deleteModule(s, target);
      case "lesson-up":
        return moveLesson(s, target, "up");
      case "lesson-down":
        return moveLesson(s, target, "down");
      case "lesson-delete":
        return deleteLesson(s, target);
      default:
        return Promise.resolve({ ok: false as const, error: "Unknown operation" });
    }
  });
  const path = `${BASE[kindOf(fd)]}/${id(fd, "courseId")}`;
  revalidatePath(path);
  if (!r.ok) redirect(`${path}?error=${encodeURIComponent(r.error)}`);
}

function lessonInput(fd: FormData) {
  return {
    title: fd.get("title"),
    type: fd.get("type"),
    body: fd.get("body") ?? "",
    mediaUrl: fd.get("mediaUrl") ?? "",
    durationMinutes: fd.get("durationMinutes"),
    videoDurationSeconds: fd.get("videoDurationSeconds"),
    isRequired: bool(fd, "isRequired"),
    questionsJson: fd.get("questionsJson") ?? "",
  };
}

export async function addLessonAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await withScope(fd.get("scope"), (s) => addLesson(s, id(fd, "moduleId"), lessonInput(fd)));
  if (!r.ok) return toState(r, fd, "");
  redirect(`${BASE[kindOf(fd)]}/${id(fd, "courseId")}/lessons/${r.data.id}?saved=1`);
}

export async function updateLessonAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await withScope(fd.get("scope"), (s) => updateLesson(s, id(fd, "lessonId"), lessonInput(fd)));
  revalidatePath(`${BASE[kindOf(fd)]}/${id(fd, "courseId")}/lessons/${id(fd, "lessonId")}`);
  return toState(r, fd, "Lesson saved.");
}

export async function workflowAction(_: FormState, fd: FormData): Promise<FormState> {
  const courseId = id(fd, "courseId");
  const op = String(fd.get("op"));
  const r = await withScope(fd.get("scope"), async (s): Promise<ServiceResult<unknown>> => {
    if (op === "submit") return submitForReview(s, courseId);
    if (op === "new-version") return createNewVersion(s, courseId);
    if (op === "archive") return archiveCourse(s, courseId);
    if (op === "decide") return decide(s, courseId, { decision: fd.get("decision"), comments: fd.get("comments") ?? "", reviewerCredentials: fd.get("reviewerCredentials") ?? "" });
    return { ok: false, error: "Unknown action" };
  });
  if (!r.ok) return toState(r, fd, "");
  revalidatePath("/catalog");
  const msg: Record<string, string> = { submit: "Submitted for review.", "new-version": "New draft version created from the published version.", archive: "Course archived.", decide: "Decision recorded." };
  // The submitting form usually disappears after a workflow transition, so confirm at page level.
  redirect(`${BASE[kindOf(fd)]}/${courseId}?msg=${encodeURIComponent(msg[op] ?? "Saved.")}`);
}

// ---------------------------------------------------------------------------
// Examination settings and question bank
// ---------------------------------------------------------------------------

export async function examSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const courseId = id(fd, "courseId");
  const r = await withScope(fd.get("scope"), (s) =>
    saveExamSettings(s, courseId, {
      title: fd.get("title"),
      passingScore: fd.get("passingScore"),
      questionCount: fd.get("questionCount"),
      maxAttempts: fd.get("maxAttempts"),
      timeLimitMinutes: fd.get("timeLimitMinutes"),
      randomize: bool(fd, "randomize"),
      isMandatory: bool(fd, "isMandatory"),
    }),
  );
  revalidatePath(`${BASE[kindOf(fd)]}/${courseId}/exam`);
  return toState(r, fd, "Examination settings saved.");
}

export async function questionAction(_: FormState, fd: FormData): Promise<FormState> {
  const courseId = id(fd, "courseId");
  const questionId = id(fd, "questionId");
  const input = parseQuestionForm(Object.fromEntries(fd));
  const r = await withScope(fd.get("scope"), async (s): Promise<ServiceResult<unknown>> => (questionId ? updateQuestion(s, questionId, input) : addQuestion(s, courseId, input)));
  revalidatePath(`${BASE[kindOf(fd)]}/${courseId}/exam`);
  return toState(r, fd, questionId ? "Question saved." : "Question added to the bank.");
}

export async function questionActiveAction(fd: FormData) {
  const courseId = id(fd, "courseId");
  const r = await withScope(fd.get("scope"), (s) => setQuestionActive(s, id(fd, "questionId"), fd.get("active") === "true"));
  const path = `${BASE[kindOf(fd)]}/${courseId}/exam`;
  revalidatePath(path);
  if (!r.ok) redirect(`${path}?error=${encodeURIComponent(r.error)}`);
}
