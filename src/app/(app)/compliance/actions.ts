"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireFeature } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import { mapRuleToTraining, recordDecision } from "@/lib/compliance/service";

type Ctx = Awaited<ReturnType<typeof requirePermission>>;
const svc = (ctx: Ctx) => ({ tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access });

export async function recordDecisionAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("compliance.manage");
  requireFeature(ctx, "compliance");
  const ruleId = String(fd.get("ruleId") ?? "");
  const r = await ctx.tx((tx) =>
    recordDecision(tx, svc(ctx), { ruleId, facilityId: String(fd.get("facilityId") ?? ""), decision: String(fd.get("decision") ?? ""), rationale: String(fd.get("rationale") ?? "") }),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath(`/compliance/rules/${ruleId}`);
  redirect(`/compliance/rules/${ruleId}?msg=decision`);
}

export async function mapRuleAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("compliance.manage");
  requireFeature(ctx, "compliance");
  const ruleId = String(fd.get("ruleId") ?? "");
  const s = (k: string) => String(fd.get(k) ?? "");
  const r = await ctx.tx((tx) =>
    mapRuleToTraining(tx, svc(ctx), { ruleId, target: s("target") || "course", courseId: s("courseId"), competencyId: s("competencyId"), dueWithinDaysOfHire: s("dueWithinDaysOfHire"), frequencyMonths: s("frequencyMonths"), notes: s("notes") }),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath(`/compliance/rules/${ruleId}`);
  redirect(`/compliance/rules/${ruleId}?msg=mapped`);
}
