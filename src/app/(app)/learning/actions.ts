"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { systemDb } from "@/db/server";
import { issueForEnrollment } from "@/lib/certificates/service";
import { enroll, recordProgress, submitCourseReview, submitKnowledgeCheck, toggleBookmark } from "@/lib/learning/learner";
import type { FormState } from "@/lib/forms";

const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);

export async function enrollAction(fd: FormData) {
  const ctx = await requirePermission("learning.self");
  const courseId = fd.get("courseId");
  if (!isUuid(courseId)) redirect("/catalog");
  const r = await ctx.tx((tx) => enroll(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, courseId));
  if (!r.ok) redirect(`/catalog/${courseId}?error=${encodeURIComponent(r.error)}`);
  revalidatePath("/learning");
  redirect(`/learning/${r.data.enrollmentId}`);
}

/** Heartbeat / video position / completion from the player. */
export async function progressAction(input: {
  enrollmentId: string;
  lessonId: string;
  secondsSpent?: number;
  videoPositionS?: number;
  videoDurationS?: number;
  complete?: boolean;
}): Promise<{ ok: boolean; error?: string; enrollmentStatus?: string; progressPct?: number }> {
  const ctx = await requirePermission("learning.self");
  const r = await ctx.tx((tx) =>
    recordProgress(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, {
      ...input,
      secondsSpent: Math.max(0, Math.min(3600, Math.round(input.secondsSpent ?? 0))),
      videoPositionS: input.videoPositionS === undefined ? undefined : Math.round(input.videoPositionS),
      videoDurationS: input.videoDurationS === undefined ? undefined : Math.round(input.videoDurationS),
    }),
  );
  if (!r.ok) return { ok: false, error: r.error };
  if (r.data.enrollmentStatus === "COMPLETED") await issueForEnrollment(systemDb(), input.enrollmentId); // courses without a final exam
  if (input.complete) revalidatePath(`/learning/${input.enrollmentId}`, "layout");
  return { ok: true, enrollmentStatus: r.data.enrollmentStatus, progressPct: r.data.progressPct };
}

export async function completeLessonAction(fd: FormData) {
  const enrollmentId = String(fd.get("enrollmentId"));
  const lessonId = String(fd.get("lessonId"));
  const next = String(fd.get("next") ?? "");
  if (!isUuid(enrollmentId) || !isUuid(lessonId)) redirect("/learning");
  const r = await progressAction({ enrollmentId, lessonId, secondsSpent: Number(fd.get("seconds") ?? 0), complete: true });
  if (!r.ok) redirect(`/learning/${enrollmentId}/${lessonId}?error=${encodeURIComponent(r.error ?? "Could not save")}`);
  redirect(isUuid(next) ? `/learning/${enrollmentId}/${next}` : `/learning/${enrollmentId}?done=1`);
}

export async function knowledgeCheckAction(input: { enrollmentId: string; lessonId: string; answers: Record<string, string | string[]> }) {
  const ctx = await requirePermission("learning.self");
  if (!isUuid(input.enrollmentId) || !isUuid(input.lessonId)) return { ok: false as const, error: "Invalid request" };
  const r = await ctx.tx((tx) => submitKnowledgeCheck(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, input.enrollmentId, input.lessonId, input.answers));
  if (r.ok && r.data.enrollmentStatus === "COMPLETED") await issueForEnrollment(systemDb(), input.enrollmentId);
  if (r.ok && r.data.allCorrect) revalidatePath(`/learning/${input.enrollmentId}`, "layout");
  return r;
}

export async function bookmarkAction(fd: FormData) {
  const ctx = await requirePermission("learning.self");
  const enrollmentId = String(fd.get("enrollmentId"));
  const lessonId = String(fd.get("lessonId"));
  if (!isUuid(enrollmentId) || !isUuid(lessonId)) return;
  await ctx.tx((tx) => toggleBookmark(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, enrollmentId, lessonId));
  revalidatePath(`/learning/${enrollmentId}`, "layout");
  revalidatePath("/learning");
}

export async function reviewAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("learning.self");
  const courseId = fd.get("courseId");
  if (!isUuid(courseId)) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => submitCourseReview(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, courseId, { rating: fd.get("rating"), comment: fd.get("comment") ?? "" }));
  if (!r.ok) return { error: r.error };
  return { ok: true, message: "Thank you — your feedback was saved." };
}
