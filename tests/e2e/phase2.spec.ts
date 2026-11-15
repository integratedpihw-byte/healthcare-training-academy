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
const mainNav = (page: Page) => page.getByRole("navigation", { name: "Main", exact: true });

test.describe.configure({ mode: "serial" });

test("learner browses the catalog, enrolls, learns, checks knowledge, bookmarks and resumes", async ({ page }) => {
  await signIn(page, "learner@sunshine.example");
  await mainNav(page).getByRole("link", { name: "Course Catalog" }).click();
  await expect(page.getByRole("heading", { name: "Course Catalog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "OSHA Bloodborne Pathogens" })).toBeVisible();
  await shot(page, "p2-01-catalog");

  // Filter
  await page.getByLabel("Search").fill("HIPAA");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page.getByRole("link", { name: "OSHA Bloodborne Pathogens" })).toHaveCount(0);
  await page.getByRole("link", { name: /HIPAA Privacy and Security/ }).click();

  // Course detail with objectives, sources, and the DEMO review notice
  await expect(page.getByRole("heading", { name: "Learning objectives" })).toBeVisible();
  await expect(page.getByText("DEMO: this course was published for demonstration")).toBeVisible();
  await expect(page.getByRole("link", { name: "Summary of the HIPAA Privacy Rule" })).toBeVisible();
  await shot(page, "p2-02-course-detail");
  await page.getByRole("button", { name: "Enroll and start" }).click();

  // Player: first lesson
  await expect(page).toHaveURL(/\/learning\/[0-9a-f-]+\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: "Introduction: trust is part of care" })).toBeVisible();
  await page.getByRole("button", { name: "Bookmark" }).click();
  await expect(page.getByRole("button", { name: "Bookmarked" })).toBeVisible();
  await shot(page, "p2-03-player-text");
  await page.getByRole("button", { name: /Mark complete & continue/ }).click();
  await expect(page.getByRole("heading", { name: "Covered entities, business associates and PHI" })).toBeVisible();
  await page.getByRole("button", { name: /Mark complete & continue/ }).click();

  // Knowledge check: wrong, then right
  await expect(page.getByRole("heading", { name: "Knowledge check: the basics" })).toBeVisible();
  await page.getByRole("radio", { name: /de-identified dataset/ }).check();
  await page.getByRole("radio", { name: /^Covered entity$/ }).check();
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText("Not quite.").first()).toBeVisible();
  await page.getByRole("radio", { name: /voicemail left by a nurse/ }).check();
  await page.getByRole("radio", { name: /Business associate that must sign/ }).check();
  await page.getByRole("button", { name: "Check again" }).click();
  await expect(page.getByText("Knowledge check complete.")).toBeVisible();
  await shot(page, "p2-04-knowledge-check");

  // Progress appears in My Learning, with the bookmark; Resume returns to the course
  await mainNav(page).getByRole("link", { name: "My Learning" }).click();
  await expect(page.getByText(/HIPAA Privacy and Security/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Introduction: trust is part of care" })).toBeVisible();
  await expect(page.getByRole("progressbar").first()).toHaveAttribute("aria-valuenow", /^[1-9]\d?$/);
  await shot(page, "p2-05-my-learning");
  await page.locator("section", { has: page.getByRole("heading", { name: /^In progress/ }) }).getByRole("listitem").filter({ hasText: "HIPAA" }).getByRole("link", { name: "Resume" }).click();
  await expect(page).toHaveURL(/\/learning\/[0-9a-f-]+\/[0-9a-f-]+$/);
});

test("presentation lessons page through slides, and course materials print view renders", async ({ page }) => {
  await signIn(page, "learner@sunshine.example");
  await page.goto("/learning");
  await page.locator("section", { has: page.getByRole("heading", { name: /^In progress/ }) }).getByRole("listitem").filter({ hasText: "HIPAA" }).getByRole("link", { name: "Resume" }).click();
  await page.getByRole("navigation", { name: "Course outline" }).getByRole("link", { name: "The rights patients have over their information" }).click();
  await expect(page.getByText("Slide 1 of 7")).toBeVisible();
  await page.getByRole("button", { name: "Next →" }).first().click();
  await expect(page.getByText("Slide 2 of 7")).toBeVisible();
  await expect(page.getByRole("heading", { name: "1. Right of access" })).toBeVisible();
  await shot(page, "p2-06-presentation");
  const url = page.url().split("/").slice(0, -1).join("/");
  await page.goto(`${url}/materials`);
  await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learning objectives" })).toBeVisible();
});

const stamp = Date.now();
const courseTitle = `Sunshine Elopement Prevention ${stamp} (DEMO)`;

test("training director builds a course; organization admin approves and publishes it; learners can enroll", async ({ page }) => {
  await signIn(page, "director@sunshine.example");
  await page.goto("/catalog");
  await page.getByRole("link", { name: "Manage courses" }).click();
  await expect(page.getByRole("heading", { name: "Manage organization courses" })).toBeVisible();
  await page.getByLabel("Course ID", { exact: true }).fill(`SCG-ELOPE-${String(stamp).slice(-5)}`);
  await page.getByLabel("Course title").fill(courseTitle);
  await page.getByLabel("Category").selectOption({ label: "Facility-Specific Training Programs" });
  await page.getByLabel("Estimated minutes").fill("20");
  await page.getByLabel("Description", { exact: true }).fill("How our assisted living community prevents resident elopement and responds to a missing resident.");
  await page.getByLabel("Target audience").fill("All resident care staff");
  await page.getByRole("button", { name: "Create draft course" }).click();
  await expect(page.getByText("Draft created.")).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.getByLabel("One objective per line").fill("Identify residents at risk of elopement\nRespond to a missing-resident alert");
  await page.getByRole("button", { name: "Save objectives" }).click();
  await expect(page.getByText("Learning objectives saved.")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("New module title").fill("1. Risk and response");
  await expect(page.getByLabel("New module title")).toHaveValue("1. Risk and response");
  await page.getByRole("button", { name: "Add module" }).click();
  await expect(page.getByText("Module added.")).toBeVisible();
  await page.getByText("Add a lesson · edit module").click();
  await page.locator("#m0-title").fill("Missing resident procedure");
  await page.locator("#m0-body").fill("## Code Yellow\n1. Alert the charge nurse.\n2. Search assigned zones.\n3. Notify family and police per policy.");
  await page.getByRole("button", { name: "Add lesson" }).click();
  await expect(page.getByRole("heading", { name: "Learner preview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Code Yellow" })).toBeVisible();
  await shot(page, "p2-07-lesson-editor");
  await page.getByRole("link", { name: "← Back to course" }).click();

  // Drag-and-drop ordering: a second module is dragged above the first, then the lesson is dragged into it.
  await page.getByLabel("New module title").fill("2. Prevention");
  await page.getByRole("button", { name: "Add module" }).click();
  await expect(page.getByRole("img", { name: "Drag to move 2. Prevention" })).toBeVisible();
  const moduleTitles = () => page.locator("ol > li > div:first-of-type > div.font-medium").allTextContents();
  expect(await moduleTitles()).toEqual(["1. Risk and response", "2. Prevention"]);
  await page.getByRole("img", { name: "Drag to move 2. Prevention" }).dragTo(page.getByText("1. Risk and response", { exact: true }), { targetPosition: { x: 5, y: 2 } });
  await expect(page.getByRole("status").filter({ hasText: "Module moved to position 1." })).toBeAttached();
  await expect.poll(moduleTitles).toEqual(["2. Prevention", "1. Risk and response"]);
  await page.getByRole("img", { name: "Drag to move Missing resident procedure" }).dragTo(page.getByText("No lessons yet. Drag a lesson here, or add one below."));
  await expect(page.locator("ol > li").first().getByRole("link", { name: "Missing resident procedure" })).toBeVisible();
  await page.reload(); // the order is saved, not just shown
  expect(await moduleTitles()).toEqual(["2. Prevention", "1. Risk and response"]);
  await expect(page.locator("ol > li").first().getByRole("link", { name: "Missing resident procedure" })).toBeVisible();
  await expect(page.locator("ol > li").nth(1).getByText("No lessons yet.")).toBeVisible();
  if (process.env.DND_SHOT) await page.locator("ol").first().locator("xpath=ancestor::section[1]").screenshot({ path: process.env.DND_SHOT });
  await page.locator("ol > li").nth(1).getByRole("button", { name: "Delete module and its lessons" }).click(); // a module without lessons cannot be submitted
  await expect.poll(moduleTitles).toEqual(["2. Prevention"]);

  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Submitted for review.")).toBeVisible();
  // Separation of duties: the author cannot approve their own course
  await page.getByRole("button", { name: "Record decision" }).click();
  await expect(page.getByText(/Separation of duties/)).toBeVisible();
  await shot(page, "p2-08-builder");
  await page.getByRole("button", { name: "Sign out" }).first().click();

  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/catalog/manage");
  await page.getByRole("link", { name: courseTitle }).click();
  for (const label of ["Record decision", "Record decision"]) {
    await page.getByRole("button", { name: label }).click();
    await expect(page.getByText("Decision recorded.")).toBeVisible();
  }
  await page.getByRole("button", { name: "Publish to catalog" }).click();
  await expect(page.getByText("PUBLISHED").first()).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).first().click();

  await signIn(page, "learner@sunshine.example");
  await page.goto("/catalog");
  await page.getByRole("link", { name: courseTitle }).click();
  await page.getByRole("button", { name: "Enroll and start" }).click();
  await expect(page.getByRole("heading", { name: "Missing resident procedure" })).toBeVisible();
  await page.getByRole("button", { name: /Mark complete & finish/ }).click();
  await expect(page.getByText(/Course completed on/)).toBeVisible();
});

test("organization-specific courses are invisible to other organizations", async ({ page }) => {
  await signIn(page, "orgadmin@gulfcoast.example");
  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: "OSHA Bloodborne Pathogens" })).toBeVisible();
  await expect(page.getByRole("link", { name: courseTitle })).toHaveCount(0);
});

test("platform administrator manages the master course library", async ({ page }) => {
  await signIn(page, "superadmin@chta-platform.example");
  await page.getByRole("link", { name: "Course Library" }).click();
  await expect(page.getByRole("heading", { name: "Master course library" })).toBeVisible();
  await page.getByRole("link", { name: "OSHA Bloodborne Pathogens" }).click();
  await expect(page.getByRole("heading", { name: "Approval history" })).toBeVisible();
  await expect(page.getByText(/NOT a qualified subject-matter or clinical review/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Create new version" })).toBeVisible();
  await shot(page, "p2-09-platform-library");
});
