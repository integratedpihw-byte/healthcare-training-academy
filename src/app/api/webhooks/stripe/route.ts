import { NextResponse } from "next/server";
import { systemDb } from "@/db/server";
import { handleStripeEvent, verifyWebhook } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

/** Stripe webhook: signature-verified, idempotent, platform client only. */
export async function POST(req: Request) {
  const payload = await req.text();
  let event;
  try {
    event = verifyWebhook(payload, req.headers.get("stripe-signature"));
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }
  const result = await handleStripeEvent(systemDb(), event);
  return NextResponse.json({ received: true, result });
}
