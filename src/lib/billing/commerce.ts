/**
 * Training revenue (expansion brief §8): course prices, training packages, promo codes,
 * course orders, seat entitlements and refunds.
 *
 * Access rule: a course with an active price is included for organizations and
 * learners with an active or trialing subscription. Anyone else needs a paid seat
 * (entitlement). Courses without a price are never gated.
 *
 * Orders, entitlements and promo redemptions are written only by these platform
 * services (the app role can read its own organization's orders and seats). Seat
 * capacity is enforced in the database (entitlement_uses trigger).
 */
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import { courseEntitlements, courseOrders, coursePrices, courses, entitlementUses, promoCodes, subscriptions, tenants, trainingPackages } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import type { ServiceResult } from "@/lib/tenancy/service";

// Loaded on demand: the Stripe module is server-only and imports this file (webhooks).
const stripeClient = async () => (await import("./stripe")).stripe();
const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

export const usd = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

// ---------------------------------------------------------------------------
// Catalog management (platform administrators)
// ---------------------------------------------------------------------------

export const priceSchema = z.object({
  courseId: z.string().uuid(),
  price: z.coerce.number().min(0, "Enter 0 or more").max(100000),
});

/** Sets (or clears, with price 0 and clear=true) a course's active list price. */
export async function setCoursePrice(sys: Db, adminId: string, raw: unknown, clear = false): Promise<ServiceResult<null>> {
  const p = priceSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Enter a valid price.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const cents = Math.round(p.data.price * 100);
  await sys.transaction(async (tx) => {
    await tx.update(coursePrices).set({ isActive: false }).where(and(eq(coursePrices.courseId, p.data.courseId), eq(coursePrices.isActive, true)));
    if (!clear) await tx.insert(coursePrices).values({ courseId: p.data.courseId, priceCents: cents, createdById: adminId });
    await writeAudit(tx, { tenantId: null, actorUserId: adminId, action: clear ? "commerce.price_cleared" : "commerce.price_set", entityType: "course", entityId: p.data.courseId, after: clear ? null : { priceCents: cents } });
  });
  return { ok: true, data: null };
}

export const packageSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/, "Use 3–30 letters, numbers or dashes"),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  audience: z.string().trim().max(200).optional().or(z.literal("")),
  courseIds: z.array(z.string().uuid()).min(1, "Choose at least one course").max(50),
  price: z.coerce.number().min(0).max(1000000),
});

export async function savePackage(sys: Db, adminId: string, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = packageSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  const found = await sys.select({ id: courses.id }).from(courses).where(and(inArray(courses.id, v.courseIds), isNull(courses.tenantId)));
  if (found.length !== new Set(v.courseIds).size) return { ok: false, error: "Packages can include library courses only." };
  const values = { code: v.code, name: v.name, description: v.description || null, audience: v.audience || null, courseIds: [...new Set(v.courseIds)], priceCents: Math.round(v.price * 100) };
  const [row] = await sys
    .insert(trainingPackages)
    .values(values)
    .onConflictDoUpdate({ target: trainingPackages.code, set: { ...values, isActive: true } })
    .returning({ id: trainingPackages.id });
  await writeAudit(sys, { tenantId: null, actorUserId: adminId, action: "commerce.package_saved", entityType: "training_package", entityId: row.id, after: values });
  return { ok: true, data: row };
}

export async function setPackageActive(sys: Db, adminId: string, id: string, active: boolean) {
  await sys.update(trainingPackages).set({ isActive: active }).where(eq(trainingPackages.id, id));
  await writeAudit(sys, { tenantId: null, actorUserId: adminId, action: active ? "commerce.package_activated" : "commerce.package_deactivated", entityType: "training_package", entityId: id });
}

export const promoSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/, "Use 3–30 letters, numbers or dashes"),
    description: z.string().trim().max(300).optional().or(z.literal("")),
    kind: z.enum(["PERCENT", "AMOUNT"]),
    value: z.coerce.number().positive("Enter a positive value"),
    maxRedemptions: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(1).max(100000).optional()),
    expiresOn: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
    courseId: z.union([z.literal(""), z.string().uuid()]).optional(),
    packageId: z.union([z.literal(""), z.string().uuid()]).optional(),
  })
  .refine((v) => v.kind !== "PERCENT" || (v.value >= 1 && v.value <= 100 && Number.isInteger(v.value)), { message: "Percent must be a whole number from 1 to 100", path: ["value"] })
  .refine((v) => !(v.courseId && v.packageId), { message: "Limit to a course or a package, not both", path: ["packageId"] });

export async function createPromo(sys: Db, adminId: string, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = promoSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  const [exists] = await sys.select({ id: promoCodes.id }).from(promoCodes).where(eq(promoCodes.code, v.code));
  if (exists) return { ok: false, error: "That code already exists.", fieldErrors: { code: ["Already in use"] } };
  const [row] = await sys
    .insert(promoCodes)
    .values({
      code: v.code,
      description: v.description || null,
      percentOff: v.kind === "PERCENT" ? v.value : null,
      amountOffCents: v.kind === "AMOUNT" ? Math.round(v.value * 100) : null,
      maxRedemptions: v.maxRedemptions ?? null,
      expiresAt: v.expiresOn ? new Date(`${v.expiresOn}T23:59:59-05:00`) : null,
      courseId: v.courseId || null,
      packageId: v.packageId || null,
    })
    .returning({ id: promoCodes.id });
  await writeAudit(sys, { tenantId: null, actorUserId: adminId, action: "commerce.promo_created", entityType: "promo_code", entityId: row.id, after: { code: v.code, kind: v.kind, value: v.value } });
  return { ok: true, data: row };
}

export async function setPromoActive(sys: Db, adminId: string, id: string, active: boolean) {
  await sys.update(promoCodes).set({ isActive: active }).where(eq(promoCodes.id, id));
  await writeAudit(sys, { tenantId: null, actorUserId: adminId, action: active ? "commerce.promo_activated" : "commerce.promo_deactivated", entityType: "promo_code", entityId: id });
}

// ---------------------------------------------------------------------------
// Access and quotes
// ---------------------------------------------------------------------------

export async function activePrice(db: Db | Tx, courseId: string): Promise<number | null> {
  const [p] = await db.select({ cents: coursePrices.priceCents }).from(coursePrices).where(and(eq(coursePrices.courseId, courseId), eq(coursePrices.isActive, true)));
  return p ? p.cents : null;
}

/**
 * A paid (ACTIVE) subscription includes priced library courses. An organization trial
 * includes them until the trial ends; individual-learner trials do not (individuals buy
 * priced courses one at a time; free courses are always open).
 */
export function subscriptionIncludesLibrary(sub: { status: string; plan: string; trialEndsAt: Date | null } | undefined) {
  if (!sub) return false;
  if (sub.status === "ACTIVE") return true;
  return sub.status === "TRIALING" && sub.plan !== "INDIVIDUAL_LEARNER" && (!sub.trialEndsAt || sub.trialEndsAt > new Date());
}

export type CourseAccess =
  | { kind: "FREE" }
  | { kind: "SUBSCRIPTION" }
  | { kind: "SEAT"; entitlementId: string; seatsLeft: number }
  | { kind: "PURCHASE_REQUIRED"; priceCents: number };

/** Runs in the learner's tenant transaction (RLS limits rows to the organization). */
export async function courseAccess(tx: Tx, tenantId: string, courseId: string): Promise<CourseAccess> {
  const price = await activePrice(tx, courseId);
  if (price == null || price === 0) return { kind: "FREE" };
  const [sub] = await tx
    .select({ status: subscriptions.status, plan: subscriptions.plan, trialEndsAt: subscriptions.trialEndsAt })
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  if (subscriptionIncludesLibrary(sub)) return { kind: "SUBSCRIPTION" };
  const rows = (
    await tx.execute<{ id: string; left: number }>(sql`
      select e.id, (e.seats_total - (select count(*) from entitlement_uses u where u.entitlement_id = e.id))::int as left
        from course_entitlements e
       where e.tenant_id = ${tenantId}::uuid and e.course_id = ${courseId}::uuid and e.revoked_at is null
         and (e.expires_at is null or e.expires_at > now())
       order by e.expires_at nulls last, e.created_at`)
  ).rows.filter((r) => r.left > 0);
  if (rows[0]) return { kind: "SEAT", entitlementId: rows[0].id, seatsLeft: rows.reduce((s, r) => s + r.left, 0) };
  return { kind: "PURCHASE_REQUIRED", priceCents: price };
}

/** Records the seat an enrollment uses (same tenant transaction as the enrollment). */
export async function consumeSeat(tx: Tx, tenantId: string, entitlementId: string, enrollmentId: string, userId: string) {
  await tx.insert(entitlementUses).values({ tenantId, entitlementId, enrollmentId, userId });
}

export const orderSchema = z.object({
  itemType: z.enum(["COURSE", "PACKAGE"]),
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, "At least 1 seat").max(10000),
  promoCode: z.string().trim().toUpperCase().max(30).optional().or(z.literal("")),
  method: z.enum(["STRIPE", "INVOICE"]).default("STRIPE"),
});

export interface Quote {
  itemType: "COURSE" | "PACKAGE";
  itemId: string;
  itemName: string;
  courseIds: string[];
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  promo: { id: string; code: string } | null;
  promoError?: string;
}

export async function quote(sys: Db, raw: unknown): Promise<ServiceResult<Quote>> {
  const p = orderSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  let itemName: string;
  let unit: number;
  let courseIds: string[];
  if (v.itemType === "COURSE") {
    const [c] = await sys.select({ id: courses.id, title: courses.title, code: courses.code, status: courses.status }).from(courses).where(eq(courses.id, v.itemId));
    const price = c ? await activePrice(sys, c.id) : null;
    if (!c || c.status !== "PUBLISHED" || price == null) return { ok: false, error: "This course is not for sale." };
    itemName = `${c.title} (${c.code})`;
    unit = price;
    courseIds = [c.id];
  } else {
    const [pk] = await sys.select().from(trainingPackages).where(and(eq(trainingPackages.id, v.itemId), eq(trainingPackages.isActive, true)));
    if (!pk) return { ok: false, error: "This package is not available." };
    itemName = pk.name;
    unit = pk.priceCents;
    courseIds = pk.courseIds;
  }
  const subtotal = unit * v.quantity;
  let discount = 0;
  let promo: Quote["promo"] = null;
  let promoError: string | undefined;
  if (v.promoCode) {
    const [pc] = await sys.select().from(promoCodes).where(eq(promoCodes.code, v.promoCode));
    const now = new Date();
    if (!pc || !pc.isActive) promoError = "That promo code is not valid.";
    else if (pc.expiresAt && pc.expiresAt < now) promoError = "That promo code has expired.";
    else if (pc.startsAt && pc.startsAt > now) promoError = "That promo code is not active yet.";
    else if (pc.maxRedemptions != null && pc.redeemedCount >= pc.maxRedemptions) promoError = "That promo code has been fully used.";
    else if ((pc.courseId && (v.itemType !== "COURSE" || pc.courseId !== v.itemId)) || (pc.packageId && (v.itemType !== "PACKAGE" || pc.packageId !== v.itemId))) promoError = "That promo code does not apply to this item.";
    else {
      discount = pc.percentOff != null ? Math.round((subtotal * pc.percentOff) / 100) : Math.min(subtotal, pc.amountOffCents ?? 0);
      promo = { id: pc.id, code: pc.code };
    }
    if (promoError) return { ok: false, error: promoError, fieldErrors: { promoCode: [promoError] } };
  }
  return { ok: true, data: { itemType: v.itemType, itemId: v.itemId, itemName, courseIds, quantity: v.quantity, unitPriceCents: unit, subtotalCents: subtotal, discountCents: discount, totalCents: subtotal - discount, promo, promoError } };
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function placeOrder(
  sys: Db,
  ctx: { tenantId: string; userId: string; email: string },
  raw: unknown,
  returnUrl: string,
): Promise<ServiceResult<{ orderId: string; checkoutUrl: string | null; status: string }>> {
  const q = await quote(sys, raw);
  if (!q.ok) return q;
  const v = orderSchema.parse(raw);
  const method = q.data.totalCents === 0 ? "FREE" : v.method === "STRIPE" && stripeConfigured() ? "STRIPE" : "INVOICE";
  const [order] = await sys
    .insert(courseOrders)
    .values({
      tenantId: ctx.tenantId,
      buyerUserId: ctx.userId,
      itemType: q.data.itemType,
      courseId: q.data.itemType === "COURSE" ? q.data.itemId : null,
      packageId: q.data.itemType === "PACKAGE" ? q.data.itemId : null,
      itemName: q.data.itemName,
      quantity: q.data.quantity,
      unitPriceCents: q.data.unitPriceCents,
      subtotalCents: q.data.subtotalCents,
      discountCents: q.data.discountCents,
      totalCents: q.data.totalCents,
      promoCodeId: q.data.promo?.id ?? null,
      promoCode: q.data.promo?.code ?? null,
      paymentMethod: method,
    })
    .returning({ id: courseOrders.id });
  await writeAudit(sys, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "commerce.order_placed", entityType: "course_order", entityId: order.id, after: { item: q.data.itemName, quantity: q.data.quantity, totalCents: q.data.totalCents, method } });

  if (method === "FREE") {
    await fulfillOrder(sys, order.id, { method: "FREE", actorUserId: ctx.userId });
    return { ok: true, data: { orderId: order.id, checkoutUrl: null, status: "PAID" } };
  }
  if (method === "STRIPE") {
    const session = await (await stripeClient()).checkout.sessions.create({
      mode: "payment",
      customer_email: ctx.email,
      client_reference_id: ctx.tenantId,
      line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: q.data.totalCents, product_data: { name: `${q.data.itemName} × ${q.data.quantity} seat${q.data.quantity === 1 ? "" : "s"}` } } }],
      metadata: { tenantId: ctx.tenantId, orderId: order.id },
      payment_intent_data: { metadata: { tenantId: ctx.tenantId, orderId: order.id } },
      success_url: `${returnUrl}?order=${order.id}&checkout=success`,
      cancel_url: `${returnUrl}?order=${order.id}&checkout=cancelled`,
    });
    await sys.update(courseOrders).set({ stripeSessionId: session.id }).where(eq(courseOrders.id, order.id));
    return { ok: true, data: { orderId: order.id, checkoutUrl: session.url, status: "PENDING" } };
  }
  return { ok: true, data: { orderId: order.id, checkoutUrl: null, status: "PENDING" } };
}

/** Marks an order paid and creates seats. Idempotent. */
export async function fulfillOrder(sys: Db, orderId: string, opts: { method: "STRIPE" | "INVOICE" | "MANUAL" | "FREE"; actorUserId: string | null; paymentIntentId?: string | null; note?: string }) {
  return sys.transaction(async (tx) => {
    const [o] = await tx.select().from(courseOrders).where(eq(courseOrders.id, orderId)).for("update");
    if (!o) throw new Error("Order not found");
    if (o.status !== "PENDING") return { fulfilled: false, status: o.status };
    const courseIds = o.itemType === "COURSE" ? [o.courseId!] : ((await tx.select({ ids: trainingPackages.courseIds }).from(trainingPackages).where(eq(trainingPackages.id, o.packageId!)))[0]?.ids ?? []);
    await tx
      .update(courseOrders)
      .set({ status: "PAID", paidAt: new Date(), paymentMethod: opts.method, stripePaymentIntentId: opts.paymentIntentId ?? o.stripePaymentIntentId, notes: opts.note ? [o.notes, opts.note].filter(Boolean).join("\n") : o.notes })
      .where(eq(courseOrders.id, orderId));
    if (courseIds.length) await tx.insert(courseEntitlements).values(courseIds.map((courseId) => ({ tenantId: o.tenantId, orderId, courseId, seatsTotal: o.quantity })));
    if (o.promoCodeId) await tx.update(promoCodes).set({ redeemedCount: sql`${promoCodes.redeemedCount} + 1` }).where(eq(promoCodes.id, o.promoCodeId));
    await writeAudit(tx, { tenantId: o.tenantId, actorUserId: opts.actorUserId, action: "commerce.order_paid", entityType: "course_order", entityId: orderId, after: { method: opts.method, totalCents: o.totalCents, seats: o.quantity, courses: courseIds.length } });
    await notify(tx, { tenantId: o.tenantId, userId: o.buyerUserId, type: "commerce.order_paid", title: "Your training purchase is ready", body: `${o.itemName}: ${o.quantity} seat${o.quantity === 1 ? "" : "s"} available. Learners can now enroll.`, link: o.itemType === "COURSE" ? `/catalog/${o.courseId}` : "/billing", dedupeKey: `order-paid:${orderId}` });
    return { fulfilled: true, status: "PAID" };
  });
}

export async function cancelOrder(sys: Db, actorUserId: string, orderId: string, tenantId?: string): Promise<ServiceResult<null>> {
  const [o] = await sys.select().from(courseOrders).where(eq(courseOrders.id, orderId));
  if (!o || (tenantId && o.tenantId !== tenantId)) return { ok: false, error: "Order not found." };
  if (o.status !== "PENDING") return { ok: false, error: "Only pending orders can be cancelled." };
  await sys.update(courseOrders).set({ status: "CANCELLED" }).where(eq(courseOrders.id, orderId));
  await writeAudit(sys, { tenantId: o.tenantId, actorUserId, action: "commerce.order_cancelled", entityType: "course_order", entityId: orderId });
  return { ok: true, data: null };
}

export const refundSchema = z.object({
  amount: z.coerce.number().positive("Enter the refund amount"),
  reason: z.string().trim().min(10, "Explain the refund (at least 10 characters)").max(500),
});

/**
 * Refunds part or all of a paid order. Stripe orders are refunded through Stripe.
 * A full refund revokes the order's unused seats; seats already used stay attached to
 * the learners' existing enrollments (their training records are never removed).
 */
export async function refundOrder(sys: Db, adminId: string, orderId: string, raw: unknown): Promise<ServiceResult<{ status: string }>> {
  const p = refundSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const cents = Math.round(p.data.amount * 100);
  const [o] = await sys.select().from(courseOrders).where(eq(courseOrders.id, orderId));
  if (!o) return { ok: false, error: "Order not found." };
  if (o.status !== "PAID" && o.status !== "PARTIALLY_REFUNDED") return { ok: false, error: "Only paid orders can be refunded." };
  if (cents > o.totalCents - o.refundedCents) return { ok: false, error: `You can refund at most ${usd(o.totalCents - o.refundedCents)}.`, fieldErrors: { amount: ["Too much"] } };
  if (o.paymentMethod === "STRIPE") {
    if (!o.stripePaymentIntentId) return { ok: false, error: "This Stripe order has no payment reference; refund it in Stripe." };
    await (await stripeClient()).refunds.create({ payment_intent: o.stripePaymentIntentId, amount: cents, metadata: { orderId } });
  }
  const refunded = o.refundedCents + cents;
  const status = refunded >= o.totalCents ? "REFUNDED" : "PARTIALLY_REFUNDED";
  await sys.transaction(async (tx) => {
    await tx.update(courseOrders).set({ refundedCents: refunded, status, refundReason: [o.refundReason, p.data.reason].filter(Boolean).join("\n") }).where(eq(courseOrders.id, orderId));
    if (status === "REFUNDED") {
      await tx.execute(sql`
        update course_entitlements e
           set seats_total = (select count(*) from entitlement_uses u where u.entitlement_id = e.id), revoked_at = now()
         where e.order_id = ${orderId}::uuid and e.revoked_at is null`);
    }
    await writeAudit(tx, { tenantId: o.tenantId, actorUserId: adminId, action: "commerce.order_refunded", entityType: "course_order", entityId: orderId, after: { amountCents: cents, totalRefundedCents: refunded, status, reason: p.data.reason } });
  });
  await notify(sys, { tenantId: o.tenantId, userId: o.buyerUserId, type: "commerce.order_refunded", title: "Refund issued", body: `${usd(cents)} was refunded for ${o.itemName}.`, link: "/billing", dedupeKey: `refund:${orderId}:${refunded}` });
  return { ok: true, data: { status } };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Organization view (tenant transaction). */
export async function myPurchases(tx: Tx) {
  const orders = await tx.select().from(courseOrders).orderBy(desc(courseOrders.createdAt)).limit(200);
  const seats = (
    await tx.execute<{ id: string; course: string; code: string; total: number; used: number; expires_at: Date | null; revoked_at: Date | null }>(sql`
      select e.id, c.title course, c.code, e.seats_total total, (select count(*) from entitlement_uses u where u.entitlement_id = e.id)::int used, e.expires_at, e.revoked_at
        from course_entitlements e join courses c on c.id = e.course_id
       order by c.title, e.created_at`)
  ).rows;
  return { orders, seats };
}

export async function shopCatalog(db: Db | Tx) {
  const priced = (
    await db.execute<{ id: string; code: string; title: string; price_cents: number; minutes: number }>(sql`
      select c.id, c.code, c.title, p.price_cents, c.estimated_minutes minutes
        from course_prices p join courses c on c.id = p.course_id
       where p.is_active and c.status = 'PUBLISHED' order by c.title`)
  ).rows;
  const packages = await db.select().from(trainingPackages).where(eq(trainingPackages.isActive, true)).orderBy(asc(trainingPackages.name));
  return { priced, packages };
}

/** Platform view: orders plus revenue summaries. */
export async function platformRevenue(sys: Db, opts: { from?: string; to?: string } = {}) {
  const to = opts.to ?? new Date().toISOString().slice(0, 10);
  const from = opts.from ?? `${to.slice(0, 4)}-01-01`;
  const where = sql`o.paid_at >= ${from}::date and o.paid_at < (${to}::date + 1) and o.status in ('PAID','PARTIALLY_REFUNDED','REFUNDED')`;
  const byCourse = (
    await sys.execute<{ item: string; orders: number; seats: number; gross: number; refunds: number; net: number }>(sql`
      select o.item_name item, count(*)::int orders, sum(o.quantity)::int seats, sum(o.total_cents)::int gross, sum(o.refunded_cents)::int refunds, sum(o.total_cents - o.refunded_cents)::int net
        from course_orders o where ${where} group by o.item_name order by net desc`)
  ).rows;
  const byOrg = (
    await sys.execute<{ organization: string; orders: number; seats: number; gross: number; refunds: number; net: number }>(sql`
      select t.name organization, count(*)::int orders, sum(o.quantity)::int seats, sum(o.total_cents)::int gross, sum(o.refunded_cents)::int refunds, sum(o.total_cents - o.refunded_cents)::int net
        from course_orders o join tenants t on t.id = o.tenant_id where ${where} group by t.name order by net desc`)
  ).rows;
  const orders = await sys
    .select({ o: courseOrders, org: tenants.name })
    .from(courseOrders)
    .innerJoin(tenants, eq(tenants.id, courseOrders.tenantId))
    .orderBy(desc(courseOrders.createdAt))
    .limit(300);
  const totals = byCourse.reduce((t, r) => ({ gross: t.gross + r.gross, refunds: t.refunds + r.refunds, net: t.net + r.net, seats: t.seats + r.seats }), { gross: 0, refunds: 0, net: 0, seats: 0 });
  return { from, to, byCourse, byOrg, orders, totals };
}

export async function pricedCourses(sys: Db) {
  return (
    await sys.execute<{ id: string; code: string; title: string; status: string; price_cents: number | null }>(sql`
      select c.id, c.code, c.title, c.status::text, p.price_cents
        from courses c left join course_prices p on p.course_id = c.id and p.is_active
       where c.tenant_id is null order by c.code`)
  ).rows;
}

export async function allPromos(sys: Db) {
  return sys.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
}
export async function allPackages(sys: Db) {
  return sys.select().from(trainingPackages).orderBy(asc(trainingPackages.name));
}
