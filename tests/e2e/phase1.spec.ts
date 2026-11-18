import { expect, test, type Page } from "@playwright/test";

const DEMO_PW = process.env.SEED_DEMO_PASSWORD ?? "Demo-Academy#2026";
const SHOTS = process.env.E2E_SCREENSHOTS; // directory for documentation screenshots

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

async function signIn(page: Page, email: string, password = DEMO_PW, expectSuccess = true) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (expectSuccess) await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
}

test("anonymous users are sent to sign-in and returned afterwards", async ({ page }) => {
  await page.goto("/admin/facilities");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Ffacilities/);
  await shot(page, "01-login");
  await page.getByLabel("Email").fill("orgadmin@sunshine.example");
  await page.getByLabel("Password").fill(DEMO_PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/facilities/);
});

test("wrong password shows a generic error", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example", "Not-The-Password-1!", false);
  await expect(page.getByRole("alert").filter({ hasText: "Incorrect email or password" })).toBeVisible();
});

const stamp = Date.now();
const newOrg = { name: `Coastal Behavioral Health ${stamp}`, email: `owner+${stamp}@coastal.example`, pw: "Coastal-Behav#2026" };

test("organization registration → pending → platform approval → active dashboard", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Continue" }).click(); // required fields still empty: stays on step 1
  await expect(page.getByLabel("Work email")).toBeHidden();
  await page.getByLabel("Organization name").fill(newOrg.name);
  await page.getByLabel("First facility name").fill("Coastal BH – Jacksonville");
  await page.getByLabel("Facility type").selectOption("BEHAVIORAL_HEALTH");
  await page.getByLabel("City").fill("Jacksonville");
  await expect(page.getByLabel("Work email")).toBeHidden(); // step 1 shows only the organization
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /Step 2 of 2/ })).toBeFocused();
  await page.getByLabel("First name").fill("Casey");
  await page.getByLabel("Last name").fill("Rivers");
  await page.getByLabel("Work email").fill(newOrg.email);
  await page.getByLabel("Password", { exact: true }).fill(newOrg.pw);
  await page.getByLabel("Confirm password").fill(newOrg.pw);
  await page.getByRole("checkbox").check();
  await shot(page, "02-register");
  await page.getByRole("button", { name: "Register organization" }).click();
  await expect(page).toHaveURL(/organization-status/);
  await expect(page.getByText("awaiting review")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/organization-status/); // tenant features locked until approval
  await page.getByRole("button", { name: "Sign out" }).click();

  // Platform administrator approves
  await signIn(page, "superadmin@chta-platform.example");
  await expect(page).toHaveURL(/\/platform/);
  await page.getByRole("link", { name: "pending approval" }).click();
  await shot(page, "03-platform-console");
  await page.getByRole("link", { name: newOrg.name }).click();
  await page.getByRole("button", { name: "Approve organization" }).click();
  await expect(page.locator("span").filter({ hasText: /^ACTIVE$/ }).first()).toBeVisible();
  await signOut(page);

  // New admin now reaches the dashboard
  await signIn(page, newOrg.email, newOrg.pw);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Welcome back, Casey" })).toBeVisible();
  await expect(page.getByText("Coastal BH – Jacksonville")).toBeVisible();
});

test("organization admin dashboard, facilities, users, custom roles and audit integrity", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await expect(page.getByText("DEMO DATA")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Workforce by facility" })).toBeVisible();
  await expect(page.getByText("Sunshine Assisted Living – Tampa (DEMO)").first()).toBeVisible();
  await shot(page, "04-admin-dashboard");

  // Create a facility
  await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Administration" }).click();
  await page.getByRole("link", { name: /Facilities & departments/ }).click();
  const fname = `Sunshine Adult Day Center ${stamp} (DEMO)`;
  await page.getByLabel("Facility name").fill(fname);
  await page.getByLabel("Facility type").selectOption("ADULT_DAY_CARE");
  await page.getByLabel("City").fill("Clearwater");
  await page.getByRole("button", { name: "Create facility" }).click();
  await expect(page.getByText("Facility created.")).toBeVisible();
  await expect(page.getByRole("cell", { name: fname })).toBeVisible();
  await shot(page, "05-facilities");

  // Add a user with a facility-scoped role
  await page.goto("/admin/users");
  await page.getByLabel("Email").fill(`newhire+${stamp}@sunshine.example`);
  await page.getByLabel("First name").fill("Nia");
  await page.getByLabel("Last name").fill("Hart");
  await page.getByLabel("Role").selectOption({ label: "Facility Administrator" });
  await page.getByLabel("Facility scope").selectOption({ label: "Sunshine Assisted Living – Tampa (DEMO)" });
  await page.getByRole("button", { name: "Add user" }).click();
  await expect(page.getByText("set-password email has been sent")).toBeVisible();
  await expect(page.getByText(`newhire+${stamp}@sunshine.example`)).toBeVisible();
  await shot(page, "06-users");

  // Custom role
  await page.goto("/admin/roles");
  await page.getByLabel("Role name").fill(`Scheduler ${stamp}`);
  await page.getByRole("checkbox", { name: /View employee profiles/ }).check();
  await page.getByRole("button", { name: "Create role" }).click();
  await expect(page.getByText("Custom role created.")).toBeVisible();
  // Clinical approval is not grantable by an org admin
  await expect(page.getByRole("checkbox", { name: /Grant clinical approval/ })).toBeDisabled();

  // Audit integrity
  await page.goto("/admin/audit");
  await page.getByRole("button", { name: "Verify audit chain" }).click();
  await expect(page.getByText(/entries verified/)).toBeVisible();
  await shot(page, "07-audit");
});

test("learners see a personal dashboard and are denied administration", async ({ page }) => {
  await signIn(page, "learner@sunshine.example");
  await expect(page.getByRole("heading", { name: "Welcome back, Jordan" })).toBeVisible();
  await expect(page.getByText("Resident Care Aide")).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  await expect(nav.getByRole("link", { name: "Administration" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Billing" })).toHaveCount(0);
  await shot(page, "08-learner-dashboard");
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/forbidden/);
});

test("supervisors see their direct reports", async ({ page }) => {
  await signIn(page, "supervisor@sunshine.example");
  await expect(page.getByRole("heading", { name: /Direct reports \(3\)/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Ana Morales/ })).toBeVisible();
});

test("facility administrators only see their own facility's workforce", async ({ page }) => {
  await signIn(page, "facadmin@sunshine.example");
  await expect(page.getByText("Overview of the facilities you administer.")).toBeVisible();
  await expect(page.getByText("Sunshine Assisted Living – Tampa (DEMO)").first()).toBeVisible();
  await expect(page.getByText("Sunshine Community Clinic – St. Petersburg (DEMO)")).toHaveCount(0);
});

test("one organization cannot open another organization's records by URL", async ({ page }) => {
  // Find a Sunshine facility ID as Sunshine admin…
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/admin/facilities");
  const href = await page.getByRole("link", { name: "Edit" }).first().getAttribute("href");
  await signOut(page);
  // …then try it as Gulf Coast's admin.
  await signIn(page, "orgadmin@gulfcoast.example");
  await expect(page).toHaveURL(/\/dashboard/);
  const res = await page.goto(href!);
  expect(res?.status()).toBe(404);
});

test("security settings: MFA setup is offered and sessions are listed", async ({ page }) => {
  await signIn(page, "director@sunshine.example");
  await page.goto("/settings/security");
  await page.getByRole("button", { name: "Set up two-step verification" }).click();
  await expect(page.getByAltText("QR code for authenticator setup")).toBeVisible();
  await expect(page.getByText("This session")).toBeVisible();
  await shot(page, "09-security");
});

test("responsive layout on a phone", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await signIn(page, "orgadmin@sunshine.example");
  await expect(page.getByRole("navigation", { name: "Main (mobile)" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  await shot(page, "10-mobile");
  await ctx.close();
});

test("security headers are present", async ({ request }) => {
  const res = await request.get("/login");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});
