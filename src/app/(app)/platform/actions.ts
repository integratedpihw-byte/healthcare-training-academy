"use server";
import { revalidatePath } from "next/cache";
import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { decideTenant } from "@/lib/tenancy/service";
import { formValues, type FormState } from "@/lib/forms";
import { setPlanManually } from "@/lib/billing/service";

export async function decideTenantAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const decision = String(fd.get("decision")) as "approve" | "reject" | "suspend" | "reactivate";
  if (!["approve", "reject", "suspend", "reactivate"].includes(decision)) return { error: "Invalid decision." };
  const r = await decideTenant(systemDb(), { userId: ctx.user.id, isPlatformAdmin: ctx.user.isPlatformAdmin }, String(fd.get("tenantId")), decision, String(fd.get("reason") ?? ""));
  if (!r.ok) return { error: r.error };
  revalidatePath("/platform");
  revalidatePath(`/platform/tenants/${fd.get("tenantId")}`);
  return { ok: true, message: `Tenant is now ${r.data.status.replace("_", " ").toLowerCase()}.` };
}

export async function setPlanAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const tenantId = String(fd.get("tenantId") ?? "");
  const s = (k: string) => String(fd.get(k) ?? "");
  const r = await setPlanManually(systemDb(), ctx.user.id, tenantId, { plan: s("plan"), billingCycle: s("billingCycle"), pricingModel: s("pricingModel"), status: s("status"), seats: s("seats"), facilityLimit: s("facilityLimit"), unitPriceCents: s("unitPriceCents"), trialEndsAt: s("trialEndsAt"), customTerms: s("customTerms"), reason: s("reason") });
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath(`/platform/tenants/${tenantId}`);
  return { ok: true, message: "Plan saved." };
}
