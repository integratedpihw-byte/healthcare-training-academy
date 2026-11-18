import { expect, test, type Page } from "@playwright/test";

/**
 * Expansion — training revenue end to end: an individual learner finds a priced Home
 * Health course, orders a seat with a promo code, the platform records payment, the
 * learner enrolls; an employer sees its purchased seats and the business reports; the
 * platform exports revenue.
 */
const PW = process.env.SEED_DEMO_PASSWORD ?? "Demo-Academy#2026";
const stamp = Date.now().toString(36);
const learner = { first: "Rosa", last: `Buyer${stamp}`, email: `rosa.${stamp}@e2e.example`, pw: "Learner-Account#2026" };

async function signIn(page: Page, email: string, pw = PW) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
}
async function openCourse(page: Page, title: string) {
  await page.goto("/catalog");
  await page.getByLabel("Search").fill(title);
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByRole("link", { name: new RegExp(title) }).first().click();
}

test.describe.configure({ mode: "serial" });

test("individual learner orders a priced course, the platform records payment, and the learner enrolls", async ({ page }) => {
  await page.goto("/register/individual");
  await page.getByLabel("First name").fill(learner.first);
  await page.getByLabel("Last name").fill(learner.last);
  await page.getByLabel("Email").fill(learner.email);
  await page.getByLabel("Password", { exact: true }).fill(learner.pw);
  await page.getByLabel("Confirm password").fill(learner.pw);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/dashboard/);

  await openCourse(page, "Personal Care Assistant Training");
  await expect(page.getByText(/\$59\.00 per learner seat/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enroll and start" })).toHaveCount(0);
  await page.getByLabel("Promo code").fill("demo-welcome10");
  await page.getByRole("button", { name: /Request this course|Buy for/ }).click();
  await expect(page.getByText(/Order received/)).toBeVisible();
  const courseUrl = page.url();
  await signOut(page);

  await signIn(page, "superadmin@chta-platform.example");
  await page.goto("/platform/revenue");
  await expect(page.getByRole("heading", { name: "Training revenue" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: `${learner.first} ${learner.last}` }).filter({ hasText: "CHITA-HH-002" });
  await expect(row).toContainText("$53.10"); // $59 less 10%
  await row.getByText("Record payment").click();
  await row.getByLabel("Payment reference").fill("E2E-CHECK-1001");
  await row.getByRole("button", { name: "Mark paid" }).click();
  // The order moves to "paid" and the payment form is replaced by the refund option.
  await expect(row.getByText("Refund", { exact: true })).toBeVisible();
  await expect(row).toContainText(/paid/);
  const csv = await page.request.get("/api/platform/revenue?view=organization&format=csv");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain(`${learner.first} ${learner.last}`);
  await signOut(page);

  await signIn(page, learner.email, learner.pw);
  await page.goto(courseUrl);
  await expect(page.getByText(/Paid seat available/)).toBeVisible();
  await page.getByRole("button", { name: "Enroll and start" }).click();
  await expect(page).toHaveURL(/\/learning\/[0-9a-f-]{36}/);
});

test("an employer sees purchased seats and the business reports; learners cannot", async ({ page }) => {
  await signIn(page, "orgadmin@gulfcoast.example");
  await page.goto("/billing");
  await expect(page.getByRole("heading", { name: "Training purchases" })).toBeVisible();
  await expect(page.getByText("Home Health Aide Training: Classroom Theory").first()).toBeVisible();
  await expect(page.getByText("Home Health Aide starter bundle (DEMO)").first()).toBeVisible();
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Business" })).toBeVisible();
  await page.getByRole("link", { name: "Employer-sponsored seats" }).click();
  await expect(page.getByRole("cell", { name: "CHITA-HH-001" })).toBeVisible();
  const pdf = await page.request.get("/api/reports/employer-sponsored?format=pdf");
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  await signOut(page);

  await signIn(page, "learner@sunshine.example");
  const r = await page.request.get("/api/reports/training-purchases?format=csv");
  expect(r.status()).toBe(403);
  await page.goto("/platform/revenue");
  await expect(page).toHaveURL(/forbidden/);
});
