import { timingSafeEqual } from "node:crypto";

/** Scheduled jobs authenticate with `Authorization: Bearer $CRON_SECRET` (constant-time compare). */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return auth.length === expected.length && timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}
