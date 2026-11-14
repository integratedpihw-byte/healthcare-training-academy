"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requireUser } from "@/lib/auth/context";
import {
  beginMfaEnrollment,
  changePassword,
  confirmMfaEnrollment,
  disableMfa,
  generateRecoveryCodes,
  revokeSessionById,
  switchTenant,
} from "@/lib/auth/service";
import type { FormState } from "@/lib/forms";
import { eq } from "drizzle-orm";
import { sessions } from "@/db/schema";

export async function switchTenantAction(fd: FormData) {
  const ctx = await requireUser();
  const tenantId = String(fd.get("tenantId") ?? "");
  await switchTenant(systemDb(), ctx.session, tenantId);
  redirect("/dashboard");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireUser();
  const next = String(fd.get("password") ?? "");
  if (next !== String(fd.get("confirm") ?? "")) return { error: "New passwords do not match." };
  const r = await changePassword(systemDb(), ctx.user.id, ctx.session.sessionId, String(fd.get("current") ?? ""), next);
  if (!r.ok) return { error: r.error, fieldErrors: r.issues ? { password: r.issues } : undefined };
  return { ok: true, message: "Password changed. Your other sessions have been signed out." };
}

export async function beginMfaAction(): Promise<{ secret: string; uri: string } | { error: string }> {
  const ctx = await requireUser();
  try {
    return await beginMfaEnrollment(systemDb(), ctx.user.id);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function confirmMfaAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireUser();
  const ok = await confirmMfaEnrollment(systemDb(), ctx.user.id, String(fd.get("code") ?? ""));
  if (!ok) return { error: "That code did not match. Make sure your device clock is correct and try again." };
  // The current session has proven possession of the factor.
  await systemDb().update(sessions).set({ mfaVerified: true }).where(eq(sessions.id, ctx.session.sessionId));
  revalidatePath("/settings/security");
  return { ok: true, message: "Two-step verification is now on. Create your recovery codes next." };
}

export async function disableMfaAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireUser();
  const ok = await disableMfa(systemDb(), ctx.user.id, String(fd.get("password") ?? ""), String(fd.get("code") ?? ""));
  if (!ok) return { error: "Password or code is incorrect." };
  revalidatePath("/settings/security");
  return { ok: true, message: "Two-step verification has been turned off." };
}

export async function revokeSessionAction(fd: FormData) {
  const ctx = await requireUser();
  const id = String(fd.get("sessionId") ?? "");
  if (id && id !== ctx.session.sessionId) await revokeSessionById(systemDb(), ctx.user.id, id);
  revalidatePath("/settings/security");
}

export async function recoveryCodesAction(_: { codes?: string[]; error?: string } | undefined, fd: FormData): Promise<{ codes?: string[]; error?: string }> {
  const ctx = await requireUser();
  const codes = await generateRecoveryCodes(systemDb(), ctx.user.id, String(fd.get("password") ?? ""));
  return codes ? { codes } : { error: "Password is incorrect." };
}
