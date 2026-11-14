"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requirePermission } from "@/lib/auth/context";
import { applyExamOutcome, authorizeRetake, gradeAnswer } from "@/lib/assessment/engine";
import { notify } from "@/lib/notify/notifications";
import type { FormState } from "@/lib/forms";
import { enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";

const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);

export async function gradeAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("assessments.grade");
  const attemptId = fd.get("attemptId");
  const questionId = fd.get("questionId");
  if (!isUuid(attemptId) || !isUuid(questionId)) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => gradeAnswer(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, attemptId, questionId, { points: fd.get("points"), comment: fd.get("comment") ?? "" }));
  if (!r.ok) return { error: r.error };
  if (r.data.finalized) {
    await applyExamOutcome(systemDb(), attemptId);
    if (r.data.finalized.passed) {
      await notify(systemDb(), { tenantId: ctx.tenant.id, userId: r.data.finalized.userId, type: "exam.graded", title: "Your examination was graded", body: `Your final score is ${r.data.finalized.scorePct}%.`, link: `/learning/${r.data.finalized.enrollmentId}/exam/${attemptId}`, dedupeKey: `graded:${attemptId}` });
    }
    revalidatePath("/instructor");
    redirect(`/instructor?graded=${r.data.finalized.scorePct}`);
  }
  revalidatePath(`/instructor/grade/${attemptId}`);
  return { ok: true, message: "Score saved." };
}

export async function retakeAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.assign");
  const enrollmentId = fd.get("enrollmentId");
  if (!isUuid(enrollmentId)) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => authorizeRetake(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, enrollmentId, Number(fd.get("extra") ?? 1), String(fd.get("reason") ?? "")));
  if (!r.ok) return { error: r.error };
  const [e] = await systemDb().select({ userId: enrollments.userId }).from(enrollments).where(eq(enrollments.id, enrollmentId));
  if (e) await notify(systemDb(), { tenantId: ctx.tenant.id, userId: e.userId, type: "exam.retake", title: "Retake authorized", body: "Additional examination attempts were authorized. Review the course and try again.", link: `/learning/${enrollmentId}/exam`, dedupeKey: `retake:${enrollmentId}:${Date.now()}` });
  revalidatePath("/instructor");
  return { ok: true, message: "Retake authorized." };
}
