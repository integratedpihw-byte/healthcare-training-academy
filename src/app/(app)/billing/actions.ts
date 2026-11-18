"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { placeOrder } from "@/lib/billing/commerce";
import { desc, eq } from "drizzle-orm";
import { systemDb } from "@/db/server";
import { subscriptions } from "@/db/schema";
import { requirePermission } from "@/lib/auth/context";
import type { FormState } from "@/lib/forms";
import { appUrl } from "@/lib/notify/delivery";
import { createCheckout, createPortal, stripeConfigured } from "@/lib/billing/stripe";
import { writeAudit } from "@/lib/audit";

export async function checkoutAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("billing.manage");
  if (!stripeConfigured()) return { error: "Online payment is not configured for this platform. Contact your platform administrator to change plans." };
  const plan = String(fd.get("plan"));
  const cycle = fd.get("cycle") === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  if (!["STARTER", "PROFESSIONAL", "ENTERPRISE"].includes(plan)) return { error: "Choose a plan." };
  const quantity = Math.max(1, Math.min(100000, Number(fd.get("quantity")) || 1));
  let url: string;
  try {
    url = await createCheckout(systemDb(), { tenantId: ctx.tenant.id, plan: plan as "STARTER", cycle, quantity, email: ctx.user.email, returnUrl: appUrl("/billing") });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start checkout." };
  }
  await ctx.tx((tx) => writeAudit(tx, { tenantId: ctx.tenant.id, actorUserId: ctx.user.id, action: "billing.checkout_started", entityType: "subscription", after: { plan, cycle, quantity } }));
  redirect(url);
}

export async function portalAction(): Promise<void> {
  const ctx = await requirePermission("billing.manage");
  const [sub] = await systemDb().select().from(subscriptions).where(eq(subscriptions.tenantId, ctx.tenant.id)).orderBy(desc(subscriptions.createdAt)).limit(1);
  if (!stripeConfigured() || !sub?.stripeCustomerId) redirect("/billing?portal=unavailable");
  redirect(await createPortal(sub!.stripeCustomerId!, appUrl("/billing")));
}

/** Buys course seats or a training package for the organization (employer-sponsored training). */
export async function buyTrainingAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("billing.manage");
  const raw = String(fd.get("item") ?? "");
  const [itemType, itemId] = raw.split(":");
  const input = { itemType, itemId, quantity: fd.get("quantity") ?? 1, promoCode: String(fd.get("promoCode") ?? ""), method: fd.get("method") === "INVOICE" ? "INVOICE" : "STRIPE" };
  const back = String(fd.get("back") ?? "/billing");
  const returnUrl = appUrl(back.startsWith("/catalog/") || back === "/billing" ? back : "/billing");
  let r: Awaited<ReturnType<typeof placeOrder>>;
  try {
    r = await placeOrder(systemDb(), { tenantId: ctx.tenant.id, userId: ctx.user.id, email: ctx.user.email }, input, returnUrl);
  } catch (e) {
    return { error: e instanceof Error ? `Could not start checkout: ${e.message}` : "Could not start checkout." };
  }
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors };
  if (r.data.checkoutUrl) redirect(r.data.checkoutUrl);
  revalidatePath("/billing");
  return r.data.status === "PAID"
    ? { ok: true, message: "Done — the seats are available now. Learners can enroll from the catalog." }
    : { ok: true, message: "Order placed. An invoice will be sent; seats become available as soon as payment is recorded." };
}

/**
 * Individual learners (personal workspace) buy one seat in a priced course for themselves.
 * Organization staff get seats from their employer instead.
 */
export async function buyCourseForSelfAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("learning.self");
  if (ctx.tenant.type !== "INDIVIDUAL") return { error: "Ask your organization's training or billing administrator for a seat." };
  const courseId = String(fd.get("courseId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) return { error: "Invalid request." };
  let r: Awaited<ReturnType<typeof placeOrder>>;
  try {
    r = await placeOrder(systemDb(), { tenantId: ctx.tenant.id, userId: ctx.user.id, email: ctx.user.email }, { itemType: "COURSE", itemId: courseId, quantity: 1, promoCode: String(fd.get("promoCode") ?? ""), method: "STRIPE" }, appUrl(`/catalog/${courseId}`));
  } catch (e) {
    return { error: e instanceof Error ? `Could not start checkout: ${e.message}` : "Could not start checkout." };
  }
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors };
  if (r.data.checkoutUrl) redirect(r.data.checkoutUrl);
  revalidatePath(`/catalog/${courseId}`);
  return r.data.status === "PAID"
    ? { ok: true, message: "Your seat is ready — select Enroll and start." }
    : { ok: true, message: "Order received. Online payment is not available yet, so the academy will send you payment instructions; your seat appears once payment is recorded." };
}
