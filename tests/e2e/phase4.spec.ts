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

test("org admin sees workforce compliance and adds an employee with onboarding", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await expect(page.getByText("Non-compliant employees")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
  await shot(page, "p4-01-admin-dashboard");

  await page.getByRole("link", { name: "Employee Management" }).click();
  await expect(page.getByRole("heading", { name: "Employee Management" })).toBeVisible();
  const samuel = page.getByRole("row").filter({ hasText: "Brooks, Samuel" });
  await expect(samuel.getByText("Non-compliant")).toBeVisible();
  await shot(page, "p4-02-employees");

  await page.getByRole("link", { name: "Add employee" }).click();
  await page.getByLabel("Employee ID", { exact: true }).fill(`E2E-${stamp}`);
  await page.getByLabel("First name", { exact: true }).fill("Nina");
  await page.getByLabel("Last name", { exact: true }).fill(`Newhire${stamp}`);
  await page.getByLabel("Work email", { exact: true }).fill(`nina.${stamp}@sunshine.example`);
  await page.getByLabel("Job title", { exact: true }).fill("Resident Care Aide");
  await page.getByLabel("Position code", { exact: true }).fill("CAREGIVER");
  await page.getByLabel("Primary facility", { exact: true }).selectOption({ label: "Sunshine Assisted Living – Tampa (DEMO)" });
  await page.getByLabel(/direct patient or resident care/).check();
  await page.getByLabel(/blood or other potentially infectious/).check();
  await page.getByRole("button", { name: "Create employee" }).click();
  await page.waitForURL(/\/employees\/[0-9a-f-]{36}/);
  await expect(page.getByText("Employee created.")).toBeVisible();
  // Onboarding assigned the DEMO policy courses and notified the employee (step 7 done).
  await expect(page.getByRole("heading", { name: "Onboarding checklist" })).toBeVisible();
  await expect(page.getByText(/Notified \d{4}-\d{2}-\d{2}/)).toBeVisible();
  await expect(page.getByRole("cell", { name: /HIPAA Privacy and Security/ }).first()).toBeVisible();
  await expect(page.getByText("Skills evaluation required")).toBeVisible();
  await expect(page.getByText(/Linked to nina\./)).toBeVisible();
  await shot(page, "p4-03-employee-profile");

  // Record a license and verify it with a source.
  await page.getByText("Add license or certification").click();
  await page.locator("#new-name").fill("Basic Life Support Provider (DEMO)");
  await page.locator("#new-kind").selectOption("THIRD_PARTY_CERTIFICATION");
  await page.locator("#new-licenseNumber").fill(`BLS-${stamp}`);
  await page.locator("#new-issuingAuthority").fill("DEMO training center");
  await page.locator("#new-expiresOn").fill("2028-06-30");
  await page.getByRole("button", { name: "Add license" }).click();
  await expect(page.getByText(/License recorded/)).toBeVisible();
  await page.reload();
  const lic = page.getByRole("row").filter({ hasText: "Basic Life Support Provider" });
  await expect(lic.getByText("Unverified")).toBeVisible();
  await lic.getByText("Manage").click();
  await lic.getByLabel("Verification source").fill("DEMO — card reviewed in person");
  await lic.getByRole("button", { name: "Record verification" }).click();
  await expect(page.getByText("License marked verified.")).toBeVisible();
});

test("training management: overdue assignment rescheduled with an audited reason; requirements listed", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/training?status=OVERDUE");
  await expect(page.getByRole("heading", { name: "Training Management" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "Samuel Brooks" });
  await expect(row.getByText("Overdue", { exact: true })).toBeVisible();
  await shot(page, "p4-04-training-overdue");
  await row.getByRole("link", { name: "Details" }).click();
  await page.getByLabel("New due date").fill(new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10));
  await page.locator("#due-reason").fill("Approved schedule change after missed shift (DEMO)");
  await page.getByRole("button", { name: "Change due date" }).click();
  await expect(page.getByText("Due date changed.")).toBeVisible();
  await expect(page.getByText("Assigned", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("due date changed", { exact: true })).toBeVisible(); // history (audit)
  await shot(page, "p4-05-assignment-detail");

  await page.goto("/training/requirements");
  await expect(page.getByText("DEMO policy: HIPAA privacy & security — all staff")).toBeVisible();
  await expect(page.getByText("Reminders: 30/14/7/1 days")).toBeVisible();
  await shot(page, "p4-06-requirements");

  await page.goto("/training/expirations");
  await expect(page.getByText("Phlebotomy Technician Certification (DEMO)")).toBeVisible();
  await shot(page, "p4-07-expirations");
});

test("facility administrator sees only staff assigned to their facility", async ({ page }) => {
  await signIn(page, "facadmin@sunshine.example");
  await page.goto("/employees");
  await expect(page.getByRole("link", { name: "Lee, Jordan" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nguyen, Leah" })).toBeVisible(); // also assigned to the ALF
  await expect(page.getByRole("link", { name: "Reed, Tanya" })).toHaveCount(0); // clinic only
  await expect(page.getByRole("link", { name: "Walsh, Kevin" })).toHaveCount(0);
});

test("supervisor sees direct reports only, with training status", async ({ page }) => {
  await signIn(page, "supervisor@sunshine.example");
  await expect(page.getByRole("heading", { name: /Direct reports/ })).toBeVisible();
  await page.goto("/employees");
  await expect(page.getByRole("heading", { name: "My team" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Morales, Ana" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Brooks, Samuel" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reed, Tanya" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Add employee" })).toHaveCount(0);
  await shot(page, "p4-08-supervisor-team");
  await page.getByRole("link", { name: "Morales, Ana" }).click();
  await expect(page.getByRole("heading", { name: "Training assignments (3)" })).toBeVisible();
});

test("announcement reaches staff; learner sees assigned training and manages email preferences", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/notifications");
  await page.getByLabel("Title").fill(`Fire drill ${stamp}`);
  await page.getByLabel("Message").fill("Facility fire drill on Friday at 10:00. Review your evacuation route. (DEMO)");
  await page.getByLabel("Audience").selectOption("facility");
  await page.getByLabel("Facility").selectOption({ label: "Sunshine Assisted Living – Tampa (DEMO)" });
  await page.getByRole("button", { name: "Send announcement" }).click();
  await expect(page.getByText(/Announcement sent to \d+ member/)).toBeVisible();
  await page.goto("/admin/notifications");
  await expect(page.getByLabel(/Reminder schedule/)).toHaveValue("90, 60, 30, 15, 7");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Notification and renewal settings saved.")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(/\/login/);

  await signIn(page, "learner@sunshine.example");
  await page.goto("/learning");
  await expect(page.getByRole("heading", { name: /Assigned training/ })).toBeVisible();
  await expect(page.getByText(/Due:/).first()).toBeVisible();
  await shot(page, "p4-09-learner-assigned");
  await page.goto("/notifications");
  await expect(page.getByText(`Fire drill ${stamp}`)).toBeVisible();
  await page.goto("/settings/notifications");
  await page.getByLabel("Announcements from administrators").uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Notification preferences saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Announcements from administrators")).not.toBeChecked();
  await expect(page.getByLabel(/Expiration warnings/)).toBeDisabled();
});

test("scheduled jobs require the cron secret; employee pages require permission", async ({ page, request }) => {
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  expect((await request.get("/api/cron/email", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
  await signIn(page, "learner@sunshine.example");
  await page.goto("/employees");
  await expect(page).toHaveURL(/\/forbidden/);
  await page.goto("/training");
  await expect(page).toHaveURL(/\/forbidden/);
});
