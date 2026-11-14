# Phase 7 report: Production readiness

**Scope (master prompt §26):** security testing, performance optimization, accessibility testing, automated testing, deployment and documentation.

**Also delivered:** every item deferred from earlier phases:
- the remaining 12 priority courses
- file uploads
- optional SMS notifications

**Status:** all seven phases complete.

**Final test results:**

| Suite | Passed |
|---|---:|
| Unit | 84 |
| Integration | 137 |
| End-to-end | 48 |

Lint and type checks are clean.

## 1. Completed functionality

### Initial training library: all 15 priority courses (§24)
Twelve new courses were added.

| # | Code | Course | Exam questions |
|---|---|---|---:|
| 3 | CHTA-MC-005 | Infection Prevention and Control | 15 |
| 5 | CHTA-MC-007 | Recognizing and Reporting Abuse, Neglect and Exploitation | 15 |
| 6 | CHTA-MC-008 | Patient and Resident Rights | 15 |
| 7 | CHTA-MC-009 | Emergency Preparedness | 15 |
| 8 | CHTA-MM-001 | Medication Safety Fundamentals | 15 |
| 9 | CHTA-CP-001 | Vital Signs | 15 |
| 10 | CHTA-CP-002 | Fall Prevention and Post-Fall Response | 15 |
| 11 | CHTA-CP-003 | Clinical Documentation Essentials | 15 |
| 12 | CHTA-HIV-001 | HIV/AIDS Fundamentals for Florida Healthcare Workers | 15 |
| 13 | CHTA-HIV-002 | PrEP and PEP Fundamentals | 15 |
| 14 | CHTA-LAB-001 | Laboratory Specimen Collection and Handling | 15 |
| 15 | CHTA-FP-001 | Florida ALF Staff Orientation (120 minutes) | 15 |

**What each course includes:**
- Description, audience, prerequisites and completion criteria
- At least 4 objectives
- 5 sections with practical examples
- Knowledge checks
- A fictional case study
- A 15-question final exam with explanations
- Regulatory references
- Dated source references from CDC, OSHA, CMS, HHS, FDA, AHCA, Florida statutes, DCF, DOH and others
- Any renewal interval is stated only where a verified rule sets one

**Statutes checked against the official text:** s. 381.0035 (topics of the HIV/AIDS course) and s. 429.52(1) (ALF orientation: at least 2 hours, a signed statement, no fixed topic list) were confirmed on leg.state.fl.us.

**HIV prevention content reflects:**
- CDC's 2025 nPEP guidelines: start as soon as possible, ideally within 24 hours and no later than 72 hours; a 28-day course.
- CDC's 2025 lenacapavir PrEP recommendation.

**Regulatory library links:** the rules now point to the matching courses. For example:
- Rule 59A-36.011(3)(b) → Emergency Preparedness
- Rule 59A-36.011(4) and s. 381.0035 → HIV/AIDS Fundamentals
- s. 429.52(1)(a) → ALF Orientation

> All library courses are **AI-assisted drafts loaded IN_REVIEW**. Learners see them only after qualified reviewers record Review → Clinical (with credentials) → Compliance approval. The demo seed's auto-approval is labeled "not a qualified review".

### File uploads (§25)
**What can be uploaded:**
- License and certification copies, on the employee page
- Competency evidence, on draft evaluations
- Lesson media (MP4, PDF, images) in the course builder

**How uploads are validated:**
- File type is checked from the file content; the extension is ignored. Each kind of upload has its own allowlist.
- Size limits are configurable.
- PDFs containing JavaScript, launch actions or embedded files are rejected.
- An optional ClamAV scan runs; with `UPLOAD_REQUIRE_SCAN=1`, nothing is stored unless it scans clean.

**How files are stored and served:**
- **Storage:** private S3-compatible storage. The local disk is used only in development and is refused in production.
- **Visibility:** the database's access rules allow a file to be seen only by people who can see the record it is attached to.
- **Immutability:** files cannot be changed, and removal is soft and permanent.
- **Locking:** evidence becomes locked once an evaluation is signed.
- **Downloads:** go through an authorized route that sends anti-sniffing and sandbox headers, supports byte ranges for video seeking, and logs every view of a personnel document.

### Optional SMS (§18)
- **Opt-in:** each organization switches SMS on, and each user opts in with a phone number in E.164 format. Consent time is recorded.
- **Scope:** only critical alerts (expirations, overdue training, compliance) are queued.
- **Message content:** no PHI. Every text ends with "Reply STOP to opt out".
- **Delivery:** through Twilio, with retries and backoff. Without Twilio configured, messages go to the console.
- **Isolation:** the SMS queue cannot be read by tenants.

### Security testing and hardening
**Hardening:**
- **Content Security Policy:** each request gets its own nonce, with `strict-dynamic` and no inline scripts. This replaces the earlier policy that allowed inline scripts. All pages now render per request.
- **Dependency audit:** a uuid advisory was fixed through an npm override. The remaining moderate advisories (postcss bundled in Next.js, zod 3) are assessed in SECURITY.md.

**New tests:**
- **Database-wide tenant isolation sweep:** row-level security is forced on all 53 tenant tables, and the app role cannot bypass it. A query across every readable tenant table finds zero rows belonging to another tenant, and writes into another tenant are rejected.
- **API queries:** every integration API query is checked to run under the database's access rules.
- **End-to-end security checks:**
  - Security headers are present, and the browser reports no Content Security Policy violations.
  - Anonymous and forged requests are refused across exports, files, analytics, the API, cron jobs and webhooks.
  - Opening another tenant's record by URL returns 404.
  - Stored script tags are displayed as text and never run.
  - Uploaded files are served with safe headers.

**Bugs fixed during this phase:**
- Hiding removed files in a database read rule also blocked the soft delete itself. Removed files are now filtered in the application instead.
- The capacity guard for class registration already locks the class row (Phase 6), and this phase confirmed it.
- The employee list returned 1,000 rows on one page, which timed out under load. It is now paginated.

### Performance
**Measurement setup:**
- A synthetic 5,000-employee organization, generated by `scripts/perf/volume.ts`
- Server benchmarks with `scripts/perf/bench.ts`
- HTTP load tests with `scripts/perf/load.ts` (autocannon)

**Optimizations:**
- Analytics queries were rewritten, cutting a dashboard computation from 678 ms to 328 ms.
- The employee list is paginated.
- Dashboard and analytics totals are cached per viewer for 60 seconds.
- The attention lists on the dashboard are now limited in SQL.

**Results:** administrator pages for 5,000 staff improved roughly 3–4× at p50 under load, and errors fell from 10 to 0. Full tables are in TESTING.md.

### Accessibility and mobile
- **Accessibility:** axe checks against WCAG 2.2 AA found contrast, accessible-name, list-structure and link-in-text issues. All were fixed, and the scans now report 0 violations, enforced in the e2e suite. A keyboard skip-link test was added.
- **Mobile:** at 390×844 there is no horizontal overflow on core pages. A grid min-width fix was applied, and the mobile navigation was tested.

### Deployment and operations
**New files:**
- `.github/workflows/ci.yml`: lint, types, unit, integration (Postgres 16), build, client-bundle secret scan, e2e and dependency audit
- `Dockerfile` and `.dockerignore`: non-root, with a health check
- `scripts/e2e-server.sh`

**Platform admin setup:** `scripts/ops/create-platform-admin.ts` creates the first platform admin in production. It emails a one-time setup link, so no password is ever printed.

**Restore verification:** `scripts/ops/verify-restore.ts` checks row counts, the access-rule baseline and every tenant's audit chain.

**Backup/restore drill:**
- The drill was performed and all checks passed.
- In a separate check, an audit row was edited with the database's protections switched off, and the tool detected the change.

**Configuration:** `.env.example` now lists storage, scanning and SMS settings.

### Documentation
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/DEPLOYMENT.md`
- `docs/OPERATIONS.md` (runbook, monitoring, backups, incident response)
- `docs/API.md`
- `docs/USER-GUIDE.md`
- `docs/TESTING.md` (test, accessibility and performance results)
- Phase reports 1–7

## 2. Final deliverables checklist (§27)
| # | Deliverable | Where |
|---|---|---|
| 1 | Complete source code | `chta-phase7.zip` |
| 2 | Working frontend and backend | Next.js app; 48 e2e tests against the production build |
| 3 | Database schema | `src/db/schema` (62 tables) |
| 4 | Database migrations | `drizzle/0000–0015` |
| 5 | Multi-tenant architecture | Forced row-level security, three database roles, isolation sweep test |
| 6 | Functional user dashboards | Role-based dashboard, analytics dashboard, platform console |
| 7 | Course management system | Builder, versions, approval workflow, media uploads |
| 8 | Initial populated training library | 15 courses (225 exam questions), loaded for review |
| 9 | Examination engine | Question banks, randomization, timing, attempts, manual grading, integrity rules |
| 10 | Competency management | Checklists, evaluator signatures, evidence files |
| 11 | Certificate generation | PDF with QR verification; renewal and expiry |
| 12 | Regulatory compliance engine | 37 Florida and federal rules, applicability, decisions, versioning |
| 13 | Employee onboarding | Automatic onboarding by position, facility and duties |
| 14 | Training renewal management | Reminders, escalations, renewals, expirations |
| 15 | Reporting and analytics | 16 reports (PDF/Excel/CSV) and the analytics dashboard |
| 16 | Administrative portal | Administration and platform console |
| 17 | Subscription management | Plans, limits, Stripe, trials, invoices |
| 18 | Security controls | SECURITY.md |
| 19 | Technical documentation | `docs/` |
| 20 | Deployment instructions | DEPLOYMENT.md |

## 3. Limitations and recommendations before go-live
1. **Qualified content review.** All 15 courses are drafts. Clinical and compliance reviewers must approve them, and verify the source links and dates, before learners use them.
2. **Third-party credentials.** Real email, Stripe, Twilio (A2P 10DLC), S3, ClamAV and AI credentials are needed. The integration code is complete and tested with test doubles or test modes.
3. **Independent penetration test, and a manual accessibility audit with screen readers.** Automated scans are necessary but not sufficient.
4. **Large media uploads on Vercel.** Request bodies are limited to about 4.5 MB. Use video links, or add presigned uploads.
5. **Very large organizations (over 5,000 staff).** Move whole-workforce compliance to the nightly snapshot, and add a read replica for reports.
6. **Dependencies.** Plan upgrades to zod 4 and the next Next.js major release.
7. **Docker image.** The Dockerfile was not built in this environment because no container runtime was available; build and scan it in CI or the registry.
8. **Pending Florida legislation (SB 1404).** The regulatory library flags it on affected ALF rules. Review and update the rules when it takes effect.

## 4. Remaining work (post-launch roadmap)
| Item | Notes |
|---|---|
| Additional states | The jurisdiction model is ready; rules and courses are needed per state |
| Direct-to-bucket presigned uploads for large video | Architecture is in place (S3 driver) |
| Per-facility time zones and calendar (ICS) export | Classes currently use Eastern Time |
| Breached-password check (HIBP k-anonymity) | Currently a common-password deny list |
| Observability integration (e.g., Sentry) | Hooks and runbook described |
