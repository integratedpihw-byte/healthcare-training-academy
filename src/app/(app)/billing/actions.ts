"use server";

import { redirect } from "next/navigation";
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
