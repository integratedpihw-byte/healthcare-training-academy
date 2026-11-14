// Notifications, immutable audit log, and billing (kept separate from training records).
import {
  bigserial,
  boolean,
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
