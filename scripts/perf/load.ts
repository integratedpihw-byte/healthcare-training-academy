/**
 * PERFORMANCE TESTING ONLY. HTTP load test against a running build:
 * signs in with a browser to obtain a session, then drives concurrent requests.
 * Usage: BASE_URL=http://localhost:3000 tsx scripts/perf/load.ts
 */
import autocannon from "autocannon";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PW = process.env.SEED_DEMO_PASSWORD ?? "Demo-Academy#2026";

async function cookieFor(email: string) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  const c = (await page.context().cookies()).map((x) => `${x.name}=${x.value}`).join("; ");
  await browser.close();
  return c;
}

async function run(title: string, url: string, cookie: string, connections: number, duration = 15) {
  const r = await autocannon({ url: `${BASE}${url}`, connections, duration, headers: { cookie } });
  const errors = r.errors + r.timeouts + (r.non2xx ?? 0);
  console.log(`| ${title} | ${connections} | ${Math.round(r.requests.average)} | ${r.latency.p50} | ${r.latency.p97_5} | ${r.latency.p99} | ${errors} |`);
}

async function main() {
  const learner = await cookieFor("learner@sunshine.example");
  const admin = await cookieFor("orgadmin@sunshine.example");
  console.log("| Scenario | Concurrent users | Req/s | p50 ms | p97.5 ms | p99 ms | Errors |\n|---|---:|---:|---:|---:|---:|---:|");
  await run("Login page (anonymous)", "/login", "", 50);
  await run("Learner: My Learning", "/learning", learner, 50);
  await run("Learner: dashboard", "/dashboard", learner, 50);
  await run("Admin: dashboard (5,000 staff)", "/dashboard", admin, 20);
  await run("Admin: employee list", "/employees", admin, 20);
  await run("Admin: analytics (5,000 staff)", "/reports/analytics", admin, 10);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
