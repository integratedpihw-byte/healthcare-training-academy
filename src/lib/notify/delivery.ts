/**
 * Email outbox worker (platform client only). Rows are enqueued by the
 * notifications_enqueue_email trigger, which already applied organization and user
 * preferences. Delivery retries with exponential backoff and gives up after
 * MAX_ATTEMPTS. Messages to reserved test domains are never sent to a real provider.
 */
import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { emailOutbox } from "@/db/schema";
import { sendEmail } from "./email";

export const MAX_ATTEMPTS = 5;
const RESERVED = /\.(example|test|invalid|localhost)$/i;

export function appUrl(path = "") {
  return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

/** Plain-text email body. No PHI: titles/bodies are written without clinical details. */
export function composeEmail(row: { subject: string; body: string; link: string | null }) {
  const lines = [row.body, ""];
  if (row.link) lines.push(`Open: ${appUrl(row.link)}`, "");
  lines.push(
    "—",
    "Complete Healthcare Innovative Training Academy",
    `Manage your email preferences: ${appUrl("/settings/notifications")}`,
    "This message was sent automatically. Do not reply with personal health information.",
  );
  return { subject: `[Training Academy] ${row.subject}`, text: lines.join("\n") };
}

export function backoffMinutes(attempts: number) {
  return Math.min(2 ** attempts, 240);
}

export async function deliverPendingEmails(sys: Db, limit = 50): Promise<{ sent: number; failed: number; retried: number }> {
  const stats = { sent: 0, failed: 0, retried: 0 };
  // Claim a batch (SKIP LOCKED lets concurrent workers run safely).
  const batch = await sys.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(emailOutbox)
      .where(and(eq(emailOutbox.status, "PENDING"), lte(emailOutbox.nextAttemptAt, sql`now()`)))
      .orderBy(asc(emailOutbox.createdAt))
      .limit(limit)
      .for("update", { skipLocked: true });
    if (rows.length) {
      // Push claimed rows into the future so another worker does not pick them up mid-send.
      await tx
        .update(emailOutbox)
        .set({ nextAttemptAt: sql`now() + interval '10 minutes'` })
        .where(inArray(emailOutbox.id, rows.map((r) => r.id)));
    }
    return rows;
  });

  const realProvider = (process.env.EMAIL_PROVIDER ?? "console") !== "console";
  for (const row of batch) {
    if (realProvider && RESERVED.test(row.toEmail.split("@")[1] ?? "")) {
      await sys.update(emailOutbox).set({ status: "FAILED", lastError: "Suppressed: reserved test domain", attempts: row.attempts + 1 }).where(eq(emailOutbox.id, row.id));
      stats.failed++;
      continue;
    }
    try {
      const msg = composeEmail(row);
      const r = await sendEmail({ to: row.toEmail, subject: msg.subject, text: msg.text });
      await sys.update(emailOutbox).set({ status: "SENT", sentAt: new Date(), attempts: row.attempts + 1, providerId: r.id ?? r.provider, lastError: null }).where(eq(emailOutbox.id, row.id));
      stats.sent++;
    } catch (e) {
      const attempts = row.attempts + 1;
      const error = (e instanceof Error ? e.message : String(e)).slice(0, 500);
      if (attempts >= MAX_ATTEMPTS) {
        await sys.update(emailOutbox).set({ status: "FAILED", attempts, lastError: error }).where(eq(emailOutbox.id, row.id));
        stats.failed++;
      } else {
        await sys
          .update(emailOutbox)
          .set({ attempts, lastError: error, nextAttemptAt: sql`now() + make_interval(mins => ${backoffMinutes(attempts)})` })
          .where(eq(emailOutbox.id, row.id));
        stats.retried++;
      }
    }
  }
  return stats;
}
