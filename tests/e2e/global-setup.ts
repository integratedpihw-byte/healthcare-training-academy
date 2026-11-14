// Clears sign-in rate-limit counters so repeated local E2E runs are not throttled
// by the (intentional) per-account limiter. Test environments only.
import { Client } from "pg";

export default async function setup() {
  const url = process.env.SYSTEM_DATABASE_URL;
  if (!url) return;
  const c = new Client({ connectionString: url });
  await c.connect();
  await c.query("delete from rate_limits where key like 'login:%'");
  await c.end();
}
