"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requirePermission, requireFeature } from "@/lib/auth/context";
import { deleteDraft, saveDraft, signAssessment, voidAssessment } from "@/lib/competency/service";
import { formValues, type FormState } from "@/lib/forms";

function collect(fd: FormData) {
  const criteriaResults: { id: string; outcome: string; note?: string }[] = [];
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("c_") && typeof v === "string") criteriaResults.push({ id: k.slice(2), outcome: v, note: String(fd.get(`n_${k.slice(2)}`) ?? "") || undefined });
  }
  const evidence = String(fd.get("evidenceUrls") ?? "").split(/\s+/).map((s) => s.trim()).filter(Boolean);
  return {
    employeeId: fd.get("employeeId"),
    facilityId: fd.get("facilityId"),
    competencyId: fd.get("competencyId"),
    assessedOn: fd.get("assessedOn"),
    criteriaResults,
    remediationRequired: fd.get("remediationRequired") ?? "",
    evaluatorComments: fd.get("evaluatorComments") ?? "",
    evidenceUrls: evidence,
    nextAssessmentDue: fd.get("nextAssessmentDue") ?? "",
  };
}

export async function saveDraftAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("competency.evaluate");
  requireFeature(ctx, "competency");
  const id = String(fd.get("assessmentId") ?? "") || undefined;
  const r = await ctx.tx((tx) => saveDraft(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, collect(fd), id));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  redirect(`/competency/${r.data.id}?saved=1`);
}

export async function signAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("competency.sign");
  requireFeature(ctx, "competency");
  const id = String(fd.get("assessmentId") ?? "");
  const r = await ctx.tx((tx) =>
    signAssessment(tx, systemDb(), { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, id, {
      password: String(fd.get("password") ?? ""),
      credentials: String(fd.get("credentials") ?? ""),
      attest: fd.get("attest") === "on",
    }),
  );
  if (!r.ok) return { error: r.error };
  revalidatePath(`/competency/${id}`);
  revalidatePath("/competency");
  redirect(`/competency/${id}?signed=1`);
}

export async function voidAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("competency.sign");
  requireFeature(ctx, "competency");
  const id = String(fd.get("assessmentId") ?? "");
  const r = await ctx.tx((tx) => voidAssessment(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, id, String(fd.get("reason") ?? "")));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/competency/${id}`);
  return { ok: true, message: "Record voided." };
}

export async function deleteDraftAction(fd: FormData) {
  const ctx = await requirePermission("competency.evaluate");
  requireFeature(ctx, "competency");
  const id = String(fd.get("assessmentId") ?? "");
  await ctx.tx((tx) => deleteDraft(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, id));
  revalidatePath("/competency");
  redirect("/competency");
}
