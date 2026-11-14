/**
 * Billing administration (platform client): manual plan management for custom
 * enterprise pricing and organizations not billed through Stripe, trial expiry, and
 * usage summaries. Billing data never touches training records.
 */
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import { subscriptions } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import type { ServiceResult } from "@/lib/tenancy/service";
import { PLANS, type PlanCode } from "./plans";

export const manualPlanSchema = z.object({
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE", "INDIVIDUAL_LEARNER"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL", "CUSTOM"]),
  pricingModel: z.enum(["PER_EMPLOYEE", "PER_FACILITY", "FLAT", "CUSTOM"]),
  status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE"]),
  seats: z.coerce.number().int().min(1).max(100000),
  facilityLimit: z.preprocess((v) => v ?? "", z.union([z.literal(""), z.coerce.number().int().min(0).max(10000)]).transform((v) => (v === "" ? null : v))),
  unitPriceCents: z.preprocess((v) => v ?? "", z.union([z.literal(""), z.coerce.number().int().min(0).max(100_000_000)]).transform((v) => (v === "" ? null : v))),
  trialEndsAt: z.preprocess((v) => v ?? "", z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).transform((v) => (v ? new Date(`${v}T23:59:59Z`) : null))),
  customTerms: z.string().trim().max(2000).optional().or(z.literal("")).transform((v) => v || null),
  reason: z.string().trim().min(5, "Explain the change").max(500),
});

export async function setPlanManually(sys: Db, adminUserId: string, tenantId: string, raw: unknown): Promise<ServiceResult<null>> {
  const p = manualPlanSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const { reason, ...v } = p.data;
  const [before] = await sys.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  if (before?.stripeSubscriptionId && v.status !== before.status) return { ok: false, error: "This subscription is managed by Stripe; change its status in Stripe (the webhook keeps it in sync)." };
  if (before) await sys.update(subscriptions).set(v).where(eq(subscriptions.id, before.id));
  else await sys.insert(subscriptions).values({ tenantId, ...v });
  await writeAudit(sys, { tenantId, actorUserId: adminUserId, action: "billing.plan_set_by_platform", entityType: "subscription", entityId: before?.id ?? null, before: before ? { plan: before.plan, status: before.status, seats: before.seats, unitPriceCents: before.unitPriceCents } : null, after: { ...v, reason } });
  return { ok: true, data: null };
}

/** Usage against plan limits for the billing page. */
export async function usage(tx: Tx) {
  const [r] = (
    await tx.execute<{ employees: number; facilities: number; departments: number; learners: number }>(sql`
      select (select count(*)::int from employees where employment_status <> 'TERMINATED') employees,
             (select count(*)::int from facilities where is_active) facilities,
             (select count(*)::int from departments) departments,
             (select count(*)::int from memberships where status = 'ACTIVE') learners`)
  ).rows;
  return r;
}

/**
 * Daily: warn organization billing managers 7/3/1 days before a trial ends, and move
 * expired trials without a paid subscription to INCOMPLETE (restricted: records stay
 * readable, nothing new can be added until a plan is chosen).
 */
export async function processTrials(sys: Db, now = new Date()): Promise<{ warned: number; expired: number }> {
  let warned = 0;
  const trials = await sys.execute<{ id: string; tenant_id: string; plan: PlanCode; days: number }>(sql`
    select s.id, s.tenant_id, s.plan, ceil(extract(epoch from (s.trial_ends_at - ${now.toISOString()}::timestamptz)) / 86400)::int days
      from subscriptions s join tenants t on t.id = s.tenant_id
     where s.status = 'TRIALING' and s.trial_ends_at is not null and s.stripe_subscription_id is null and t.status = 'ACTIVE'`);
  for (const t of trials.rows) {
    if (![7, 3, 1].includes(t.days)) continue;
    const managers = await sys.execute<{ user_id: string }>(sql`
      select distinct m.user_id from memberships m join membership_roles mr on mr.membership_id = m.id
        join role_permissions rp on rp.role_id = mr.role_id join permissions p on p.id = rp.permission_id
       where m.tenant_id = ${t.tenant_id}::uuid and m.status = 'ACTIVE' and p.key = 'billing.manage'`);
    warned += await notify(
      sys,
      managers.rows.map((m) => ({ tenantId: t.tenant_id, userId: m.user_id, type: "billing.trial_ending", title: `Your ${PLANS[t.plan].name} trial ends in ${t.days} day${t.days === 1 ? "" : "s"}`, body: "Choose a plan under Billing to keep adding staff and content. Training records and certificates are never deleted.", link: "/billing", dedupeKey: `trial:${t.id}:${t.days}:${m.user_id}` })),
    );
  }
  const expired = await sys.execute<{ id: string; tenant_id: string }>(sql`
    update subscriptions set status = 'INCOMPLETE', updated_at = now()
     where status = 'TRIALING' and trial_ends_at < ${now.toISOString()}::timestamptz and stripe_subscription_id is null
     returning id, tenant_id`);
  for (const e of expired.rows) await writeAudit(sys, { tenantId: e.tenant_id, actorUserId: null, action: "billing.trial_expired", entityType: "subscription", entityId: e.id });
  return { warned, expired: expired.rows.length };
}
