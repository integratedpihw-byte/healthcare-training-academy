/**
 * Optional SMS for critical alerts (spec §18). Messages never contain PHI: only the
 * notification title, a link, and opt-out instructions. Twilio is used when
 * SMS_PROVIDER=twilio and credentials are set; otherwise messages are logged.
 * Twilio handles STOP/START/HELP keywords automatically on standard numbers.
 */
import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { smsOutbox } from "@/db/schema";
import { appUrl, backoffMinutes, MAX_ATTEMPTS } from "./delivery";

export const E164 = /^\+[1-9]\d{7,14}$/;

/** Accepts US numbers in common formats or full E.164; returns E.164 or null. */
export function normalizePhone(input: string): string | null {
  const t = input.trim();
  if (E164.test(t.replace(/[\s().-]/g, ""))) return t.replace(/[\s().-]/g, "");
  const digits = t.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function composeSms(title: string) {
  return `Training Academy: ${title.slice(0, 100)}. Details: ${appUrl("/notifications")} Reply STOP to opt out.`;
}

async function send(to: string, body: string): Promise<{ id?: string; provider: string }> {
  if ((process.env.SMS_PROVIDER ?? "console") !== "twilio") {
    console.info(`[sms:console] to=${to.slice(0, 5)}… ${body}`);
    return { provider: "console" };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const svc = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || (!from && !svc)) throw new Error("Twilio is not configured");
  const form = new URLSearchParams({ To: to, Body: body, ...(svc ? { MessagingServiceSid: svc } : { From: from! }) });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: { authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const j = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
  if (!res.ok) throw new Error(`Twilio ${res.status}${j.code ? ` (${j.code})` : ""}`);
  return { id: j.sid, provider: "twilio" };
}

export async function deliverPendingSms(sys: Db, limit = 50) {
  const stats = { sent: 0, failed: 0, retried: 0 };
  const batch = await sys.transaction(async (tx) => {
    const rows = await tx.select().from(smsOutbox).where(and(eq(smsOutbox.status, "PENDING"), lte(smsOutbox.nextAttemptAt, sql`now()`))).orderBy(asc(smsOutbox.createdAt)).limit(limit).for("update", { skipLocked: true });
    if (rows.length) await tx.update(smsOutbox).set({ nextAttemptAt: sql`now() + interval '10 minutes'` }).where(inArray(smsOutbox.id, rows.map((r) => r.id)));
    return rows;
  });
  for (const row of batch) {
    try {
      const r = await send(row.toPhone, composeSms(row.body));
      await sys.update(smsOutbox).set({ status: "SENT", sentAt: new Date(), attempts: row.attempts + 1, providerId: r.id ?? r.provider, lastError: null }).where(eq(smsOutbox.id, row.id));
      stats.sent++;
    } catch (e) {
      const attempts = row.attempts + 1;
      const error = (e instanceof Error ? e.message : String(e)).slice(0, 300);
      if (attempts >= MAX_ATTEMPTS) {
        await sys.update(smsOutbox).set({ status: "FAILED", attempts, lastError: error }).where(eq(smsOutbox.id, row.id));
        stats.failed++;
      } else {
        await sys.update(smsOutbox).set({ attempts, lastError: error, nextAttemptAt: sql`now() + make_interval(mins => ${backoffMinutes(attempts)})` }).where(eq(smsOutbox.id, row.id));
        stats.retried++;
      }
    }
  }
  return stats;
}
