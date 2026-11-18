// Notifications, immutable audit log, and billing (kept separate from training records).
import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  uniqueIndex,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  billingCycle,
  createdAt,
  emailStatus,
  filePurpose,
  fileScanStatus,
  invoiceStatus,
  notificationChannel,
  paymentStatus,
  pk,
  planCode,
  pricingModel,
  subscriptionStatus,
  tstz,
  updatedAt,
} from "./_shared";
import { employees, tenantIdColumn as tenantId, tenants, users } from "./core";
import { courses } from "./learning";

export const notifications = pgTable(
  "notifications",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text().notNull(),
    channel: notificationChannel().notNull().default("IN_APP"),
    title: text().notNull(),
    body: text().notNull(),
    link: text(),
    /** Email preference bucket: assignments | results | announcements | critical | none. */
    category: text().notNull().default("critical"),
    /** Prevents duplicate reminders (e.g. "expiry:<certId>:30"). */
    dedupeKey: text(),
    readAt: tstz(),
    sentAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.tenantId, t.dedupeKey), index().on(t.tenantId, t.userId, t.readAt)],
);

export const notificationPreferences = pgTable("notification_preferences", {
  id: pk(),
  tenantId: tenantId().unique(),
  expiryLeadDays: integer().array().notNull().default([90, 60, 30, 15, 7]),
  emailEnabled: boolean().notNull().default(true),
  smsEnabled: boolean().notNull().default(false),
  escalateAfterDays: integer().notNull().default(7),
  /** Days before a certificate expires that a renewal assignment is created. */
  renewalWindowDays: integer().notNull().default(60),
  /** Default due date (days from assignment) when no requirement specifies one. */
  defaultDueDays: integer().notNull().default(30),
  updatedAt: updatedAt(),
});

/** Per-user email choices. Expiration, overdue and compliance alerts are always emailed. */
export const userNotificationSettings = pgTable(
  "user_notification_settings",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emailAssignments: boolean().notNull().default(true),
    emailResults: boolean().notNull().default(true),
    emailAnnouncements: boolean().notNull().default(true),
    /** Optional SMS for critical alerts only (expirations, overdue training, compliance). */
    smsOptIn: boolean().notNull().default(false),
    /** E.164, e.g. +18135550142. */
    smsPhone: text(),
    smsConsentAt: tstz(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.tenantId, t.userId)],
);

/**
 * Outbound email queue. Rows are written only by a database trigger on notifications
 * (which applies organization and user preferences) and delivered by the platform worker.
 * The application role has no access.
 */
export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid().references(() => users.id, { onDelete: "cascade" }),
    notificationId: uuid().references(() => notifications.id, { onDelete: "set null" }),
    toEmail: text().notNull(),
    subject: text().notNull(),
    body: text().notNull(),
    link: text(),
    status: emailStatus().notNull().default("PENDING"),
    attempts: integer().notNull().default(0),
    lastError: text(),
    nextAttemptAt: tstz().notNull().defaultNow(),
    providerId: text(),
    sentAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.status, t.nextAttemptAt), index().on(t.tenantId)],
);

/** Administrator announcements (spec §18). Recipients receive notifications. */
export const announcements = pgTable(
  "announcements",
  {
    id: pk(),
    tenantId: tenantId(),
    authorId: uuid().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    /** {kind: "all" | "facility" | "role", facilityId?, roleId?} */
    audience: jsonb().notNull(),
    recipientCount: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId, t.createdAt)],
);

/** Snapshot of each onboarding / requirements evaluation (spec §12 steps 1–6). */
export const onboardingRuns = pgTable(
  "onboarding_runs",
  {
    id: pk(),
    tenantId: tenantId(),
    employeeId: uuid()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    runById: uuid(),
    /** [{requirementId, title, kind, targetId, action, assignmentId?, dueDate?, note?}] */
    results: jsonb().notNull().default([]),
    assignedCount: integer().notNull().default(0),
    notifiedAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId, t.employeeId)],
);

/** Append-only. UPDATE/DELETE blocked by trigger; rows are SHA-256 hash-chained per tenant. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    tenantId: uuid().references(() => tenants.id),
    actorUserId: uuid(),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text(),
    before: jsonb(),
    after: jsonb(),
    ipAddress: text(),
    createdAt: createdAt(),
    prevHash: text(),
    hash: text(),
  },
  (t) => [index().on(t.tenantId, t.createdAt), index().on(t.entityType, t.entityId)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: pk(),
    tenantId: tenantId(),
    plan: planCode().notNull(),
    billingCycle: billingCycle().notNull().default("MONTHLY"),
    pricingModel: pricingModel().notNull().default("PER_EMPLOYEE"),
    status: subscriptionStatus().notNull().default("TRIALING"),
    seats: integer().notNull().default(10),
    facilityLimit: integer(),
    unitPriceCents: integer(),
    stripeCustomerId: text(),
    stripeSubscriptionId: text().unique(),
    trialEndsAt: tstz(),
    currentPeriodEnd: tstz(),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    canceledAt: tstz(),
    stripePriceId: text(),
    /** Custom enterprise pricing terms (platform administrators). */
    customTerms: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.tenantId)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: pk(),
    tenantId: tenantId(),
    subscriptionId: uuid()
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    number: text().notNull().unique(),
    status: invoiceStatus().notNull().default("DRAFT"),
    amountDueCents: integer().notNull(),
    amountPaidCents: integer().notNull().default(0),
    currency: text().notNull().default("usd"),
    periodStart: tstz().notNull(),
    periodEnd: tstz().notNull(),
    stripeInvoiceId: text().unique(),
    hostedUrl: text(),
    issuedAt: createdAt(),
  },
  (t) => [index().on(t.tenantId)],
);

export const payments = pgTable(
  "payments",
  {
    id: pk(),
    tenantId: tenantId(),
    invoiceId: uuid().references(() => invoices.id, { onDelete: "set null" }),
    amountCents: integer().notNull(),
    currency: text().notNull().default("usd"),
    status: paymentStatus().notNull(),
    stripePaymentIntentId: text().unique(),
    paidAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId)],
);


/** Stripe webhook events already processed (idempotency). Platform-only. */
export const billingEvents = pgTable("billing_events", {
  id: text().primaryKey(),
  type: text().notNull(),
  tenantId: uuid(),
  processedAt: createdAt(),
});

/**
 * AI assistant usage log. Deliberately stores no prompt or answer text (privacy by
 * design): mode, cited sources, refusal reason and token counts only.
 */
export const aiInteractions = pgTable(
  "ai_interactions",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid().notNull(),
    mode: text().notNull(),
    sources: jsonb().notNull().default([]),
    refused: boolean().notNull().default(false),
    refusalReason: text(),
    model: text(),
    inputTokens: integer(),
    outputTokens: integer(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId, t.createdAt), index().on(t.userId, t.createdAt)],
);

/** Organization API keys for the read-only integration API (Enterprise plan). */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: pk(),
    tenantId: tenantId(),
    name: text().notNull(),
    /** First characters shown to identify the key; the secret itself is never stored. */
    prefix: text().notNull().unique(),
    keyHash: text().notNull().unique(),
    scopes: text().array().notNull(),
    createdById: uuid().notNull(),
    lastUsedAt: tstz(),
    expiresAt: tstz(),
    revokedAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId)],
);

/** Outbound SMS queue (critical alerts only). Written by trigger; platform-only. */
export const smsOutbox = pgTable(
  "sms_outbox",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid().references(() => users.id, { onDelete: "cascade" }),
    notificationId: uuid().references(() => notifications.id, { onDelete: "set null" }),
    toPhone: text().notNull(),
    body: text().notNull(),
    status: emailStatus().notNull().default("PENDING"),
    attempts: integer().notNull().default(0),
    lastError: text(),
    nextAttemptAt: tstz().notNull().defaultNow(),
    providerId: text(),
    sentAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.status, t.nextAttemptAt)],
);

/**
 * Uploaded files (spec §25). Bytes live in private object storage; this row holds
 * metadata. A file is readable only when its parent record (license, competency
 * assessment or lesson) is readable by the same user — enforced by RLS.
 */
export const files = pgTable(
  "files",
  {
    id: pk(),
    tenantId: tenantId(),
    purpose: filePurpose().notNull(),
    entityId: uuid().notNull(),
    filename: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: integer().notNull(),
    sha256: text().notNull(),
    storageKey: text().notNull().unique(),
    scanStatus: fileScanStatus().notNull(),
    uploadedById: uuid().notNull(),
    deletedAt: tstz(),
    deletedById: uuid(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), index().on(t.purpose, t.entityId)],
);

// ---------------------------------------------------------------------------
// Training revenue (expansion brief §8): course prices, training packages, promo
// codes, course orders, seat entitlements and instructor compensation rates.
// Prices, packages and promo codes are platform-owned. Orders and entitlements are
// tenant-owned but written only by platform services (read-only to the app role).
// ---------------------------------------------------------------------------

export const coursePrices = pgTable(
  "course_prices",
  {
    id: pk(),
    courseId: uuid()
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    priceCents: integer().notNull(),
    currency: text().notNull().default("usd"),
    isActive: boolean().notNull().default(true),
    createdById: uuid(),
    createdAt: createdAt(),
  },
  (t) => [
    index().on(t.courseId),
    uniqueIndex("course_prices_one_active_uq").on(t.courseId).where(sql`is_active`),
    check("course_prices_amount_ck", sql`price_cents >= 0 and price_cents <= 10000000`),
  ],
);

export const trainingPackages = pgTable(
  "training_packages",
  {
    id: pk(),
    code: text().notNull().unique(),
    name: text().notNull(),
    description: text(),
    /** Who it is designed for, e.g. "Home health agencies". */
    audience: text(),
    courseIds: uuid().array().notNull().default(sql`'{}'::uuid[]`),
    priceCents: integer().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  () => [check("training_packages_amount_ck", sql`price_cents >= 0 and price_cents <= 100000000`)],
);

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: pk(),
    code: text().notNull().unique(),
    description: text(),
    percentOff: integer(),
    amountOffCents: integer(),
    maxRedemptions: integer(),
    redeemedCount: integer().notNull().default(0),
    startsAt: tstz(),
    expiresAt: tstz(),
    courseId: uuid().references(() => courses.id, { onDelete: "cascade" }),
    packageId: uuid().references(() => trainingPackages.id, { onDelete: "cascade" }),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  () => [
    check("promo_codes_one_discount_ck", sql`(percent_off is null) <> (amount_off_cents is null)`),
    check("promo_codes_percent_ck", sql`percent_off is null or (percent_off between 1 and 100)`),
    check("promo_codes_amount_ck", sql`amount_off_cents is null or amount_off_cents > 0`),
    check("promo_codes_uppercase_ck", sql`code = upper(code)`),
  ],
);

export const courseOrders = pgTable(
  "course_orders",
  {
    id: pk(),
    tenantId: tenantId(),
    buyerUserId: uuid()
      .notNull()
      .references(() => users.id),
    itemType: text().notNull(),
    courseId: uuid().references(() => courses.id),
    packageId: uuid().references(() => trainingPackages.id),
    itemName: text().notNull(),
    quantity: integer().notNull().default(1),
    unitPriceCents: integer().notNull(),
    subtotalCents: integer().notNull(),
    discountCents: integer().notNull().default(0),
    totalCents: integer().notNull(),
    currency: text().notNull().default("usd"),
    promoCodeId: uuid().references(() => promoCodes.id, { onDelete: "set null" }),
    promoCode: text(),
    status: text().notNull().default("PENDING"),
    paymentMethod: text().notNull(),
    stripeSessionId: text().unique(),
    stripePaymentIntentId: text(),
    paidAt: tstz(),
    refundedCents: integer().notNull().default(0),
    refundReason: text(),
    notes: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.tenantId, t.createdAt),
    check("course_orders_item_ck", sql`(item_type = 'COURSE' and course_id is not null) or (item_type = 'PACKAGE' and package_id is not null)`),
    check("course_orders_status_ck", sql`status in ('PENDING','PAID','PARTIALLY_REFUNDED','REFUNDED','CANCELLED')`),
    check("course_orders_method_ck", sql`payment_method in ('STRIPE','INVOICE','MANUAL','FREE')`),
    check("course_orders_amounts_ck", sql`quantity between 1 and 10000 and total_cents = subtotal_cents - discount_cents and total_cents >= 0 and refunded_cents between 0 and total_cents`),
  ],
);

/** Seats of a course an organization (or individual) has paid for. */
export const courseEntitlements = pgTable(
  "course_entitlements",
  {
    id: pk(),
    tenantId: tenantId(),
    orderId: uuid().references(() => courseOrders.id, { onDelete: "set null" }),
    courseId: uuid()
      .notNull()
      .references(() => courses.id),
    seatsTotal: integer().notNull(),
    expiresAt: tstz(),
    revokedAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId, t.courseId), check("course_entitlements_seats_ck", sql`seats_total >= 0`)],
);

/** One seat used by one enrollment. Capacity is enforced by a trigger. */
export const entitlementUses = pgTable(
  "entitlement_uses",
  {
    id: pk(),
    tenantId: tenantId(),
    entitlementId: uuid()
      .notNull()
      .references(() => courseEntitlements.id),
    enrollmentId: uuid().notNull().unique(),
    userId: uuid().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.entitlementId)],
);

export const instructorCompensation = pgTable(
  "instructor_compensation",
  {
    id: pk(),
    tenantId: tenantId(),
    instructorId: uuid().notNull(),
    rateType: text().notNull(),
    rateCents: integer().notNull(),
    effectiveFrom: text().notNull(),
    notes: text(),
    createdById: uuid(),
    createdAt: createdAt(),
  },
  (t) => [
    unique().on(t.instructorId, t.effectiveFrom),
    index().on(t.tenantId),
    check("instructor_comp_type_ck", sql`rate_type in ('PER_SESSION','PER_HOUR','PER_LEARNER')`),
    check("instructor_comp_rate_ck", sql`rate_cents >= 0 and rate_cents <= 10000000`),
    check("instructor_comp_date_ck", sql`effective_from ~ '^\\d{4}-\\d{2}-\\d{2}$'`),
  ],
);
