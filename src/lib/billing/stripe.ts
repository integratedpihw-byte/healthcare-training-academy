/**
 * Stripe integration (server only). Checkout for new subscriptions and plan changes,
 * the Customer Portal for payment methods, cancellations and invoices, and a signed
 * webhook that mirrors Stripe into the subscriptions / invoices / payments tables.
 * Those tables are written only by the platform client — never by the application
 * role — and are kept separate from training records.
 */
import "server-only";
import Stripe from "stripe";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { billingEvents, invoices, payments, subscriptions } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { stripePriceId, type PlanCode } from "./plans";

let client: Stripe | null = null;
export function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { appInfo: { name: "Complete Healthcare Innovative Training Academy" } });
  return client;
}

export async function createCheckout(sys: Db, opts: { tenantId: string; plan: PlanCode; cycle: "MONTHLY" | "ANNUAL"; quantity: number; email: string; returnUrl: string }) {
  const price = stripePriceId(opts.plan, opts.cycle);
  if (!price) throw new Error(`No Stripe price configured for ${opts.plan} ${opts.cycle}.`);
  const [sub] = await sys.select().from(subscriptions).where(eq(subscriptions.tenantId, opts.tenantId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: Math.max(1, opts.quantity) }],
    customer: sub?.stripeCustomerId ?? undefined,
    customer_email: sub?.stripeCustomerId ? undefined : opts.email,
    client_reference_id: opts.tenantId,
    subscription_data: { metadata: { tenantId: opts.tenantId, plan: opts.plan, cycle: opts.cycle } },
    metadata: { tenantId: opts.tenantId },
    success_url: `${opts.returnUrl}?checkout=success`,
    cancel_url: `${opts.returnUrl}?checkout=cancelled`,
    allow_promotion_codes: true,
  });
  return session.url!;
}

export async function createPortal(customerId: string, returnUrl: string) {
  const s = await stripe().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  return s.url;
}

export function verifyWebhook(payload: string, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) throw new Error("Missing webhook secret or signature.");
  // constructEvent verifies the HMAC and timestamp tolerance (replay protection).
  return Stripe.webhooks.constructEvent(payload, signature, secret);
}

const STATUS: Record<string, "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  paused: "PAST_DUE",
};
const ts = (n: number | null | undefined) => (n ? new Date(n * 1000) : null);

/** Applies one Stripe event. Idempotent: each event id is processed once. */
export async function handleStripeEvent(sys: Db, event: Stripe.Event): Promise<"processed" | "duplicate" | "ignored"> {
  return sys.transaction(async (tx) => {
    const fresh = await tx.insert(billingEvents).values({ id: event.id, type: event.type }).onConflictDoNothing().returning({ id: billingEvents.id });
    if (!fresh.length) return "duplicate";
    const obj = event.data.object as unknown as Record<string, unknown>;

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const tenantId = s.client_reference_id ?? s.metadata?.tenantId;
      if (!tenantId) return "ignored";
      await tx
        .update(subscriptions)
        .set({ stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null, stripeSubscriptionId: typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null })
        .where(eq(subscriptions.id, sql`(select id from subscriptions where tenant_id = ${tenantId}::uuid order by created_at desc limit 1)`));
      await tx.update(billingEvents).set({ tenantId }).where(eq(billingEvents.id, event.id));
      await writeAudit(tx, { tenantId, actorUserId: null, action: "billing.checkout_completed", entityType: "subscription", entityId: s.id });
      return "processed";
    }

    if (event.type.startsWith("customer.subscription.")) {
      const s = event.data.object as Stripe.Subscription;
      const tenantId = s.metadata?.tenantId;
      if (!tenantId) return "ignored";
      const item = s.items.data[0];
      const plan = (s.metadata?.plan as PlanCode | undefined) ?? undefined;
      const cycle = s.metadata?.cycle === "ANNUAL" ? "ANNUAL" : "MONTHLY";
      const values = {
        status: event.type === "customer.subscription.deleted" ? ("CANCELED" as const) : (STATUS[s.status] ?? "INCOMPLETE"),
        stripeSubscriptionId: s.id,
        stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer.id,
        stripePriceId: item?.price?.id ?? null,
        seats: item?.quantity ?? 1,
        billingCycle: cycle as "MONTHLY" | "ANNUAL",
        unitPriceCents: item?.price?.unit_amount ?? null,
        currentPeriodEnd: ts((item as unknown as { current_period_end?: number })?.current_period_end ?? (s as unknown as { current_period_end?: number }).current_period_end),
        trialEndsAt: ts(s.trial_end),
        cancelAtPeriodEnd: s.cancel_at_period_end,
        canceledAt: ts(s.canceled_at),
        ...(plan ? { plan } : {}),
      };
      const [existing] = await tx.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.tenantId, tenantId))).orderBy(desc(subscriptions.createdAt)).limit(1);
      if (existing) await tx.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
      else await tx.insert(subscriptions).values({ tenantId, plan: plan ?? "STARTER", ...values });
      await tx.update(billingEvents).set({ tenantId }).where(eq(billingEvents.id, event.id));
      await writeAudit(tx, { tenantId, actorUserId: null, action: "billing.subscription_synced", entityType: "subscription", entityId: s.id, after: { status: values.status, plan: plan ?? null, seats: values.seats } });
      return "processed";
    }

    if (event.type === "invoice.finalized" || event.type === "invoice.paid" || event.type === "invoice.payment_failed" || event.type === "invoice.voided" || event.type === "invoice.marked_uncollectible") {
      const inv = event.data.object as Stripe.Invoice;
      const subId = typeof (obj.subscription ?? null) === "string" ? (obj.subscription as string) : ((inv as unknown as { parent?: { subscription_details?: { subscription?: string } } }).parent?.subscription_details?.subscription ?? null);
      const [sub] = subId ? await tx.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subId)) : [];
      if (!sub) return "ignored";
      const status = event.type === "invoice.paid" ? "PAID" : event.type === "invoice.voided" ? "VOID" : event.type === "invoice.marked_uncollectible" ? "UNCOLLECTIBLE" : "OPEN";
      const values = {
        tenantId: sub.tenantId,
        subscriptionId: sub.id,
        number: inv.number ?? inv.id!,
        status: status as "PAID" | "VOID" | "UNCOLLECTIBLE" | "OPEN",
        amountDueCents: inv.amount_due,
        amountPaidCents: inv.amount_paid,
        currency: inv.currency,
        periodStart: ts(inv.period_start) ?? new Date(),
        periodEnd: ts(inv.period_end) ?? new Date(),
        stripeInvoiceId: inv.id!,
        hostedUrl: inv.hosted_invoice_url ?? null,
      };
      const [row] = await tx.insert(invoices).values(values).onConflictDoUpdate({ target: invoices.stripeInvoiceId, set: { status: values.status, amountPaidCents: values.amountPaidCents, hostedUrl: values.hostedUrl } }).returning({ id: invoices.id });
      if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
        await tx.insert(payments).values({
          tenantId: sub.tenantId,
          invoiceId: row.id,
          amountCents: event.type === "invoice.paid" ? inv.amount_paid : inv.amount_due,
          currency: inv.currency,
          status: event.type === "invoice.paid" ? "SUCCEEDED" : "FAILED",
          paidAt: event.type === "invoice.paid" ? new Date() : null,
        });
      }
      await tx.update(billingEvents).set({ tenantId: sub.tenantId }).where(eq(billingEvents.id, event.id));
      return "processed";
    }
    return "ignored";
  });
}
