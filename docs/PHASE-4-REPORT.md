# Phase 4 — Workforce Management: Completion Report

**Project:** Complete Healthcare Innovative Training Academy
**Phase:** 4 of 7 (employee profiles, onboarding, training assignments, renewal management, notifications)
**Date:** November 13, 2026

## 1. Completed functionality

| Spec item | Delivered |
|---|---|
| Employee profiles (§12) | Every field in §12: employee ID, name, work email and phone, organization, primary facility, department, job title, normalized **position code** (drives requirements), employment status (active, on leave, PRN, contractor, terminated with date), hire date, supervisor, exposure flags (clinical, bloodborne), required training pathway. Duplicate IDs and circular reporting lines are refused. All changes are audited. |
| Multiple facilities "when authorized" | Employees can be assigned to additional facilities by someone who manages **that** facility. The primary facility can't be removed. |
| Licenses and external certifications | Kind, name, number, issuing authority, state, issue and expiry dates, notes. Verification is a separate, attributable act: the verifier, date and **verification source** are required. A changed expiry date automatically resets verification (database rule). The academy never issues licenses; the UI says so and points to the issuing authority. |
| Academy accounts | "Create account and send invitation" gives an employee the **Learner** role only and emails a set-password link. Facility Administrators can do this for their own staff without broader user-management rights. |
| Onboarding (§12 steps 1–11) | **Run onboarding** (offered automatically on "Add employee") identifies the facility and position, finds the applicable requirements, builds the checklist, assigns required courses with deadlines and sends the employee one summary notification. It's safe to re-run after a change of position or facility: only newly required items are assigned. Each run is saved as an unchangeable snapshot. The profile shows a live **11-step checklist**, including progress (8), passed assessments (9), signed competencies (10) and compliance status (11). |
| Training requirements and pathways | The organization defines requirements: course **or** skills checklist; applies to facility types / positions / exposure; due within N days of hire; repeat every N months; an optional per-requirement reminder schedule; and "flag for review instead of auto-assigning". Requirements are labeled *organizational policy* or *accreditation*. Florida/federal regulatory mappings with citations are deferred to the Compliance Center (Phase 5) and are not invented here. |
| Training assignments | Assign a published course to selected employees, or to a whole facility, position or department. Employees with an open assignment for the course are skipped. Status follows the employee's enrollment automatically: **In progress** when started, **Completed** only when the course is completed, including every mandatory exam. Waive (needs `training.records.approve`) or cancel only with a written reason. Due-date corrections are audited with a reason, and an overdue item returns to its working status. There is a history panel on every assignment. |
| Renewal and expiration engine (§13) | A daily job (`/api/cron/daily`) covers: overdue marking; employee + supervisor alerts; **administrator escalation** after a configurable delay; due-date reminders; certificate expiry warnings; **automatic renewal assignments** when a certificate enters the renewal window (due on the expiry date); recurring assignments for requirements with a frequency; license expiry warnings to the employee, supervisor and managers, with expired licenses marked EXPIRED; and competency reassessment due/overdue alerts and escalation. Reminder lead times default to **90, 60, 30, 15 and 7 days**, configurable for the organization and per requirement. **Expiration dates are never extended** by the engine. |
| Employee compliance status | Compliant / Due soon / Non-compliant / No training assigned, from overdue assignments, expired licenses and overdue skills checks. Shown on the employee list (with filters and counts), the profile, supervisor dashboards and the admin dashboard. |
| Notification center (§18) | In-app notifications now link to their records. **Email delivery** goes through a queued outbox with retries and exponential backoff (Resend in production, console in development). Organization settings cover the reminder schedule, escalation delay, renewal window, default due window and email on/off. Personal preferences let members mute assignment, result and announcement emails; **expiration, overdue and compliance alerts can't be muted**. Administrator **announcements** can go to everyone, a facility or a role; facility administrators can address only their facilities. |
| Navigation | **Training Management** (Assignments, Assign training, Requirements & pathways, Expirations) and **Employee Management** ("My team" for supervisors) are live. My Learning shows assigned training with due dates and the learner's licenses. Admin and supervisor dashboards show training status. |

## 2. Rules enforced by the database (migrations 0006–0007)

| Rule | How |
|---|---|
| **Facility scoping is now enforced in the database** (previously only in the app) | SECURITY DEFINER helpers (`app_can_access_employee`, `app_can_access_user`, `app_has_permission_at`, `app_has_tenant_permission`). Facility-scoped roles read and write only employees assigned to their facilities. This applies to employees, licenses, assignments, enrollments, lesson progress, exam attempts and answers, certificates and competency records. |
| Least-privilege supervisors | New `team.view` permission. The Supervisor role no longer has tenant-wide `employees.view` / `training.view_all` / `certificates.view_all` / `competency.view`; supervisors see their **direct reports only** (by `supervisor_id`), and can record skills evaluations only for employees they can see. |
| Assignment integrity | New assignments start ASSIGNED and must be for published courses available to the tenant. COMPLETED is set only when a completed enrollment exists (synced by trigger). Closed assignments can't be changed. Waive/cancel need a reason. The application can never delete an assignment. There is one open assignment per employee and course (unique index). |
| License integrity | VERIFIED requires a verifier, date and source. A new expiry date resets verification. Expiry can't precede issue. |
| Notifications private | Recipients alone can read, update or delete their notifications. Notifications are created through `app_insert_notifications()`, which accepts only active members of the current tenant. |
| Email outbox | Written only by a trigger that applies organization and personal preferences. The application role has no access. |
| Onboarding snapshots and announcements | Insert-only for the application. |

## 3. Tests

| Suite | Result |
|---|---|
| Unit (`npm test`) | **63 passed**. New: requirement applicability, due-date rules, reminder thresholds, lead-day parsing, compliance status, email categories, email composition, backoff. |
| Integration (`npm run test:integration`, real Postgres with RLS) | **99 passed**. New `workforce.test.ts` (21 tests) covers facility/team scoping, the cross-tenant check, profile validation, account provisioning, license rules, onboarding (assign / review / competency / idempotent / immutable), assignment lifecycle and guards, bulk assignment, due-date correction, overdue + escalation without duplicates, reminder thresholds, renewal assignments without expiry extension, license expiry, notification privacy, email preferences, delivery and retry, and announcements. |
| End-to-end (Playwright, production build) | **27 passed** (phases 1–4). New: admin adds an employee with onboarding and verifies a license; overdue assignment rescheduled; facility-admin and supervisor scoping; announcement → learner; email preferences; cron authentication; learner denied. |
| Static checks | `tsc` and ESLint clean; production build succeeds. |

**Defects found and fixed during this phase:**
- **Scheduled jobs were redirected to sign-in.** The session middleware redirected `/api/cron/*` to the sign-in page, so the Phase 3 expiry job would never have run on Vercel. Cron routes are now excluded from the middleware and authenticate with `CRON_SECRET`.
- **Supervisors could see every employee.** While writing the scoping tests, the first version of the visibility rule let supervisors see all employees through their skills-evaluation permission. The rule was corrected and is now covered by a test.
- **Notifications were not private.** Previously they were filtered only in application code; a database policy now enforces it.

## 4. Configuration and deployment notes

- **Database role change (one-time):** the migration owner role now needs `BYPASSRLS` (`scripts/db/setup-roles.sql`). The owner already controls its tables; the attribute lets the narrowly scoped access helpers run without policy recursion. Migration 0007 stops with a clear message if it's missing.
- **Scheduled jobs (`vercel.json`):**
  - `/api/cron/daily` at 06:15 UTC runs certificate expiry, the renewal engine and email delivery.
  - `/api/cron/email` runs every 10 minutes for the email queue.
  - Vercel's Hobby plan allows daily crons only. On Hobby, the daily job still delivers email once a day.
  - Set `CRON_SECRET`.
- **Email:** set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `EMAIL_FROM` (on a verified sending domain). Messages to reserved test domains (`.example`, `.test`) are suppressed in production.
- **Demo data:** `npm run db:reset` adds four **DEMO organizational policy** requirements, three DEMO licenses, onboarding for all Sunshine employees and one backdated overdue assignment, so the escalation path is visible. Everything is labeled DEMO.

## 5. Best-practice recommendations

1. Replace the DEMO requirements with requirements approved by your compliance lead before onboarding real staff. Requirements are your policy, not legal determinations.
2. Verify licenses against the primary source and record how (for Florida health professions, the Department of Health license verification service). Re-verify at renewal; the system forces this when the expiry date changes.
3. Keep employee records free of clinical or health information. Email bodies are designed to contain none.
4. Use the "flag for review" option for any requirement whose applicability you are unsure of. Onboarding will surface it instead of assigning it.
5. Turn on two-step verification for every administrator. The dashboard reminds administrators who haven't.

## 6. Remaining work (later phases)

| Item | Phase |
|---|---|
| Florida and federal regulatory rules engine with citations, verification status and applicability mapping to requirements; compliance dashboards and audit reports | 5 |
| Remaining 12 priority courses (Florida ALF items need AHCA / Ch. 429 / 59A-36 verification) | 5 |
| Instructor-led and live sessions, training calendar and attendance (tables exist; UI deferred); instructor messages to course learners | 6 |
| Optional SMS delivery (Twilio), video hosting and uploads, Stripe billing, AI education assistant, analytics and exports | 6 |
| Security and performance testing, accessibility audit, load tests for the daily engine at scale | 7 |
