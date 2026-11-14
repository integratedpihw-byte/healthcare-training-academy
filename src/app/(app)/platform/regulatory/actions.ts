"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import { addSource, saveRule } from "@/lib/compliance/platform";

function ruleInput(fd: FormData) {
  const s = (k: string) => String(fd.get(k) ?? "");
  const b = (k: string) => fd.get(k) === "on";
  return {
    sourceId: s("sourceId"), category: s("category"), kind: s("kind"), jurisdiction: s("jurisdiction"), agency: s("agency"),
    citation: s("citation"), title: s("title"), requirementText: s("requirementText"), audienceText: s("audienceText"),
    facilityTypes: fd.getAll("facilityTypes").map(String), facilityLicenseTypes: fd.getAll("facilityLicenseTypes").map(String),
    positionCodes: s("positionCodes"), jobDuties: fd.getAll("jobDuties").map(String),
    requiresClinicalExposure: b("requiresClinicalExposure"), requiresBloodborneExposure: b("requiresBloodborneExposure"),
    frequencyMonths: s("frequencyMonths"), frequencyVerified: b("frequencyVerified"), frequencyText: s("frequencyText"), initialTimingText: s("initialTimingText"),
    initialDueDaysFromHire: s("initialDueDaysFromHire"), effectiveDate: s("effectiveDate"), complianceStatus: s("complianceStatus"), lastVerifiedOn: s("lastVerifiedOn"),
    verificationNote: s("verificationNote"), pendingChangeNote: s("pendingChangeNote"), reviewerName: s("reviewerName"), suggestedCourseCodes: s("suggestedCourseCodes"),
    isActive: b("isActive"), changeSummary: s("changeSummary"),
  };
}

export async function saveRuleAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const id = String(fd.get("ruleId") ?? "") || undefined;
  const r = await saveRule(systemDb(), ctx.user.id, ruleInput(fd), id);
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/platform/regulatory");
  redirect(`/platform/regulatory/${r.data.id}?msg=${id ? `saved-${r.data.notified}` : "created"}`);
}

export async function addSourceAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const s = (k: string) => String(fd.get(k) ?? "");
  const r = await addSource(systemDb(), ctx.user.id, { agency: s("agency"), category: s("category"), jurisdiction: s("jurisdiction"), sourceKind: s("sourceKind"), title: s("title"), url: s("url"), isOfficial: fd.get("isOfficial") === "on", notes: s("notes") });
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/platform/regulatory");
  return { ok: true, message: "Source added." };
}
