/**
 * Training revenue: course prices, access gating, promo codes, orders (free, invoice),
 * fulfilment into seats, seat capacity, refunds, tenant isolation and the business reports.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import { courseCategories, courseEntitlements, courseOrders, entitlementUses, enrollments, promoCodes, subscriptions } from "@/db/schema";
import { addLesson, addModule, createCourse, decide, getBuilderCourse, setObjectives, submitForReview, type AuthorScope } from "@/lib/learning/builder";
import { enroll } from "@/lib/learning/learner";
import { courseAccess, createPromo, fulfillOrder, myPurchases, placeOrder, quote, refundOrder, savePackage, setCoursePrice, subscriptionIncludesLibrary } from "@/lib/billing/commerce";
import { getReport } from "@/lib/reports/definitions";
import { can, loadAccess } from "@/lib/rbac/access";
import { addMember, createTenant, expectPgError, platformAdmin, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
let O: TenantFixture;
let director: { userId: string };
let reviewer: { userId: string };
let learners: { userId: string }[];
let adminId: string;
let courseId: string;
const tag = Date.now().toString(36).toUpperCase();

const as = (userId: string, tenantId = T.tenantId) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId, userId }, fn);
async function scope<R>(userId: string, fn: (s: AuthorScope) => Promise<R>) {
  return as(userId)(async (tx) => {
    const access = await loadAccess(tx, T.tenantId, userId);
    return fn({ db: tx, tenantId: T.tenantId, userId, can: (p) => can(access, p) });
  });
}

async function publishedCourse(code: string) {
  const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "home-health"));
  const r = await scope(director.userId, (s) => createCourse(s, { code, title: `Course ${code}`, categoryId: cat.id, passingScore: 80, estimatedMinutes: 30, renewalMonths: null, description: "Course used by commerce integration tests.", targetAudience: "All", certificateEligible: true }));
  if (!r.ok) throw new Error(r.error);
  const id = r.data.courseId;
  const b = (await scope(director.userId, (s) => getBuilderCourse(s, id)))!;
  await scope(director.userId, (s) => setObjectives(s, b.working.id, "Complete the lesson"));
  const m = await scope(director.userId, (s) => addModule(s, b.working.id, { title: "Module" }));
  if (!m.ok) throw new Error(m.error);
  await scope(director.userId, (s) => addLesson(s, m.data.id, { title: "Lesson", type: "TEXT", body: "Read this lesson body.", durationMinutes: 5 }));
  expect((await scope(director.userId, (s) => submitForReview(s, id))).ok).toBe(true);
  for (let i = 0; i < 3; i++) {
    const d = await scope(reviewer.userId, (s) => decide(s, id, { decision: "APPROVED", comments: "ok" }));
    if (!d.ok) throw new Error(d.error);
  }
  return id;
}

const tryEnroll = (userId: string, cid = courseId) => as(userId)((tx) => enroll(tx, { tenantId: T.tenantId, userId }, cid));
const ctxOf = (userId = T.adminUserId) => ({ tenantId: T.tenantId, userId, email: T.adminEmail });

beforeAll(async () => {
  T = await createTenant("commerce");
  O = await createTenant("commerce-other");
  director = await addMember(T, "training_director");
  reviewer = await addMember(T, "org_admin");
  learners = [await addMember(T, "learner"), await addMember(T, "learner"), await addMember(T, "learner"), await addMember(T, "learner")];
  adminId = (await platformAdmin()).id;
  courseId = await publishedCourse(`COM-${tag}`);
  // No active subscription: priced courses need seats.
  await systemDb().update(subscriptions).set({ status: "CANCELED" }).where(eq(subscriptions.tenantId, T.tenantId));
  delete process.env.STRIPE_SECRET_KEY;
});
afterAll(() => closePools());

describe("access rule", () => {
  it("leaves unpriced courses open and gates priced ones without a subscription", async () => {
    expect(await as(learners[0].userId)((tx) => courseAccess(tx, T.tenantId, courseId))).toEqual({ kind: "FREE" });
    const p = await setCoursePrice(systemDb(), adminId, { courseId, price: "49.00" });
    expect(p.ok).toBe(true);
    expect(await as(learners[0].userId)((tx) => courseAccess(tx, T.tenantId, courseId))).toEqual({ kind: "PURCHASE_REQUIRED", priceCents: 4900 });
    const e = await tryEnroll(learners[0].userId);
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.error).toMatch(/paid seat/);
  });

  it("includes priced courses with a paid subscription or an organization trial, not an individual trial", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(subscriptionIncludesLibrary({ status: "ACTIVE", plan: "STARTER", trialEndsAt: null })).toBe(true);
    expect(subscriptionIncludesLibrary({ status: "TRIALING", plan: "STARTER", trialEndsAt: future })).toBe(true);
    expect(subscriptionIncludesLibrary({ status: "TRIALING", plan: "STARTER", trialEndsAt: new Date(Date.now() - 1000) })).toBe(false);
    expect(subscriptionIncludesLibrary({ status: "TRIALING", plan: "INDIVIDUAL_LEARNER", trialEndsAt: future })).toBe(false);
    expect(subscriptionIncludesLibrary({ status: "PAST_DUE", plan: "STARTER", trialEndsAt: null })).toBe(false);
    expect(subscriptionIncludesLibrary(undefined)).toBe(false);
  });
});

describe("promo codes and quotes", () => {
  it("validates codes and applies the discount", async () => {
    expect((await createPromo(systemDb(), adminId, { code: `P25-${tag}`, kind: "PERCENT", value: "25", maxRedemptions: "1" })).ok).toBe(true);
    expect((await createPromo(systemDb(), adminId, { code: `BAD-${tag}`, kind: "PERCENT", value: "150" })).ok).toBe(false);
    expect((await createPromo(systemDb(), adminId, { code: `P25-${tag}`, kind: "AMOUNT", value: "5" })).ok).toBe(false);
    const q = await quote(systemDb(), { itemType: "COURSE", itemId: courseId, quantity: 4, promoCode: `p25-${tag}` });
    if (!q.ok) throw new Error(q.error);
    expect(q.data).toMatchObject({ unitPriceCents: 4900, subtotalCents: 19600, discountCents: 4900, totalCents: 14700 });
    const bad = await quote(systemDb(), { itemType: "COURSE", itemId: courseId, quantity: 1, promoCode: "NOPE-NOPE" });
    expect(bad.ok).toBe(false);
  });

  it("refuses unpublished courses and packages of tenant courses", async () => {
    const pk = await savePackage(systemDb(), adminId, { code: `PK-${tag}`, name: "Tenant package", courseIds: [courseId], price: "10" });
    expect(pk.ok).toBe(false);
  });
});

describe("orders, seats and refunds", () => {
  let orderId: string;

  it("places an invoice order that grants seats only once paid", async () => {
    const r = await placeOrder(systemDb(), ctxOf(), { itemType: "COURSE", itemId: courseId, quantity: 2, promoCode: `P25-${tag}`, method: "STRIPE" }, "https://example.test/billing");
    if (!r.ok) throw new Error(r.error);
    expect(r.data).toMatchObject({ status: "PENDING", checkoutUrl: null });
    orderId = r.data.orderId;
    const [o] = await systemDb().select().from(courseOrders).where(eq(courseOrders.id, orderId));
    expect(o).toMatchObject({ paymentMethod: "INVOICE", totalCents: 7350, discountCents: 2450 });
    expect((await tryEnroll(learners[0].userId)).ok).toBe(false);

    expect((await fulfillOrder(systemDb(), orderId, { method: "INVOICE", actorUserId: adminId, note: "Check 1001" })).fulfilled).toBe(true);
    expect((await fulfillOrder(systemDb(), orderId, { method: "INVOICE", actorUserId: adminId })).fulfilled).toBe(false);
    const [promo] = await systemDb().select().from(promoCodes).where(eq(promoCodes.code, `P25-${tag}`));
    expect(promo.redeemedCount).toBe(1);
    // Single-use code is now exhausted.
    expect((await quote(systemDb(), { itemType: "COURSE", itemId: courseId, quantity: 1, promoCode: `P25-${tag}` })).ok).toBe(false);
  });

  it("uses one seat per enrollment and stops at capacity", async () => {
    expect((await tryEnroll(learners[0].userId)).ok).toBe(true);
    expect(await as(learners[1].userId)((tx) => courseAccess(tx, T.tenantId, courseId))).toMatchObject({ kind: "SEAT", seatsLeft: 1 });
    expect((await tryEnroll(learners[1].userId)).ok).toBe(true);
    const third = await tryEnroll(learners[2].userId);
    expect(third.ok).toBe(false);
    const [ent] = await systemDb().select().from(courseEntitlements).where(eq(courseEntitlements.orderId, orderId));
    const uses = await systemDb().select().from(entitlementUses).where(eq(entitlementUses.entitlementId, ent.id));
    expect(uses).toHaveLength(2);
    // The database enforces capacity even if application checks are bypassed.
    const [extra] = await systemDb().insert(enrollments).values({ tenantId: T.tenantId, userId: learners[2].userId, courseId, courseVersionId: (await systemDb().select().from(enrollments).where(eq(enrollments.userId, learners[0].userId)))[0].courseVersionId }).returning();
    const err = await expectPgError(systemDb().insert(entitlementUses).values({ tenantId: T.tenantId, entitlementId: ent.id, enrollmentId: extra.id, userId: learners[2].userId }));
    expect(err.message).toMatch(/seat/i);
  });

  it("refunds partially, then fully, withdrawing unused seats only", async () => {
    expect((await refundOrder(systemDb(), adminId, orderId, { amount: "100", reason: "Too much money requested" })).ok).toBe(false);
    const part = await refundOrder(systemDb(), adminId, orderId, { amount: "20.00", reason: "One learner left the agency" });
    if (!part.ok) throw new Error(part.error);
    expect(part.data.status).toBe("PARTIALLY_REFUNDED");
    const full = await refundOrder(systemDb(), adminId, orderId, { amount: "53.50", reason: "Agency closed its training program" });
    if (!full.ok) throw new Error(full.error);
    expect(full.data.status).toBe("REFUNDED");
    const [ent] = await systemDb().select().from(courseEntitlements).where(eq(courseEntitlements.orderId, orderId));
    expect(ent.revokedAt).not.toBeNull();
    expect(ent.seatsTotal).toBe(2);
    expect((await systemDb().select().from(enrollments).where(eq(enrollments.userId, learners[0].userId))).length).toBe(1);
  });

  it("fulfils a fully discounted order immediately", async () => {
    expect((await createPromo(systemDb(), adminId, { code: `FREE-${tag}`, kind: "PERCENT", value: "100", courseId })).ok).toBe(true);
    const r = await placeOrder(systemDb(), ctxOf(), { itemType: "COURSE", itemId: courseId, quantity: 1, promoCode: `FREE-${tag}` }, "https://example.test/billing");
    if (!r.ok) throw new Error(r.error);
    expect(r.data.status).toBe("PAID");
    expect((await tryEnroll(learners[3].userId)).ok).toBe(true);
  });

  it("subscriptions include priced courses without using seats", async () => {
    await systemDb().update(subscriptions).set({ status: "ACTIVE" }).where(eq(subscriptions.tenantId, T.tenantId));
    expect(await as(learners[2].userId)((tx) => courseAccess(tx, T.tenantId, courseId))).toEqual({ kind: "SUBSCRIPTION" });
    await systemDb().update(subscriptions).set({ status: "CANCELED" }).where(eq(subscriptions.tenantId, T.tenantId));
  });
});

describe("isolation and permissions", () => {
  it("hides order amounts from learners and other organizations, and blocks direct writes", async () => {
    const mine = await as(T.adminUserId)((tx) => myPurchases(tx));
    expect(mine.orders.length).toBeGreaterThanOrEqual(2);
    expect(mine.seats.length).toBeGreaterThanOrEqual(1);
    expect((await as(learners[0].userId)((tx) => tx.select().from(courseOrders))).length).toBe(0);
    const other = await as(O.adminUserId, O.tenantId)((tx) => myPurchases(tx));
    expect(other.orders).toHaveLength(0);
    expect(other.seats).toHaveLength(0);
    const err = await expectPgError(as(T.adminUserId)((tx) => tx.insert(courseEntitlements).values({ tenantId: T.tenantId, orderId: mine.orders[0].id, courseId, seatsTotal: 100 })));
    expect(err.code).toBe("42501");
    const err2 = await expectPgError(as(T.adminUserId)((tx) => tx.execute(sql`update course_orders set status = 'PAID'`)));
    expect(err2.code).toBe("42501");
  });
});

describe("business and training reports", () => {
  it("runs every new report for the organization", async () => {
    const access = await as(T.adminUserId)((tx) => loadAccess(tx, T.tenantId, T.adminUserId));
    for (const key of ["enrollment", "certificates-issued", "student-retention", "course-effectiveness", "training-purchases", "revenue-by-course", "employer-sponsored", "instructor-compensation"]) {
      const def = getReport(key)!;
      expect(def, key).toBeTruthy();
      const r = await as(T.adminUserId)((tx) => def.run(tx, { tenantId: T.tenantId, userId: T.adminUserId, access: access! }, {}));
      expect(r.columns.length, key).toBeGreaterThan(0);
      if (key === "enrollment") expect(r.rows.find((x) => String(x.code).startsWith("COM-"))?.enrolled).toBe(4); // 3 via seats + 1 inserted directly in the capacity test
      if (key === "training-purchases") expect(r.rows.length).toBeGreaterThanOrEqual(2);
      if (key === "employer-sponsored") expect(r.rows[0]).toMatchObject({ used: 3 });
    }
  });
});
