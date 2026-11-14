import { expect, test, type Page } from "@playwright/test";

const PW = process.env.SEED_DEMO_PASSWORD ?? "Demo-Academy#2026";
const SHOTS = process.env.E2E_SCREENSHOTS;
const shot = async (page: Page, name: string) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test.describe.configure({ mode: "serial" });
const stamp = Date.now().toString().slice(-6);

test("org admin reviews compliance, records a decision and maps a Florida rule to training", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await expect(page.getByRole("heading", { name: "Regulatory compliance" })).toBeVisible(); // dashboard card
  await page.getByRole("link", { name: "Compliance Center" }).first().click();
  await expect(page.getByRole("heading", { name: "Compliance Center" })).toBeVisible();
  await expect(page.getByText("Facility compliance ranking")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sunshine Assisted Living – Tampa (DEMO)" })).toBeVisible();
  await shot(page, "p5-01-compliance-center");

  await page.getByRole("link", { name: "Regulatory library" }).click();
  await page.getByLabel("Jurisdiction").selectOption("FL");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page.getByRole("link", { name: "ALF elopement response in-service" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Bloodborne pathogens training" })).toHaveCount(0);
  await shot(page, "p5-02-library");

  await page.getByRole("link", { name: "ALF adverse incidents and emergency procedures in-service (1 hour)" }).click();
  await expect(page.getByText("Rule 59A-36.011(3)(b), F.A.C.").first()).toBeVisible();
  await expect(page.getByText("Within 30 days of employment.")).toBeVisible();
  await expect(page.getByText(/Pending change:/)).toBeVisible();
  await page.locator("#dec-rationale").fill(`DEMO ${stamp}: the Tampa ALF employs direct care staff; reviewed by the administrator.`);
  await page.getByRole("button", { name: "Record decision" }).click();
  await expect(page.getByText("Decision recorded.")).toBeVisible();
  await page.locator("#map-course").selectOption({ label: "Standard Precautions, Hand Hygiene and Personal Protective Equipment" });
  await page.getByRole("button", { name: "Create requirement" }).click();
  await expect(page.getByText(/Training requirement created/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Staff status \([1-9]/ })).toBeVisible();
  await shot(page, "p5-03-rule-detail");

  await page.goto("/compliance");
  await page.getByRole("link", { name: "Sunshine Assisted Living – Tampa (DEMO)" }).click();
  await expect(page.getByRole("heading", { name: "Staff compliance matrix" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jordan Lee" })).toBeVisible();
  await shot(page, "p5-04-facility-matrix");
});

test("audit reports render and export to PDF, Excel and CSV", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/reports");
  await expect(page.getByRole("link", { name: "Regulatory audit report" })).toBeVisible();
  await shot(page, "p5-05-reports");
  await page.getByRole("link", { name: "Regulatory audit report" }).click();
  await expect(page.getByRole("cell", { name: "29 CFR 1910.1030(g)(2)" }).first()).toBeVisible();
  await shot(page, "p5-06-regulatory-audit");
  for (const [label, ext] of [["PDF", "pdf"], ["Excel", "xlsx"], ["CSV", "csv"]] as const) {
    const dl = page.waitForEvent("download");
    await page.getByRole("link", { name: label, exact: true }).click();
    expect((await dl).suggestedFilename()).toMatch(new RegExp(`^regulatory-audit-\\d{4}-\\d{2}-\\d{2}\\.${ext}$`));
  }
  await page.goto("/reports/transcript");
  await page.getByLabel("Employee").selectOption({ label: "Kim, Grace" });
  await page.getByRole("button", { name: "Run report" }).click();
  await expect(page.getByRole("cell", { name: /HIPAA Privacy and Security/ }).first()).toBeVisible();
});

test("platform rule update notifies the organization's compliance managers", async ({ page }) => {
  await signIn(page, "superadmin@chta-platform.example");
  await page.getByRole("link", { name: "Regulatory Library" }).click();
  await expect(page.getByRole("heading", { name: "Regulatory library" })).toBeVisible();
  await page.getByRole("link", { name: "Hazard communication training" }).click();
  await page.getByLabel(/Change summary/).fill(`Re-verified 29 CFR 1910.1200(h)(1) on osha.gov (${stamp}); wording unchanged.`);
  await page.getByRole("button", { name: "Save new version" }).click();
  await expect(page.getByText(/Saved as version 2\. \d+ compliance manager notification/)).toBeVisible();
  await shot(page, "p5-07-platform-rule");
  await page.getByRole("button", { name: "Sign out" }).first().click();

  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/notifications");
  await expect(page.getByText("Regulatory update: 29 CFR 1910.1200(h)(1)").first()).toBeVisible();
  await page.goto("/compliance");
  await expect(page.getByRole("link", { name: /29 CFR 1910\.1200\(h\)\(1\) — Hazard communication training/ })).toBeVisible();
});

test("facility administrators see their facility only; learners cannot open compliance or reports", async ({ page }) => {
  await signIn(page, "facadmin@sunshine.example");
  await page.goto("/compliance");
  await expect(page.getByRole("link", { name: "Sunshine Assisted Living – Tampa (DEMO)" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sunshine Community Clinic/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await signIn(page, "learner@sunshine.example");
  await page.goto("/compliance");
  await expect(page).toHaveURL(/\/forbidden/);
  await page.goto("/reports");
  await expect(page).toHaveURL(/\/forbidden/);
  const r = await page.request.get("/api/reports/overdue?format=csv");
  expect(r.status()).toBe(403);
});
