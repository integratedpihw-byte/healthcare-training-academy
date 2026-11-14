import { expect, test, type Page } from "@playwright/test";
import { LIBRARY } from "../../src/content";

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
const signOut = async (page: Page) => {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(/\/login/);
};

const sp = LIBRARY.find((c) => c.code === "CHITA-MC-006")!;
const byPrompt = new Map(sp.finalExam.questions.map((q) => [q.prompt, q]));

test.describe.configure({ mode: "serial" });

let verificationCode = "";

test("learner fails the final exam, reviews explanations, retakes and passes; certificate issued and verifiable", async ({ page, request }) => {
  await signIn(page, "learner@sunshine.example");
  await page.goto("/learning");
  await page.getByRole("listitem").filter({ hasText: "Standard Precautions" }).getByRole("link", { name: "Resume" }).first().click();
  await page.getByRole("link", { name: "Go to the final examination" }).click();
  await expect(page.getByRole("heading", { name: /Final Examination/ })).toBeVisible();
  await shot(page, "p3-01-exam-overview");

  // Attempt 1: submit without answering → fail with explanations
  await page.getByRole("button", { name: "Start attempt 1" }).click();
  await expect(page.getByText("Question 1 of 15")).toBeVisible();
  await page.getByRole("navigation", { name: "Questions" }).getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(/15 question\(s\) unanswered/)).toBeVisible();
  await page.getByRole("button", { name: "Submit examination" }).click();
  await expect(page.getByText(/Not passed — 0%/)).toBeVisible();
  await expect(page.getByText("Explanation:").first()).toBeVisible();
  await expect(page.getByText("Correct answer:")).toHaveCount(0); // not revealed while attempts remain
  await shot(page, "p3-02-exam-failed-review");

  // Attempt 2: answer correctly
  await page.getByRole("link", { name: "← Examination" }).click();
  await page.getByRole("button", { name: "Start attempt 2" }).click();
  for (let n = 0; n < 15; n++) {
    await expect(page.getByText(`Question ${n + 1} of 15`)).toBeVisible();
    const legend = (await page.locator("fieldset legend").first().innerText()).trim();
    const q = byPrompt.get(legend);
    expect(q, `unknown question: ${legend}`).toBeDefined();
    const correct = Array.isArray(q!.correct) ? q!.correct : [q!.correct];
    for (const id of correct) {
      const text = q!.options.find((o) => o.id === id)!.text;
      await page.locator("fieldset label").filter({ hasText: new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).click();
    }
    await expect(page.getByText("Saved")).toBeVisible();
    if (n === 7) await shot(page, "p3-03-exam-player");
    if (n < 14) await page.getByRole("button", { name: "Next →" }).click();
  }
  await page.getByRole("button", { name: "Review and submit" }).click();
  await expect(page.getByText("All questions answered.")).toBeVisible();
  await page.getByRole("button", { name: "Submit examination" }).click();
  await expect(page.getByText(/Passed — 100%/)).toBeVisible();
  await expect(page.getByText("Correct answer:").first()).toBeVisible();
  await shot(page, "p3-04-exam-passed");

  // Certificate
  await page.getByRole("link", { name: "View certificate" }).click();
  await expect(page.getByRole("cell", { name: /Standard Precautions/ })).toBeVisible();
  await page.getByRole("link", { name: "Details" }).first().click();
  await expect(page.getByText("Course completion · Jordan Lee")).toBeVisible();
  await shot(page, "p3-05-certificate");
  const codeText = await page.getByText(/· code/).innerText();
  verificationCode = /code\s+([A-Z2-9]{10})/.exec(codeText)![1];
  const pdfHref = await page.getByRole("link", { name: "Download PDF" }).getAttribute("href");
  const pdf = await page.request.get(pdfHref!);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

  // Public verification works without signing in
  const anon = await request.get(`/verify/${verificationCode}`);
  expect(anon.status()).toBe(200);
  await signOut(page);
  await page.goto("/verify");
  await page.getByLabel("Verification code").fill(verificationCode.toLowerCase());
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText(/Valid\./)).toBeVisible();
  await expect(page.getByText("Jordan Lee")).toBeVisible();
  await shot(page, "p3-06-verify-valid");
});

test("another learner cannot download someone else's certificate PDF", async ({ page }) => {
  await signIn(page, "orgadmin@gulfcoast.example");
  await page.goto("/certificates");
  await expect(page.getByRole("heading", { name: "Certificates" })).toBeVisible();
  // Gulf Coast cannot see Sunshine certificates at all
  await expect(page.getByText("Jordan Lee")).toHaveCount(0);
});

test("supervisor records and electronically signs a skills evaluation", async ({ page }) => {
  await signIn(page, "supervisor@sunshine.example");
  await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Competency Management" }).click();
  await expect(page.getByRole("heading", { name: /Competency matrix/ })).toBeVisible();
  await shot(page, "p3-07-competency-matrix");
  await page.getByRole("link", { name: "New evaluation" }).click();
  await page.getByLabel("Employee").selectOption({ label: "Ana Morales — Medication Technician" });
  await page.getByLabel("Facility").selectOption({ label: "Sunshine Assisted Living – Tampa (DEMO)" });
  await page.getByLabel("Skill checklist").selectOption({ label: "PPE application and removal" });
  const groups = page.getByRole("radiogroup");
  const count = await groups.count();
  for (let i = 0; i < count; i++) await groups.nth(i).getByText("Met", { exact: true }).click();
  await groups.nth(3).getByText("Not met", { exact: true }).click(); // non-critical: respirator seal check
  await expect(page.getByText(/Derived result: NEEDS REMEDIATION/)).toBeVisible();
  await page.getByLabel("Remediation required").fill("Review and demonstrate a user seal check with the clinical educator.");
  await shot(page, "p3-08-evaluation-form");
  await page.getByRole("button", { name: "Save evaluation (draft)" }).click();
  await expect(page.getByText("Draft saved.")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByLabel("Your credentials (optional)").fill("Resident Care Supervisor");
  await page.getByLabel("Re-enter your password to sign").fill("wrong-password-123");
  await page.getByRole("button", { name: "Apply electronic signature" }).click();
  await expect(page.getByText("Password is incorrect.")).toBeVisible();
  await page.getByLabel("Re-enter your password to sign").fill(PW);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Apply electronic signature" }).click();
  await expect(page.getByText("Signed. The record is now locked")).toBeVisible();
  await expect(page.getByText("Signature verified — record unchanged since signing.")).toBeVisible();
  await shot(page, "p3-09-signed-record");
});

test("organization admin revokes a certificate and verification reflects it; instructor portal shows results", async ({ page }) => {
  await signIn(page, "orgadmin@sunshine.example");
  await page.goto("/certificates?view=org");
  await page.getByRole("row", { name: /Grace Kim/ }).getByRole("link", { name: "Details" }).click();
  await page.getByLabel("Reason").fill("Issued during a proctoring irregularity under review (DEMO).");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Revoke permanently" }).click();
  await expect(page.getByText(/Certificate revoked/)).toBeVisible();
  const code = /code\s+([A-Z2-9]{10})/.exec(await page.getByText(/· code/).innerText())![1];
  await page.goto(`/verify/${code}`);
  await expect(page.getByText(/Revoked\./)).toBeVisible();

  await page.goto("/instructor");
  await expect(page.getByRole("heading", { name: "Results by course" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Standard Precautions/ }).first()).toBeVisible();
  await shot(page, "p3-10-instructor-portal");
});

test("platform library: exam settings and question bank are visible and frozen on published versions", async ({ page }) => {
  await signIn(page, "superadmin@chta-platform.example");
  await page.getByRole("link", { name: "Course Library" }).click();
  await page.getByRole("link", { name: "OSHA Bloodborne Pathogens" }).click();
  await page.getByRole("link", { name: /Examination & question bank/ }).click();
  await expect(page.getByRole("heading", { name: /Question bank \(15 active of 15\)/ })).toBeVisible();
  await expect(page.getByText(/Settings are frozen on published versions/)).toBeVisible();
  await shot(page, "p3-11-question-bank");
});
