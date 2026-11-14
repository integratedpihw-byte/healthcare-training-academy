"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requirePermission } from "@/lib/auth/context";
import { applyExamOutcome, saveAnswer, startAttempt, submitAttempt } from "@/lib/assessment/engine";

const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);

export async function startExamAction(fd: FormData) {
  const ctx = await requirePermission("learning.self");
  const enrollmentId = fd.get("enrollmentId");
  if (!isUuid(enrollmentId)) redirect("/learning");
  const r = await ctx.tx((tx) => startAttempt(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, enrollmentId));
  if (!r.ok) redirect(`/learning/${enrollmentId}/exam?error=${encodeURIComponent(r.error)}`);
  redirect(`/learning/${enrollmentId}/exam/${r.data.attemptId}`);
}

/** Autosave one answer (called as the learner answers). */
export async function saveAnswerAction(input: { attemptId: string; questionId: string; response: unknown }) {
  const ctx = await requirePermission("learning.self");
  if (!isUuid(input.attemptId) || !isUuid(input.questionId)) return { ok: false as const, error: "Invalid request" };
  try {
    return await ctx.tx((tx) => saveAnswer(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, input.attemptId, input.questionId, input.response));
  } catch {
    return { ok: false as const, error: "Your answer could not be saved (the time limit may have expired)." };
  }
}

export async function submitExamAction(input: { enrollmentId: string; attemptId: string; answers: Record<string, unknown> }) {
  const ctx = await requirePermission("learning.self");
  if (!isUuid(input.attemptId) || !isUuid(input.enrollmentId)) return { ok: false as const, error: "Invalid request" };
  const r = await ctx.tx((tx) => submitAttempt(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, input.attemptId, input.answers));
  if (!r.ok) return r;
  if (r.data.passed !== null) await applyExamOutcome(systemDb(), input.attemptId);
  revalidatePath(`/learning/${input.enrollmentId}`, "layout");
  revalidatePath("/learning");
  revalidatePath("/certificates");
  return { ok: true as const };
}
