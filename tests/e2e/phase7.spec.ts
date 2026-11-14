import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Phase 7 — production readiness: security headers and access control, file uploads,
 * accessibility (WCAG 2.2 AA automated checks) and mobile layouts.
 */
const PW = process.env.SEED_DEMO_PASSWORD ?? "Demo-Academy#2026";
const SHOTS = process.env.E2E_SCREENSHOTS;
const shot = async (page: Page, name: string) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
}
async function axe(page: Page, url: string) {
  await page.goto(url);
  const r = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return r.violations.map((v) => `${url}: ${v.id} (${v.impact}) — ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
}

test.describe.configure({ mode: "serial" });

test.describe("security", () => {
  test("pages send a nonce-based CSP and hardening headers; the browser reports no CSP violations", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (m) => { if (/Content Security Policy|Refused to (execute|load)/i.test(m.text())) violations.push(m.text()); });
    const res = await page.goto("/login");
    const h = res!.headers();
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(h["content-security-policy"]).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(h["content-security-policy"]).toMatch(/frame-ancestors 'none'/);
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toMatch(/max-age=63072000/);
    expect(h["x-powered-by"]).toBeUndefined();
    await signIn(page, "orgadmin@sunshine.example");
    await page.goto("/reports/analytics");
    await page.goto("/learning");
    expect(violations).toEqual([]);
    const cookies = await page.context().cookies();
    const session = cookies.find((c) => /chta_session/.test(c.name))!;
    expect(session.httpOnly).toBe(true);
    expect(session.sameSite).toBe("Lax");
  });

  test("protected endpoints refuse anonymous and forged requests", async ({ request }) => {
    const zero = "00000000-0000-4000-8000-000000000000";
    for (const url of [`/api/reports/transcript?employeeId=${zero}`, `/api/files/${zero}`, "/api/analytics", "/api/v1/employees", "/api/cron/daily", "/api/cron/email"]) {
      const r = await request.get(url, { maxRedirects: 0 });
      expect([401, 403], url).toContain(r.status());
    }
    const r = await request.post("/api/files", { headers: { origin: "https://evil.example" }, multipart: { purpose: "LICENSE_DOCUMENT", entityId: zero } });
    expect(r.status()).toBe(403);
    const hook = await request.post("/api/webhooks/stripe", { data: "{}", headers: { "stripe-signature": "t=1,v1=forged" } });
    expect([400, 401, 503]).toContain(hook.status());
    const health = await request.get("/api/health");
    expect(await health.json()).toEqual({ status: "ok" });
  });

  test("another organization's records are not reachable by URL", async ({ page }) => {
    await signIn(page, "orgadmin@sunshine.example");
    await page.goto("/employees");
    const href = await page.getByRole("link", { name: "Lee, Jordan" }).first().getAttribute("href");
    expect(href).toMatch(/^\/employees\//);
    await signOut(page);
    await signIn(page, "orgadmin@gulfcoast.example");
    const res = await page.goto(href!);
    expect(res!.status()).toBe(404);
    await expect(page.getByText("Jordan")).toHaveCount(0);
  });

  test("user-supplied text is rendered as text, never executed", async ({ page }) => {
    let dialog = false;
    page.on("dialog", async (d) => { dialog = true; await d.dismiss(); });
    await signIn(page, "orgadmin@sunshine.example");
    await page.goto("/notifications");
    const title = `<img src=x onerror=alert(1)> ${Date.now()}`;
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Message").fill("<script>alert(2)</script> DEMO security test");
    await page.getByRole("button", { name: /Send announcement/ }).click();
    await expect(page.getByText(/Announcement sent/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(title).first()).toBeVisible();
    expect(await page.locator("img[src='x']").count()).toBe(0);
    expect(dialog).toBe(false);
  });
});

test.describe("file uploads", () => {
  test("an administrator attaches a license copy; unsupported files are refused; the file opens", async ({ page }) => {
    await signIn(page, "orgadmin@sunshine.example");
    await page.goto("/employees");
    await page.getByRole("link", { name: "Nguyen, Leah" }).first().click();
    const manage = page.locator("details").filter({ has: page.getByText("Manage", { exact: true }) }).first();
    await manage.locator("summary").first().click();
    const input = manage.getByLabel("Attach a copy (PDF or image)");
    await input.setInputFiles(path.join(__dirname, "fixtures-not-allowed.html"));
    await manage.getByRole("button", { name: "Upload" }).click();
    await expect(manage.getByText(/Unsupported file type/)).toBeVisible();
    await input.setInputFiles(path.join(__dirname, "fixtures-license.png"));
    await manage.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByRole("link", { name: "fixtures-license.png" })).toBeVisible();
    await shot(page, "p7-01-license-upload");
    const href = await page.getByRole("link", { name: "fixtures-license.png" }).getAttribute("href");
    const r = await page.request.get(href!);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toBe("image/png");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
    expect(r.headers()["content-security-policy"]).toMatch(/sandbox/);
    // Other organizations cannot open it.
    await signOut(page);
    await signIn(page, "orgadmin@gulfcoast.example");
    expect((await page.request.get(href!)).status()).toBe(404);
  });
});

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  test("public pages", async ({ page }) => {
    const v: string[] = [];
    for (const u of ["/", "/login", "/register", "/forgot-password", "/verify"]) v.push(...(await axe(page, u)));
    expect(v).toEqual([]);
  });
  test("administrator pages", async ({ page }) => {
    await signIn(page, "orgadmin@sunshine.example");
    const v: string[] = [];
    for (const u of ["/dashboard", "/catalog", "/training", "/employees", "/competency", "/certificates", "/compliance", "/compliance/rules", "/instructor/classes", "/reports", "/reports/analytics", "/notifications", "/billing", "/admin", "/admin/integrations", "/admin/users", "/admin/audit", "/settings/notifications"]) v.push(...(await axe(page, u)));
    expect(v).toEqual([]);
  });
  test("learner pages", async ({ page }) => {
    await signIn(page, "learner@sunshine.example");
    const v: string[] = [];
    for (const u of ["/dashboard", "/learning", "/learning/assistant", "/certificates", "/notifications"]) v.push(...(await axe(page, u)));
    expect(v).toEqual([]);
  });
  test("keyboard: skip link reaches main content and focus is visible", async ({ page }) => {
    await signIn(page, "learner@sunshine.example");
    await page.goto("/learning");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/Skip to (main )?content/i);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe("mobile (390×844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("core learner and admin pages fit the screen and the mobile navigation works", async ({ page }) => {
    await signIn(page, "learner@sunshine.example");
    for (const u of ["/dashboard", "/learning", "/certificates", "/learning/assistant"]) {
      await page.goto(u);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, u).toBeLessThanOrEqual(1);
    }
    const nav = page.getByRole("navigation", { name: "Main (mobile)" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "My Learning" }).click();
    await expect(page.getByRole("heading", { name: "My Learning" })).toBeVisible();
    await shot(page, "p7-02-mobile-learning");
    await signOut(page);
    await signIn(page, "orgadmin@sunshine.example");
    for (const u of ["/dashboard", "/employees", "/compliance", "/reports/analytics", "/billing"]) {
      await page.goto(u);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, u).toBeLessThanOrEqual(1);
    }
    await shot(page, "p7-03-mobile-billing");
  });
});
