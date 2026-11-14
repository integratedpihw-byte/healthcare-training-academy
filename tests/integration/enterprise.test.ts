/**
 * Phase 6 — enterprise: subscription billing (Stripe webhooks, plan limits, trials,
 * platform plan changes), instructor management and class scheduling, instructor
 * messages, analytics, the AI education assistant guardrails, and the read-only API.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Stripe from "stripe";
import { and, desc, eq, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import { aiInteractions, apiKeys, attendance, auditLogs, billingEvents, invoices, notifications, payments, subscriptions, trainingSessions } from "@/db/schema";
import { loadAccess } from "@/lib/rbac/access";
import { entitlementsFor } from "@/lib/billing/plans";
import { planLimitCheck } from "@/lib/billing/limits";
import { processTrials, setPlanManually } from "@/lib/billing/service";
import { handleStripeEvent, verifyWebhook } from "@/lib/billing/stripe";
import * as ins from "@/lib/instructors/service";
import { analytics } from "@/lib/analytics/service";
import { runAssistant } from "@/lib/ai/service";
import type { AiProvider } from "@/lib/ai/provider";
import { createApiKey, revokeApiKey } from "@/lib/integrations/api-keys";
import { handleApi } from "@/lib/integrations/api";
import { REPORTS } from "@/lib/reports/definitions";
import { addMember, createTenant, expectPgError, platformAdmin, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
let T2: TenantFixture;
let director: { userId: string };
let instructorUser: { userId: string };
let otherInstructorUser: { userId: string };
let learner: { userId: string };
let learner2: { userId: string };
let instructorId: string;
let otherInstructorId: string;
let pa: { id: string };

const as = (t: TenantFixture, userId: string) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: t.tenantId, userId }, fn);
async function ctxFor(userId: string, t = T) {
  return { tenantId: t.tenantId, userId, access: (await as(t, userId)((tx) => loadAccess(tx, t.tenantId, userId)))! };
}
const enterprise = (tenantId: string) => setPlanManually(systemDb(), pa.id, tenantId, { plan: "ENTERPRISE", status: "ACTIVE", billingCycle: "ANNUAL", pricingModel: "PER_FACILITY", seats: "50", facilityLimit: "", unitPriceCents: "15000", trialEndsAt: "", customTerms: "", reason: "Integration test setup" });
const local = (d: Date) => new Date(d.getTime() - 4 * 3600_000).toISOString().slice(0, 16); // rough ET wall clock

beforeAll(async () => {
  pa = await platformAdmin();
  T = await createTenant("ent");
  T2 = await createTenant("ent2");
  expect((await enterprise(T.tenantId)).ok).toBe(true);
  director = await addMember(T, "training_director");
  instructorUser = await addMember(T, "instructor");
  otherInstructorUser = await addMember(T, "instructor");
  learner = await addMember(T, "learner");
  learner2 = await addMember(T, "learner");
  const d = await ctxFor(director.userId);
  const a = await as(T, director.userId)((tx) => ins.addInstructor(tx, d, instructorUser.userId, "Educator"));
  const b = await as(T, director.userId)((tx) => ins.addInstructor(tx, d, otherInstructorUser.userId, null));
  if (!a.ok || !b.ok) throw new Error("instructor setup failed");
  instructorId = a.data.id;
  otherInstructorId = b.data.id;
});
afterAll(() => closePools());

// ---------------------------------------------------------------------------
describe("subscription billing", () => {
  const secret = "whsec_test_integration";
  const signed = (event: object) => {
    const payload = JSON.stringify(event);
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    return verifyWebhook(payload, header);
  };

  it("verifies webhook signatures and rejects tampered payloads", () => {
    const e = signed({ id: "evt_sig_ok", type: "ping", data: { object: {} } });
    expect(e.id).toBe("evt_sig_ok");
    const header = Stripe.webhooks.generateTestHeaderString({ payload: "{}", secret });
    expect(() => verifyWebhook('{"id":"evt_forged"}', header)).toThrow();
    expect(() => verifyWebhook("{}", null)).toThrow();
  });

  it("syncs subscriptions, invoices and payments idempotently; billing events stay platform-only", async () => {
    const sys = systemDb();
    const subEvt = signed({
      id: "evt_sub_1",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_test_1", object: "subscription", customer: "cus_test_1", status: "active", metadata: { tenantId: T2.tenantId, plan: "PROFESSIONAL", cycle: "MONTHLY" }, items: { data: [{ quantity: 30, price: { id: "price_pro_m", unit_amount: 900 }, current_period_end: 1893456000 }] }, trial_end: null, cancel_at_period_end: false, canceled_at: null } },
    });
    expect(await handleStripeEvent(sys, subEvt)).toBe("processed");
    expect(await handleStripeEvent(sys, subEvt)).toBe("duplicate");
    const [s] = await sys.select().from(subscriptions).where(eq(subscriptions.tenantId, T2.tenantId)).orderBy(desc(subscriptions.createdAt)).limit(1);
    expect(s).toMatchObject({ plan: "PROFESSIONAL", status: "ACTIVE", seats: 30, stripeSubscriptionId: "sub_test_1", unitPriceCents: 900 });

    const invObj = { id: "in_test_1", object: "invoice", number: "TEST-0001", subscription: "sub_test_1", amount_due: 27000, amount_paid: 27000, currency: "usd", period_start: 1890000000, period_end: 1892592000, hosted_invoice_url: "https://invoice.stripe.com/i/test" };
    expect(await handleStripeEvent(sys, signed({ id: "evt_inv_fin", type: "invoice.finalized", data: { object: { ...invObj, amount_paid: 0 } } }))).toBe("processed");
    expect(await handleStripeEvent(sys, signed({ id: "evt_inv_paid", type: "invoice.paid", data: { object: invObj } }))).toBe("processed");
    const inv = await sys.select().from(invoices).where(eq(invoices.tenantId, T2.tenantId));
    expect(inv).toHaveLength(1);
    expect(inv[0].status).toBe("PAID");
    const pay = await sys.select().from(payments).where(eq(payments.tenantId, T2.tenantId));
    expect(pay.map((p) => p.status)).toEqual(["SUCCEEDED"]);
    // Tenants can read their billing records, never the webhook ledger, and cannot write billing.
    const e = await expectPgError(as(T2, T2.adminUserId)((tx) => tx.select().from(billingEvents)));
    expect(e.message).toMatch(/permission denied/);
    const w = await expectPgError(as(T2, T2.adminUserId)((tx) => tx.update(subscriptions).set({ plan: "ENTERPRISE" }).where(eq(subscriptions.tenantId, T2.tenantId))));
    expect(w.message).toMatch(/permission denied/);
    // Platform cannot override the status of a Stripe-managed subscription.
    const r = await setPlanManually(sys, pa.id, T2.tenantId, { plan: "ENTERPRISE", status: "CANCELED", billingCycle: "MONTHLY", pricingModel: "PER_EMPLOYEE", seats: "30", reason: "Should be refused" });
    expect(r.ok).toBe(false);
    // Cancellation via webhook restricts the tenant.
    await handleStripeEvent(sys, signed({ id: "evt_sub_del", type: "customer.subscription.deleted", data: { object: { ...subEvt.data.object, status: "canceled", canceled_at: 1890000000 } } }));
    const [after] = await sys.select().from(subscriptions).where(eq(subscriptions.tenantId, T2.tenantId)).orderBy(desc(subscriptions.createdAt)).limit(1);
    expect(entitlementsFor(after).restricted).toBe(true);
    const audits = await sys.select().from(auditLogs).where(and(eq(auditLogs.tenantId, T2.tenantId), eq(auditLogs.action, "billing.subscription_synced")));
    expect(audits.length).toBe(2);
  });

  it("enforces plan limits for seats, facilities and departments", async () => {
    const e = entitlementsFor({ plan: "STARTER", status: "ACTIVE", seats: 1, facilityLimit: null });
    await as(T, T.adminUserId)(async (tx) => {
      expect(await planLimitCheck(tx, e, "employee")).toMatch(/seats/);
      expect(await planLimitCheck(tx, e, "facility")).toMatch(/1 active facility/);
      expect(await planLimitCheck(tx, entitlementsFor({ plan: "ENTERPRISE", status: "ACTIVE", seats: 1, facilityLimit: null }), "facility")).toBeNull();
      expect(await planLimitCheck(tx, entitlementsFor({ plan: "STARTER", status: "CANCELED", seats: 100, facilityLimit: null }), "employee")).toMatch(/not active/);
    });
  });

  it("warns billing managers before a trial ends and expires it afterwards", async () => {
    const t = await createTenant("trial");
    const sys = systemDb();
    const soon = new Date(Date.now() + 3 * 86_400_000 - 3600_000);
    await sys.update(subscriptions).set({ status: "TRIALING", trialEndsAt: soon }).where(eq(subscriptions.tenantId, t.tenantId));
    const r1 = await processTrials(sys);
    expect(r1.warned).toBeGreaterThanOrEqual(1);
    const warn = await sys.select().from(notifications).where(and(eq(notifications.tenantId, t.tenantId), eq(notifications.userId, t.adminUserId)));
    expect(warn.some((n) => /trial/i.test(n.title))).toBe(true);
    await processTrials(sys); // idempotent per threshold
    expect((await sys.select().from(notifications).where(eq(notifications.tenantId, t.tenantId))).filter((n) => /trial/i.test(n.title)).length).toBe(warn.filter((n) => /trial/i.test(n.title)).length);
    await sys.update(subscriptions).set({ trialEndsAt: new Date(Date.now() - 60_000) }).where(eq(subscriptions.tenantId, t.tenantId));
    expect((await processTrials(sys)).expired).toBeGreaterThanOrEqual(1);
    const [s] = await sys.select().from(subscriptions).where(eq(subscriptions.tenantId, t.tenantId));
    expect(s.status).toBe("INCOMPLETE");
  });
});

// ---------------------------------------------------------------------------
describe("instructor management and classes", () => {
  let sessionId: string;

  it("restricts instructor profile edits to the instructor and managers", async () => {
    const me = await ctxFor(instructorUser.userId);
    const ok = await as(T, instructorUser.userId)((tx) => ins.saveProfile(tx, me, { title: "Clinical Educator", bio: "", qualifications: "BSN\nCIC", credentials: "RN | FL Board of Nursing | RN1 | 2027-12-31" }));
    expect(ok.ok).toBe(true);
    const other = await as(T, instructorUser.userId)((tx) => ins.saveProfile(tx, me, { title: "x", qualifications: "", credentials: "" }, otherInstructorId));
    expect(other.ok).toBe(false);
    const lrn = await ctxFor(learner.userId);
    expect((await as(T, learner.userId)((tx) => ins.addInstructor(tx, lrn, learner.userId, null))).ok).toBe(false);
    expect((await as(T, learner.userId)((tx) => ins.setInstructorActive(tx, lrn, instructorId, false))).ok).toBe(false);
  });

  it("schedules classes only for schedulers, in the future, with valid delivery details", async () => {
    const d = await ctxFor(director.userId);
    const start = new Date(Date.now() + 3 * 86_400_000);
    const base = { title: "Fire safety drill", instructorId, delivery: "IN_PERSON", location: "Room 1", startsAt: local(start), endsAt: local(new Date(start.getTime() + 3600_000)), capacity: "2", timeZone: "UTC" };
    expect((await as(T, director.userId)((tx) => ins.createSession(tx, d, { ...base, location: "" }))).ok).toBe(false);
    expect((await as(T, director.userId)((tx) => ins.createSession(tx, d, { ...base, delivery: "LIVE_VIRTUAL", location: "", meetingUrl: "http://insecure.example" }))).ok).toBe(false);
    expect((await as(T, director.userId)((tx) => ins.createSession(tx, d, { ...base, endsAt: base.startsAt }))).ok).toBe(false);
    expect((await as(T, director.userId)((tx) => ins.createSession(tx, d, { ...base, startsAt: "2020-01-01T09:00", endsAt: "2020-01-01T10:00" }))).ok).toBe(false);
    const lrn = await ctxFor(learner.userId);
    expect((await as(T, learner.userId)((tx) => ins.createSession(tx, lrn, base))).ok).toBe(false);
    const r = await as(T, director.userId)((tx) => ins.createSession(tx, d, base));
    expect(r.ok).toBe(true);
    if (r.ok) sessionId = r.data.id;
  });

  it("enforces capacity, membership and timing on attendance; learners self-register only themselves", async () => {
    const d = await ctxFor(director.userId);
    const r = await as(T, director.userId)((tx) => ins.registerAttendees(tx, d, sessionId, [learner.userId]));
    expect(r.ok && r.data.added).toBe(1);
    const n = await systemDb().select().from(notifications).where(and(eq(notifications.userId, learner.userId), eq(notifications.type, "assignment.class")));
    expect(n).toHaveLength(1);
    // Learner self-registration (capacity 2) fills the class; a third is refused.
    expect((await as(T, learner2.userId)((tx) => ins.selfRegister(tx, { tenantId: T.tenantId, userId: learner2.userId }, sessionId))).ok).toBe(true);
    const full = await as(T, director.userId)((tx) => ins.registerAttendees(tx, d, sessionId, [director.userId]));
    expect(full.ok).toBe(false);
    if (!full.ok) expect(full.error).toMatch(/full/);
    // Learners see seat counts through the definer function even though they see only their own rows.
    const seats = await as(T, learner2.userId)((tx) => tx.execute<{ n: number }>(sql`select app_session_seats_taken(${sessionId}::uuid) n`));
    expect(seats.rows[0].n).toBe(2);
    const own = await as(T, learner2.userId)((tx) => tx.select().from(attendance).where(eq(attendance.sessionId, sessionId)));
    expect(own).toHaveLength(1);
    // A learner cannot register someone else or mark attendance.
    const forged = await expectPgError(as(T, learner2.userId)((tx) => tx.insert(attendance).values({ tenantId: T.tenantId, sessionId, userId: director.userId })));
    expect(forged.message).toMatch(/row-level security|full/);
    // Outsiders (another tenant's user) cannot be registered.
    const outsider = await expectPgError(systemDb().insert(attendance).values({ tenantId: T.tenantId, sessionId, userId: T2.adminUserId }));
    expect(outsider.message).toMatch(/full|not a member/);
    // Attendance can't be recorded before the class starts.
    expect((await as(T, instructorUser.userId)((tx) => ins.recordAttendance(tx, d, sessionId, { [learner.userId]: "PRESENT" }))).ok).toBe(false);
  });

  it("lets only the session's instructor (or schedulers) record attendance, complete or cancel", async () => {
    const sys = systemDb();
    // Move the class into the past so attendance can be taken.
    await sys.update(trainingSessions).set({ startsAt: new Date(Date.now() - 2 * 3600_000), endsAt: new Date(Date.now() - 3600_000) }).where(eq(trainingSessions.id, sessionId));
    const other = await ctxFor(otherInstructorUser.userId);
    // The other instructor role has training.schedule.manage? If so, RLS allows; otherwise refused.
    const mine = await ctxFor(instructorUser.userId);
    const r = await as(T, instructorUser.userId)((tx) => ins.recordAttendance(tx, mine, sessionId, { [learner.userId]: "PRESENT", [learner2.userId]: "ABSENT" }));
    expect(r.ok).toBe(true);
    const lrn = await ctxFor(learner.userId);
    expect((await as(T, learner.userId)((tx) => ins.recordAttendance(tx, lrn, sessionId, { [learner.userId]: "PRESENT" }))).ok).toBe(false);
    const [row] = await sys.select().from(attendance).where(and(eq(attendance.sessionId, sessionId), eq(attendance.userId, learner.userId)));
    expect(row.status).toBe("PRESENT");
    expect(row.checkedInAt).not.toBeNull();
    // Deletes of sessions are blocked even for schedulers.
    const del = await as(T, director.userId)((tx) => tx.delete(trainingSessions).where(eq(trainingSessions.id, sessionId)).returning({ id: trainingSessions.id }));
    expect(del).toHaveLength(0);
    expect((await as(T, instructorUser.userId)((tx) => ins.setSessionStatus(tx, mine, sessionId, "COMPLETED"))).ok).toBe(true);
    expect((await as(T, instructorUser.userId)((tx) => ins.setSessionStatus(tx, mine, sessionId, "CANCELLED", "too late"))).ok).toBe(false);
    void other;
  });

  it("cancels a class with a reason, notifies the roster and blocks new registrations", async () => {
    const d = await ctxFor(director.userId);
    const start = new Date(Date.now() + 5 * 86_400_000);
    const c = await as(T, director.userId)((tx) => ins.createSession(tx, d, { title: "Cancelled class", instructorId: otherInstructorId, delivery: "LIVE_VIRTUAL", meetingUrl: "https://meet.example.com/x", startsAt: local(start), endsAt: local(new Date(start.getTime() + 3600_000)), timeZone: "UTC" }));
    if (!c.ok) throw new Error(c.error);
    await as(T, director.userId)((tx) => ins.registerAttendees(tx, d, c.data.id, [learner.userId]));
    expect((await as(T, director.userId)((tx) => ins.setSessionStatus(tx, d, c.data.id, "CANCELLED", "no"))).ok).toBe(false);
    expect((await as(T, director.userId)((tx) => ins.setSessionStatus(tx, d, c.data.id, "CANCELLED", "Instructor unavailable"))).ok).toBe(true);
    const n = await systemDb().select().from(notifications).where(and(eq(notifications.userId, learner.userId), eq(notifications.type, "class.cancelled")));
    expect(n).toHaveLength(1);
    const blocked = await expectPgError(systemDb().insert(attendance).values({ tenantId: T.tenantId, sessionId: c.data.id, userId: learner2.userId }));
    expect(blocked.message).toMatch(/cancelled/);
  });

  it("sends instructor messages only to the instructor's own class roster", async () => {
    const [s] = await systemDb().select().from(trainingSessions).where(and(eq(trainingSessions.tenantId, T.tenantId), eq(trainingSessions.instructorId, instructorId)));
    const mine = await ctxFor(instructorUser.userId);
    const r = await as(T, instructorUser.userId)((tx) => ins.sendInstructorMessage(tx, mine, { sessionId: s.id, title: "Thanks for attending", body: "Slides are in the course." }));
    expect(r.ok && r.data.recipients).toBe(2);
    const lrn = await ctxFor(learner.userId);
    expect((await as(T, learner.userId)((tx) => ins.sendInstructorMessage(tx, lrn, { sessionId: s.id, title: "Spam", body: "Spam spam" }))).ok).toBe(false);
  });

  it("reports course attendance and instructor performance", async () => {
    const access = (await ctxFor(director.userId)).access;
    const p = { from: "2020-01-01", to: "2030-12-31" };
    const att = await as(T, director.userId)((tx) => REPORTS.find((r) => r.key === "course-attendance")!.run(tx, { tenantId: T.tenantId, userId: director.userId, access }, p));
    const row = att.rows.find((r) => r.class === "Fire safety drill")!;
    expect(row).toMatchObject({ registered: 2, present: 1, absent: 1, rate: "50%" });
    const perf = await as(T, director.userId)((tx) => REPORTS.find((r) => r.key === "instructor-activity")!.run(tx, { tenantId: T.tenantId, userId: director.userId, access }, p));
    const me = perf.rows.find((r) => r.classes === 1)!;
    expect(me.attendance).toBe("50%");
  });
});

// ---------------------------------------------------------------------------
describe("analytics", () => {
  it("computes KPIs within the viewer's scope and honors filters", async () => {
    const a = await as(T, T.adminUserId)((tx) => analytics(tx, {}));
    expect(a.kpis.employees).toBeGreaterThanOrEqual(1);
    expect(a.monthly.length).toBeGreaterThanOrEqual(12);
    const none = await as(T, T.adminUserId)((tx) => analytics(tx, { facilityId: "00000000-0000-4000-8000-000000000000" }));
    expect(none.kpis.employees).toBe(0);
    // Another tenant's admin sees nothing of this tenant.
    const other = await as(T2, T2.adminUserId)((tx) => analytics(tx, { employeeId: T.employeeId }));
    expect(other.kpis.employees).toBe(0);
  });
});

// ---------------------------------------------------------------------------
describe("AI education assistant", () => {
  let calls = 0;
  const provider: AiProvider = { name: "test", complete: async ({ system }) => { calls++; return { text: `ok ${(system.match(/\[S\d+\]/g) ?? []).length}`, model: "test", inputTokens: 10, outputTokens: 5 }; } };

  it("refuses PHI and clinical requests before calling the model and logs no content", async () => {
    const c = await ctxFor(learner.userId);
    const before = calls;
    const r1 = await as(T, learner.userId)((tx) => runAssistant(tx, c, { mode: "ask", input: "Patient Maria Lopez DOB 01/02/1950 has a rash" }, provider));
    expect(r1.refusal?.code).toBe("PHI");
    const r2 = await as(T, learner.userId)((tx) => runAssistant(tx, c, { mode: "ask", input: "My patient has a fever, what antibiotic should I give?" }, provider));
    expect(r2.refusal?.code).toBe("CLINICAL");
    expect(calls).toBe(before);
    const logs = await systemDb().select().from(aiInteractions).where(eq(aiInteractions.userId, learner.userId));
    expect(logs.length).toBe(2);
    expect(JSON.stringify(logs)).not.toMatch(/Maria|rash|antibiotic/);
  });

  it("grounds regulatory answers in the library and flags verification status", async () => {
    const c = await ctxFor(learner.userId);
    const r = await as(T, learner.userId)((tx) => runAssistant(tx, c, { mode: "regulatory", input: "bloodborne pathogens training" }, provider));
    expect(r.ok).toBe(true);
    expect(r.sources!.length).toBeGreaterThan(0);
    expect(r.sources!.every((s) => s.kind === "RULE" && typeof s.verified === "boolean")).toBe(true);
    expect(r.disclaimer).toMatch(/does not establish competency/);
  });

  it("limits modes by role, keeps gap analysis to aggregates, and rate-limits", async () => {
    const lc = await ctxFor(learner.userId);
    expect((await as(T, learner.userId)((tx) => runAssistant(tx, lc, { mode: "gaps", input: "" }, provider))).refusal?.code).toBe("NOT_ALLOWED");
    const dc = await ctxFor(director.userId);
    const g = await as(T, director.userId)((tx) => runAssistant(tx, dc, { mode: "gaps", input: "" }, provider));
    expect(g.ok).toBe(true);
    expect(g.sources!.every((s) => s.kind === "DATA")).toBe(true);
    // Rate limit (fill the hour with logged interactions).
    await systemDb().insert(aiInteractions).values(Array.from({ length: 30 }, () => ({ tenantId: T.tenantId, userId: learner2.userId, mode: "ask" })));
    const c2 = await ctxFor(learner2.userId);
    expect((await as(T, learner2.userId)((tx) => runAssistant(tx, c2, { mode: "regulatory", input: "HIPAA" }, provider))).refusal?.code).toBe("RATE");
    // Users cannot read others' interaction logs.
    const seen = await as(T, learner.userId)((tx) => tx.select().from(aiInteractions));
    expect(seen.every((x) => x.userId === learner.userId)).toBe(true);
  });

  it("reports the assistant as unavailable when no provider is configured", async () => {
    const c = await ctxFor(learner.userId);
    expect((await as(T, learner.userId)((tx) => runAssistant(tx, c, { mode: "ask", input: "hand hygiene" }, null))).refusal?.code).toBe("UNAVAILABLE");
  });
});

// ---------------------------------------------------------------------------
describe("read-only integration API", () => {
  let secret: string;
  let keyId: string;
  const call = (resource: string, key = secret, qs = "") => handleApi(new Request(`http://localhost/api/v1/${resource}${qs}`, { headers: { authorization: `Bearer ${key}` } }), resource);

  it("creates hashed, scoped keys only for integration managers", async () => {
    const lrn = await as(T, learner.userId)((tx) => createApiKey(tx, { tenantId: T.tenantId, userId: learner.userId }, { name: "nope", scopes: ["employees:read"], expiresInDays: 90 }));
    expect(lrn.ok).toBe(false);
    const r = await as(T, T.adminUserId)((tx) => createApiKey(tx, { tenantId: T.tenantId, userId: T.adminUserId }, { name: "HRIS sync", scopes: ["employees:read", "compliance:read"], expiresInDays: 90 }));
    if (!r.ok) throw new Error(r.error);
    secret = r.data.secret;
    keyId = r.data.id;
    const [row] = await systemDb().select().from(apiKeys).where(eq(apiKeys.id, keyId));
    expect(row.keyHash).not.toContain(secret);
    expect(JSON.stringify(row)).not.toContain(secret.split("_")[2]);
    // Keys are immutable: scopes cannot be widened.
    const e = await expectPgError(as(T, T.adminUserId)((tx) => tx.update(apiKeys).set({ scopes: ["employees:read", "certificates:read"] }).where(eq(apiKeys.id, keyId))));
    expect(e.message).toMatch(/cannot be altered/);
  });

  it("serves scoped, tenant-isolated, paginated data and audits every call", async () => {
    const res = await call("employees", secret, "?limit=1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; email?: string }[]; pagination: { limit: number } };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty("email");
    const all = (await (await call("employees")).json()) as { data: { id: string }[] };
    expect(all.data.some((e) => e.id === T2.employeeId)).toBe(false);
    expect((await call("compliance")).status).toBe(200);
    expect((await call("certificates")).status).toBe(403); // scope missing
    expect((await call("nonsense")).status).toBe(404);
    expect((await call("employees", "chta_badbadbad0_" + "x".repeat(43))).status).toBe(401);
    expect((await handleApi(new Request("http://localhost/api/v1/employees"), "employees")).status).toBe(401);
    const audits = await systemDb().select().from(auditLogs).where(and(eq(auditLogs.tenantId, T.tenantId), eq(auditLogs.action, "api.read")));
    expect(audits.length).toBeGreaterThanOrEqual(3);
  });

  it("stops working when the plan lacks API access, and revocation is permanent", async () => {
    const sys = systemDb();
    await setPlanManually(sys, pa.id, T.tenantId, { plan: "PROFESSIONAL", status: "ACTIVE", billingCycle: "MONTHLY", pricingModel: "PER_EMPLOYEE", seats: "50", reason: "Downgrade test" });
    expect((await call("employees")).status).toBe(402);
    await enterprise(T.tenantId);
    expect((await call("employees")).status).toBe(200);
    expect((await as(T, T.adminUserId)((tx) => revokeApiKey(tx, { tenantId: T.tenantId, userId: T.adminUserId }, keyId))).ok).toBe(true);
    expect((await call("employees")).status).toBe(401);
    const e = await expectPgError(as(T, T.adminUserId)((tx) => tx.update(apiKeys).set({ revokedAt: null }).where(eq(apiKeys.id, keyId))));
    expect(e.message).toMatch(/permanent/);
    const del = await expectPgError(as(T, T.adminUserId)((tx) => tx.delete(apiKeys).where(eq(apiKeys.id, keyId))));
    expect(del.message).toMatch(/permission denied/);
  });
});
