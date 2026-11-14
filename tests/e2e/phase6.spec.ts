import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 6 — enterprise. Runs against `next start` with AI_PROVIDER=fake and
 * ALLOW_FAKE_AI=1 (deterministic test provider; never set in real deployments).
 */
const PW = process.env.SEED_DEMO_PASSWORD ?? "Demo-Academy#2026";
const SHOTS = process.env.E2E_SCREENSHOTS;
const shot = async (page: Page, name: string) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test.describe.configure({ mode: "serial" });
const stamp = Date.now().toString().slice(-6);
const inDays = (n: number, hh: string) => {
  const d = new Date(Date.now() + n * 86_400_000);
  return `${d.toISOString().slice(0, 10)}T${hh}`;
};

test("training director schedules a class and registers a learner; the learner sees it", async ({ page }) => {
  await signIn(page, "director@sunshine.example");
  await page.getByRole("link", { name: "Instructor Portal" }).first().click();
  await page.getByRole("link", { name: "Classes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Upcoming classes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Bloodborne Pathogens — live Q&A (DEMO)" })).toBeVisible();
  await page.getByLabel("Title").fill(`Fire safety walkthrough ${stamp}`);
  await page.getByLabel("Location / room").fill("Main lobby");
  await page.getByLabel(/^Starts/).fill(inDays(7, "09:00"));
  await page.getByLabel(/^Ends/).fill(inDays(7, "10:00"));
  await page.getByLabel("Capacity").fill("10");
  await page.getByRole("button", { name: "Schedule class" }).click();
  await expect(page.getByRole("heading", { name: `Fire safety walkthrough ${stamp}` })).toBeVisible();
  await page.getByLabel("Members").selectOption({ label: "Lee, Jordan" });
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page.getByText(/1 registered/)).toBeVisible();
  await expect(page.getByText("Lee, Jordan")).toBeVisible();
  await shot(page, "p6-01-class");

  await signOut(page);
  await signIn(page, "learner@sunshine.example");
  await page.goto("/learning");
  await expect(page.getByText(`Fire safety walkthrough ${stamp}`)).toBeVisible();
});

test("instructor records attendance, edits the profile and messages a class", async ({ page }) => {
  await signIn(page, "instructor@sunshine.example");
  await page.goto("/instructor/classes?view=past");
  await page.getByRole("link", { name: "HIPAA in Practice — classroom review (DEMO)" }).click();
  await page.getByLabel("Attendance for Jordan Lee").selectOption("EXCUSED");
  await page.getByRole("button", { name: "Save attendance" }).click();
  await expect(page.getByText(/Attendance saved/)).toBeVisible();
  await page.getByLabel("Subject").fill("Thanks for joining");
  await page.getByLabel("Message").fill("Review module 2 before the next session.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/Message sent to 2 learner/)).toBeVisible();
  await page.getByRole("link", { name: "My profile" }).click();
  await page.getByLabel("Credentials").fill("Registered Nurse (DEMO) | Florida Board of Nursing | DEMO-1 | 2027-07-31\nnot valid");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText(/Credentials: one per line/)).toBeVisible();
  await page.getByLabel("Credentials").fill("Registered Nurse (DEMO) | Florida Board of Nursing | DEMO-1 | 2027-07-31");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  // Instructors cannot manage other instructors.
  await page.goto("/instructor/instructors");
  await expect(page).toHaveURL(/forbidden/);
});

test("billing shows the plan, usage and invoices; a Starter tenant is sent to upgrade", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/billing");
  await expect(page.getByRole("heading", { name: "Subscription" })).toBeVisible();
  await expect(page.getByText("Enterprise").first()).toBeVisible();
  await expect(page.getByText(/Online payment is not configured/)).toBeVisible();
  await shot(page, "p6-02-billing");
  await signOut(page);
  await signIn(page, "orgadmin@gulfcoast.example");
  await expect(page.getByRole("link", { name: "Compliance Center" })).toHaveCount(0);
  await page.goto("/compliance");
  await expect(page).toHaveURL(/\/billing\?upgrade=compliance/);
  await expect(page.getByText(/is not included in your current plan/)).toBeVisible();
});

test("analytics dashboard filters and exports", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/reports");
  await page.getByRole("link", { name: "Analytics dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Analytics dashboard" })).toBeVisible();
  await expect(page.getByText("Training compliance")).toBeVisible();
  await expect(page.getByText("Facility compliance ranking")).toBeVisible();
  await expect(page.getByRole("img", { name: "Course completions per month" })).toBeVisible();
  await shot(page, "p6-03-analytics");
  await page.getByLabel("Facility").selectOption({ label: "Sunshine Community Clinic – St. Petersburg (DEMO)" });
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/facilityId=/);
  await expect(page.getByRole("link", { name: "Lee, Jordan" })).toHaveCount(0);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "CSV" }).first().click()]);
  expect(dl.suggestedFilename()).toMatch(/^analytics-summary-.*\.csv$/);
});

test("API keys: create, call the read-only API, revoke", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/admin");
  await page.getByRole("link", { name: /Integrations & API keys/ }).click();
  await page.getByLabel("Name", { exact: true }).fill(`HRIS ${stamp}`);
  await page.getByLabel(/employees:read/).check();
  await page.getByRole("button", { name: "Create API key" }).click();
  const secret = (await page.getByTestId("api-secret").textContent())!.trim();
  expect(secret).toMatch(/^chta_[a-z0-9]{10}_/);
  await shot(page, "p6-04-api-keys");
  const ok = await page.request.get("/api/v1/employees?limit=2", { headers: { authorization: `Bearer ${secret}` } });
  expect(ok.status()).toBe(200);
  const body = await ok.json();
  expect(body.data.length).toBe(2);
  expect((await page.request.get("/api/v1/certificates", { headers: { authorization: `Bearer ${secret}` } })).status()).toBe(403);
  await page.reload();
  await page.getByRole("button", { name: `Revoke HRIS ${stamp}` }).click();
  await expect(page.getByRole("button", { name: `Revoke HRIS ${stamp}` })).toHaveCount(0);
  expect((await page.request.get("/api/v1/employees", { headers: { authorization: `Bearer ${secret}` } })).status()).toBe(401);
});

test("AI assistant answers with cited sources and refuses PHI", async ({ page }) => {
  await signIn(page, "learner@sunshine.example");
  await page.goto("/learning");
  await page.getByRole("link", { name: "AI study assistant" }).click();
  await page.getByLabel("What would you like help with?").selectOption("regulatory");
  await page.getByLabel(/Your question or topic/).fill("bloodborne pathogens training");
  await page.getByRole("button", { name: "Ask the assistant" }).click();
  await expect(page.getByRole("heading", { name: "Answer" })).toBeVisible();
  await expect(page.getByText(/Verified regulation|not yet verified/).first()).toBeVisible();
  await expect(page.getByText(/does not establish competency or compliance/)).toBeVisible();
  await shot(page, "p6-05-assistant");
  await page.getByLabel("What would you like help with?").selectOption("ask");
  await page.getByLabel(/Your question or topic/).fill("Resident John Smith DOB 03/04/1940 fell, what now?");
  await page.getByRole("button", { name: "Ask the assistant" }).click();
  await expect(page.getByText(/must not receive protected health information/)).toBeVisible();
});

test("platform administrator sets a custom plan for a tenant", async ({ page }) => {
  await signIn(page, "superadmin@chta-platform.example");
  await page.goto("/platform");
  await expect(page.getByText("Platform-wide learning")).toBeVisible();
  await page.getByRole("link", { name: "Bayview Group Home (DEMO)" }).click();
  await page.getByText("Set plan manually (custom pricing, trials)").click();
  await page.getByLabel("Plan").selectOption("PROFESSIONAL");
  await page.getByLabel("Status").selectOption("ACTIVE");
  await page.getByLabel("Custom terms").fill(`DEMO ${stamp}: nonprofit pricing`);
  await page.getByLabel("Reason (audited)").fill("DEMO plan change for e2e");
  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(page.getByText("Plan saved.")).toBeVisible();
});
