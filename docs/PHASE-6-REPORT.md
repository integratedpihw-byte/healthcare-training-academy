# Phase 6 report: Enterprise

**Scope (master prompt §26, Phase 6):**
- AI education assistant (§16)
- Instructor management (§17)
- Analytics (§14)
- Subscription billing (§19)
- Enterprise administration

**Also delivered:**
- The deferred course attendance report (§15 #9)
- Instructor messages (§18)

**Status:** complete, with the deferrals listed in §5. All test suites pass: **84 unit, 127 integration and 38 end-to-end tests** across Phases 1–6.

## 1. Completed functionality

### Subscription billing (§19)

**Plans.** Four plans: Starter, Professional, Enterprise and Individual Learner.
- **Billing cycles:** monthly, or annual (annual is priced at 10× the monthly price).
- **Pricing models:** per employee, per facility, flat, or custom.
- **Trials:** 14 days.
- **Limits and feature gates:**
  - **Starter:** 1 facility and 1 department.
  - **Professional:** 3 facilities.
  - **Enterprise only:** custom courses, custom roles, analytics and the API.

**Billing page:**
- Current plan, status, cycle, pricing and seat usage.
- Included features.
- A plan comparison with Checkout buttons.
- A Stripe Customer Portal link for payment methods, cancellation and invoice PDFs.
- Invoices (linking to Stripe's hosted invoice page) and payment history.
- An upgrade banner when a gated module redirects to billing (`?upgrade=…`).

**Stripe integration:**
- Checkout and Customer Portal sessions are created server-side.
- **Webhook endpoint:** `POST /api/webhooks/stripe`.
  - Each request's signature and timestamp are verified.
  - Each event is processed exactly once, using the `billing_events` ledger.
  - It keeps subscriptions, invoices and payments in sync, and audits every change.
- **Card data never reaches the application.**
- Without Stripe keys, checkout is hidden and the page explains that plans are set by the platform administrator.

**Platform plan management.** Platform administrators can set a plan by hand for custom enterprise pricing, trials and contract terms. Every change is audited and requires a reason. The status of a Stripe-managed subscription cannot be overridden.

**Daily job:**
- Warns billing managers 7, 3 and 1 days before a trial ends.
- Moves expired trials to *Trial ended*. Existing training records and certificates remain available; new staff and content are blocked.

**Separation from training records.** Billing lives in separate tables. Tenants can read them but never write them, and the webhook ledger is platform-only.

### Instructor management (§17) and instructor messages (§18)

**Instructor Portal** gains sub-navigation:
- Grading & retakes
- Classes
- Instructors
- Messages
- Lesson assistant
- My profile

**Profiles:**
- Title, bio, qualifications and credentials. Credentials have an issuer, number and expiration; expired credentials are highlighted.
- The page states that credentials are not verified by the platform.
- Instructors edit their own profile; managers edit any profile.

**Course assignments.** Managers assign courses to each instructor and can remove assignments.

**Class scheduling:**
- In-person or live-virtual classes, entered in Florida time with daylight-saving handling.
- Linked to a course and a facility, with capacity and a description.
- Meeting links must use HTTPS.

**Rosters and attendance:**
- Schedulers register attendees, and attendees are notified.
- Learners can register themselves for open classes in courses they are enrolled in or assigned.
- Seat counts are shown to learners.
- The class's instructor (or a scheduler) records Present / Absent / Excused, then completes or cancels the class.
- Cancelling requires a reason, notifies the roster and blocks new registrations.

**Messages.** Instructors message their own class rosters, or the learners enrolled in courses assigned to them.

**Course evaluations.** These were built in Phase 2 (1–5 rating and comment, completed learners only). They now feed reports and analytics.

**Reports:**
- **#9 Course attendance:** new.
- **#10 Instructor performance:** classes, attendance rate, exam items graded, skills evaluations signed, and the average rating of assigned courses.
- **Course evaluations:** new, numbered 16.

### Analytics (§14)

**Location:** *Reports and Analytics → Analytics dashboard*. This keeps the main navigation from §22 unchanged.

**KPIs:**
- Employees and active students
- Courses, enrollments, completed and pending courses
- Overdue assignments and certificates expiring within 60 days
- Failed exams and the competency pass rate
- Training compliance
- Training hours

**Filters:** facility, department, job position, employee, course category, training status and date range.

**Charts and tables:**
- Monthly completions, with a data table
- Regulatory compliance trend, from nightly snapshots
- Facility compliance ranking
- Training status mix
- Course utilization
- Training hours by category
- Instructor performance
- Employee drill-down

**Exports:** every section exports to CSV, Excel or PDF. Exports require `reports.export` and are audited.

**Scope:** everything runs under row-level security, so each viewer sees only their own facilities and teams.

**Platform console:** gains platform-wide learning statistics and a breakdown of tenants by plan and status.

### AI education assistant (§16)

**Location:** *My Learning → AI study assistant*. Contextual entry points:
- **Exam results:** "Explain this answer"
- **Instructor Portal:** Lesson assistant
- **Compliance Center:** regulatory summary and training-gap review

**Modes:**
- Ask about a topic
- Study guide
- Practice questions (never the real exam questions)
- Explain an incorrect exam answer
- Fictional case study
- Draft a lesson (course authors only)
- Course recommendations by role
- Regulatory summary
- Training gaps (administrators only, from aggregate data)

**Grounding and labeling:**
- Sources are retrieved with full-text search over published lessons and the regulatory library, numbered [S1]…[Sn] and cited.
- Every regulation is labeled *Verified regulation* or *Not yet verified*. Course content is labeled *Approved course content*.

**Guardrails** (unit-tested and enforced before any model call):
- **PHI-like input is refused:** SSNs, record numbers, dates of birth, phone numbers, emails, addresses and patient names.
- **Refused clinical requests:** diagnosis, prescribing or treatment for a specific patient.
- **Refused authority requests:** approving competencies, issuing certificates or changing compliance status.
- The assistant has no write tools.

**Exam integrity:**
- Course-content help is refused while the learner has an exam attempt in progress.
- An answer is explained only after correct answers are released for that attempt.

**Privacy:**
- `ai_interactions` stores only the mode, source references, refusal code and token counts — never the prompt or the answer.
- Users can read only their own log; auditors can read all.

**Limits and failure handling:**
- 30 requests per user per hour (configurable).
- Provider errors are not echoed to users.
- Without `ANTHROPIC_API_KEY`, the page says the assistant is not configured.

### Enterprise administration

**Integrations & API keys** (*Administration*; Enterprise plan; `integrations.manage`):
- Keys are named, scoped and expire after 30–365 days.
- The secret is shown once; only a SHA-256 hash and a public prefix are stored.
- Keys are immutable, and revocation is permanent.

**Read-only REST API:** `GET /api/v1/{employees|assignments|certificates|compliance}`.
- Bearer authentication, comparing key hashes in constant time.
- Scope checks; pagination (up to 500 per page) and `updatedSince`.
- Rate limit of 120 requests per minute per key.
- Every call is audited.
- **Access model:** a key acts with the row-level-security scope of the administrator who created it. It stops working if that person loses `integrations.manage`, or if the plan no longer includes API access.
- **Excluded data:** contact details, PHI and exam content.

**Plan gates:**
- Custom courses: Enterprise
- Custom roles: Enterprise
- Competency and compliance: Professional and above
- Instructor-led classes: Professional and above

Gated pages redirect to Billing with an explanation. The navigation and dashboard hide modules the plan does not include.

## 2. Rules enforced by the database (migrations 0011–0013)

- **Instructors and assignments:**
  - Only `instructors.manage` can create instructors or assign courses.
  - An instructor may update only their own profile.
- **Classes:**
  - Only `training.schedule.manage` can create classes.
  - The class's own instructor may update it.
  - Deletes are blocked; classes are cancelled instead.
  - `ends_at > starts_at`.
- **Attendance:**
  - **Inserts:** a learner may insert only their own REGISTERED row. Schedulers and the class instructor may insert for others.
  - **Reads:** limited to the attendee, schedulers, the instructor and permitted supervisors.
  - **Guard trigger** (SECURITY DEFINER):
    - Rejects cancelled classes and non-members.
    - Locks the class row (`FOR UPDATE`) so concurrent registrations cannot exceed capacity.
    - Allows PRESENT or ABSENT only after the start time.
    - Records the check-in time.
  - `app_session_seats_taken()` exposes seat counts without exposing other people's rows.
- **Course reviews:** rating 1–5, and the reviewer must have a completed enrollment.
- **Announcements:** active instructors may insert them (instructor messages).
- **`ai_interactions`:** users insert only their own entries; they read their own, or all with `audit.view`.
- **`api_keys`:** require `integrations.manage`. They cannot be deleted by the app, cannot be altered, and revocation is permanent.
- **`chta_apply_security()` v7:** `billing_events` (the Stripe idempotency ledger) is platform-only.
  - **Bug found and fixed in this phase:** v6 had re-granted tenants read access to it.

## 3. Tests

**Unit (`tests/unit/enterprise.test.ts`):**
- Plan entitlements and restrictions
- Annual quotes; price IDs read only from the environment
- PHI detection
- Refusals for clinical and authority requests, while general education is allowed
- Assistant modes by role
- Florida daylight-saving conversion
- Credential parsing
- Analytics date ranges

**Integration (`tests/integration/enterprise.test.ts`):**
- **Billing webhooks:**
  - Signed, rejected when tampered, idempotent.
  - Subscription, invoice and payment sync; cancellation restricts the tenant.
  - Tenants cannot read the webhook ledger or write billing.
  - Stripe-managed status cannot be overridden.
- **Billing jobs and limits:** plan limits, trial warnings and expiry.
- **Instructor profiles:** permissions on profile edits.
- **Class scheduling:** validation.
- **Attendance rules:**
  - Capacity, self-registration and learner seat counts.
  - Forged registration and non-member registration are refused.
  - No attendance before the start time.
  - Only the class's instructor records attendance.
  - Deletes are blocked; completion and cancellation; cancellation notices.
- **Messages:** roster-only messages.
- **Reports:** attendance and performance reports.
- **Analytics:** filters and tenant isolation.
- **AI assistant:**
  - PHI and clinical refusals happen before any model call, and logs contain no content.
  - Regulatory grounding with verification flags.
  - Role-limited modes, aggregate-only gap data, the rate limit and the "unavailable" state.
- **API:**
  - Keys are created only by authorized users, hashed and immutable.
  - Scoped, paginated and tenant-isolated responses; every call is audited.
  - Plan downgrade returns 402; revocation is permanent.

**End-to-end (`tests/e2e/phase6.spec.ts`, 7 tests):**
- A director schedules a class and registers a learner; the learner sees it.
- An instructor takes attendance, sends a class message and edits their profile (an invalid credential line is rejected). Instructors are forbidden from instructor management.
- The billing page loads; a Starter tenant is redirected to upgrade.
- The analytics dashboard filters and exports CSV.
- An API key is created, the API is called (wrong scope returns 403), and revocation returns 401.
- The AI assistant answers with cited sources and refuses PHI.
- A platform administrator sets a custom plan.

**Regressions fixed during the full run:**
- The Starter dashboard was linking to the gated Compliance Center.
- An ambiguous Phase 1 selector, caused by the new plan form.

**Security check:** the production client bundle was scanned and contains no secrets, database URLs or provider endpoints.

Screenshots: `docs/screenshots/p6-*.png`.

## 4. Important limitations and best-practice recommendations

1. **Stripe setup:**
   - Create one recurring Price per plan and cycle and set the `STRIPE_PRICE_*` variables.
   - Point the webhook at `/api/webhooks/stripe` with the listed events.
   - Turn on the Customer Portal.
   - Use Stripe Tax if you sell outside Florida.
2. **AI provider agreements:**
   - The app blocks PHI-like input and stores no content. Pattern matching is still not perfect, so sign the provider's data-processing terms (and a BAA where available) before enabling the assistant for clinical staff.
   - Keep the AI disclaimer visible.
   - Have a qualified instructor review any AI-drafted lesson before it enters the course workflow; it still goes through clinical approval.
3. **Analytics compliance definition.** "Training compliance" counts employees whose required training is in good standing, which includes *due soon*. The regulatory compliance trend comes from the Compliance Center's nightly snapshots; the line appears after two snapshots.
4. **API key scope.** Keys inherit their creator's row-level-security scope. Create integration keys from a dedicated service administrator account rather than a personal one, rotate them at least yearly, and store them in a secret manager.
5. **Rate limits** live in Postgres (fixed window). At high volume, move them to Redis/Upstash.
6. **Time zones.** Classes are entered and shown in Eastern Time. Florida's Central-time panhandle facilities should note the difference until per-facility time zones are added (recommended).

## 5. Remaining work

| Item | Phase |
|---|---|
| Remaining 12 priority courses (§24), including the Florida ALF staff orientation. **Deferred: content requires qualified clinical authorship and review; the authoring workflow is complete.** | 7 (content track) |
| File and video uploads (course media, competency evidence, license documents) with malware scanning and private storage | 7 |
| Optional SMS notifications (Twilio) | 7 |
| Per-facility time zones; calendar (ICS) export for classes | 7 |
| Security and penetration testing, accessibility audit (WCAG 2.2 AA), load testing, backup/restore drills, monitoring and alerting, production runbooks | 7 |
| Additional states (the jurisdiction model is ready) | Post-launch |
