"use server";

import { revalidatePath } from "next/cache";
import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { recordApproval, setClassification, withdrawApproval } from "@/lib/compliance/programs";
import { formValues, type FormState } from "@/lib/forms";

const obj = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")));

export async function recordApprovalAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const r = await recordApproval(systemDb(), ctx.user.id, obj(fd));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/platform/programs");
  return { ok: true, message: "Approval recorded. You can now set the course's program type." };
}

export async function setClassificationAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const r = await setClassification(systemDb(), ctx.user.id, obj(fd));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/platform/programs");
  return { ok: true, message: "Program type saved." };
}

export async function withdrawApprovalAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const id = String(fd.get("approvalId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid request." };
  const r = await withdrawApproval(systemDb(), ctx.user.id, id, String(fd.get("reason") ?? ""));
  if (!r.ok) return { error: r.error };
  revalidatePath("/platform/programs");
  return { ok: true, message: r.data.downgraded.length ? `Approval withdrawn. Program type changed to "supports state-regulated training" for ${r.data.downgraded.join(", ")}.` : "Approval withdrawn." };
}
