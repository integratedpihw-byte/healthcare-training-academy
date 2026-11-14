import type { Db, Tx } from "@/db/client";
import { sql } from "drizzle-orm";

/** Email preference buckets (see user_notification_settings). */
export type NotificationCategory = "assignments" | "results" | "announcements" | "critical" | "none";

export interface NewNotification {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  /** Prevents duplicates (unique per tenant). */
  dedupeKey?: string;
  /** Defaults from the type (categoryOf). */
  category?: NotificationCategory;
}

/**
 * Maps a notification type to its email bucket. "critical" covers expiration warnings,
 * overdue training, escalations and compliance alerts — users cannot mute these by email
 * (the organization can still switch email off entirely).
 */
export function categoryOf(type: string): NotificationCategory {
  if (type.startsWith("assignment.") || type === "reminder.due") return "assignments";
  if (type.startsWith("exam.") || type === "certificate.available" || type === "competency.recorded") return "results";
  if (type.startsWith("announcement")) return "announcements";
  return "critical";
}

/**
 * Creates in-app notifications. A database trigger fans each one out to the email
 * outbox according to organization and user preferences, so callers never decide
 * email delivery themselves. Never put PHI in titles or bodies.
 */
export async function notify(db: Db | Tx, items: NewNotification | NewNotification[]) {
  const rows = (Array.isArray(items) ? items : [items]).map((n) => ({
    tenantId: n.tenantId,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link ?? null,
    dedupeKey: n.dedupeKey ?? null,
    category: n.category ?? categoryOf(n.type),
  }));
  if (rows.length === 0) return 0;
  // Database entry point: recipients must be active members of the current tenant
  // (enforced for application connections) and duplicates are ignored.
  const r = await db.execute<{ n: number }>(sql`select app_insert_notifications(${JSON.stringify(rows)}::jsonb) n`);
  return Number(r.rows[0]?.n ?? 0);
}
