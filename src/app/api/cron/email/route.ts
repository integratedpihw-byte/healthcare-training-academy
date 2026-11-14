import { NextResponse } from "next/server";
import { systemDb } from "@/db/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { deliverPendingEmails } from "@/lib/notify/delivery";
import { deliverPendingSms } from "@/lib/notify/sms";

export const dynamic = "force-dynamic";

/** Frequent scheduled job: delivers queued emails and SMS (retries with backoff). */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sys = systemDb();
  return NextResponse.json({ email: await deliverPendingEmails(sys, 200), sms: await deliverPendingSms(sys, 100) });
}
