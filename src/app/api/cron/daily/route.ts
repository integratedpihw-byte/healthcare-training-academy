import { NextResponse } from "next/server";
import { systemDb } from "@/db/server";
import { expireDueCertificates } from "@/lib/certificates/service";
import { cronAuthorized } from "@/lib/cron-auth";
import { deliverPendingEmails } from "@/lib/notify/delivery";
import { deliverPendingSms } from "@/lib/notify/sms";
import { runRenewalEngine } from "@/lib/workforce/renewal";
import { snapshotCompliance } from "@/lib/compliance/service";
import { processTrials } from "@/lib/billing/service";
import { purgeExpiredAuthData } from "@/lib/auth/service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily scheduled job: expire certificates, run the renewal/expiration engine
 * (reminders, overdue, escalations, renewal assignments), record compliance snapshots
 * for trend reporting, and flush the email outbox.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sys = systemDb();
  const expired = await expireDueCertificates(sys);
  const engine = await runRenewalEngine(sys);
  const snapshots = await snapshotCompliance(sys);
  const trials = await processTrials(sys);
  const email = await deliverPendingEmails(sys, 500);
  const sms = await deliverPendingSms(sys, 200);
  const housekeeping = await purgeExpiredAuthData(sys);
  return NextResponse.json({ expiredCertificates: expired, engine, complianceSnapshots: snapshots, trials, email, sms, housekeeping });
}
