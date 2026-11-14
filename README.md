# Complete Healthcare Training Academy

Multi-tenant healthcare education, LMS, workforce training and regulatory compliance SaaS platform.
Florida first, with an architecture built to cover all 50 states.

**Current status: all seven development phases complete** (Foundation, LMS, Assessment & Certification, Workforce, Regulatory Compliance, Enterprise, Production Readiness). Phase reports: [1](docs/PHASE-1-REPORT.md) · [2](docs/PHASE-2-REPORT.md) · [3](docs/PHASE-3-REPORT.md) · [4](docs/PHASE-4-REPORT.md) · [5](docs/PHASE-5-REPORT.md) · [6](docs/PHASE-6-REPORT.md) · [7](docs/PHASE-7-REPORT.md).

**Documentation:** [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Deployment](docs/DEPLOYMENT.md) · [Operations runbook](docs/OPERATIONS.md) · [Integration API](docs/API.md) · [User guide](docs/USER-GUIDE.md) · [Testing, performance & accessibility](docs/TESTING.md)

---

## Technology

| Layer | Choice |
|---|---|
| Frontend / backend | Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS v4 with a custom navy/teal design system (`src/components/ui.tsx`), lucide icons |
| Database | PostgreSQL 15+ with row-level security |
| ORM / migrations | Drizzle ORM + drizzle-kit (SQL migrations in `drizzle/`) |
| Auth | Built-in session auth: Argon2id, opaque DB-backed sessions, TOTP MFA, lockout, rate limits |
| Tests | Vitest (unit + integration against real Postgres), Playwright (end-to-end) |

> **Why Drizzle rather than Prisma?** The spec allows "Prisma or an equivalent typed ORM." Drizzle is fully typed, has no native engine binaries (so it works the same in serverless/edge and locked-down CI), produces plain reviewable SQL migrations, and handles Postgres RLS cleanly. Prisma's engine binaries also couldn't be downloaded in the build environment, which would have blocked testing against a real database.

## Architecture

```
src/
  app/
    (auth)/          sign-in, MFA, password recovery, organization & individual registration
    (app)/           authenticated shell: dashboard, administration, settings, notifications,
                     billing, platform console (super admin)
    account/         tenant status pages (pending approval, suspended, no organization)
    api/health       readiness probe
  db/
    schema/          48 tables: tenancy, identity, RBAC, workforce, content, regulatory,
                     LMS, assessment, competency, certificates, notifications, audit, billing
    client.ts        two connection pools: app (RLS-enforced) and system (platform)
    seed/            reference data + clearly labeled DEMO data
  lib/
    auth/            password policy, sessions, MFA, rate limiting, request context guards
    rbac/            permission catalog, system role templates, access resolution, custom roles
    tenancy/         registration, approval workflow, org/facility/department/member admin
    learning/        catalog, enrollment, player/progress (learner.ts); course builder + approval workflow (builder.ts)
    assessment/      grading (all 9 question types), exam engine, question-bank authoring
    certificates/    issuance, verification, revocation, expiry; server-side PDF with QR code
    competency/      skills checklists, evaluation, password-gated electronic signatures
  content/           library course content (Markdown + exam banks) seeded as IN_REVIEW global courses
    audit*.ts        immutable audit writer and hash-chain verifier
drizzle/             SQL migrations (0000 schema · 0001 RLS/security · 0002 permission policies · 0003 learning rules · 0004–0005 assessment & competency rules)
tests/               unit/, integration/, e2e/
```

### Multi-tenancy and isolation (defense in depth)

1. **Database roles.** The app runs as `chta_app` (`NOBYPASSRLS`). Platform services (auth, super-admin console, jobs, webhooks, public certificate verification) use `chta_system` (`BYPASSRLS`), always behind an explicit server-side authorization check. Migrations run as the schema owner.
2. **Row-level security on all 41 tenant-owned tables** (`FORCE ROW LEVEL SECURITY`). Every request runs in a transaction that sets `app.tenant_id` and `app.user_id` (`withTenant()`); with no tenant set, queries return zero rows (fail-closed).
3. **Platform-global content** (master course library, categories, competencies, system roles) uses `tenant_id IS NULL`: every tenant can read it, no tenant can write it.
4. **Database-level permissions.** `RESTRICTIVE` policies call `app_has_permission()` so writes to employees, facilities, roles, memberships, competency assessments, assignments and the like require the right permission *in the database*, not only in the API.
5. **Column/table grants.** The app role can't read password hashes, MFA secrets or sessions, can't create tenants, can't write billing records and can't issue certificates.
6. **Server-side guards** on every page and action: `requireUser`, `requireTenant`, `requirePermission(perm, facilityId?)`, `requirePlatformAdmin`.

### Integrity guarantees enforced by triggers

- `audit_logs` is append-only (UPDATE/DELETE/TRUNCATE blocked for every role) and SHA-256 hash-chained per tenant; an admin can verify the chain from **Administration → Audit trail**.
- Certificates can't be issued unless the enrollment is `COMPLETED`. Continuing-education certificates need a recorded accreditation. Identity fields are immutable, expiry can never be extended (renewal issues a new certificate), revocation is permanent, and certificates can't be deleted.
- Signed competency assessments are frozen: they can only be voided.
- Examination attempts can't be deleted.

### Workforce management (Phase 4)

Employee profiles, licenses, onboarding (11-step checklist), training requirements and pathways, assignments that follow enrollments, and a daily renewal engine (reminders at 90/60/30/15/7 days by default, overdue escalation, renewal assignments, license and competency expiry). Facility-scoped roles and supervisors (`team.view`, direct reports only) are enforced in the database. The migration owner role needs `BYPASSRLS` (see `scripts/db/setup-roles.sql`). See [docs/PHASE-4-REPORT.md](docs/PHASE-4-REPORT.md).

### Regulatory compliance (Phase 5)

Platform regulatory library (37 Florida + federal rules with citations, sources and verification dates; unverified items flagged, never invented), applicability rules engine (state, facility type, license/program designations, position, job duties, exposure), organization decisions with rationale, rule-to-training mapping, Compliance Center dashboards, versioned rule updates with notifications, and 14 audit reports exportable to PDF/Excel/CSV. See [docs/PHASE-5-REPORT.md](docs/PHASE-5-REPORT.md).

### Enterprise (Phase 6)

Subscription billing (Starter / Professional / Enterprise / Individual; monthly or annual; per-employee or per-facility; 14-day trials; Stripe Checkout, Customer Portal and signed, idempotent webhooks; platform-set custom pricing; plan limits and feature gates; billing kept separate from training records). Instructor management (profiles, qualifications, credentials, course assignments, class scheduling, rosters, self-registration, attendance, class messages, performance). Analytics dashboard under Reports and Analytics (KPIs, filters, charts, trends, exports). AI education assistant (grounded in approved content and the regulatory library with citations; PHI and clinical-advice guardrails; no write tools; content never stored). Read-only REST API (`/api/v1/{employees,assignments,certificates,compliance}`) with hashed, scoped, expiring API keys. See [docs/PHASE-6-REPORT.md](docs/PHASE-6-REPORT.md).

### Production readiness (Phase 7)

All 15 priority courses of the initial library (AI-assisted drafts, loaded for qualified review). Private file uploads (license copies, competency evidence, lesson media) with content validation, optional malware scanning and RLS that follows the parent record. Optional SMS for critical alerts (opt-in, Twilio). Nonce-based CSP, database-wide tenant-isolation sweep, axe-clean WCAG 2.2 AA scans, mobile layout checks, performance work on 5,000-employee organizations, CI pipeline, Dockerfile, backup/restore verification tooling. See [docs/PHASE-7-REPORT.md](docs/PHASE-7-REPORT.md).

### Roles

Platform Super Administrator (user flag) plus seven tenant role templates: Organization Administrator, Training Director, Facility Administrator (facility-scoped), Instructor, Supervisor, Clinical Content Reviewer, and Healthcare Employee / Student. Organizations can create **custom roles** from the 36-permission catalog. A user can only grant permissions they hold tenant-wide, which prevents privilege escalation. Clinical course approval is deliberately withheld from Organization Administrators and reserved for qualified clinicians.

---

## Local development

Prerequisites: Node 20+ and PostgreSQL 15+.

```bash
npm install

# 1. Create roles + database (run once as a Postgres superuser; use real secrets)
psql -U postgres -v owner_pw=... -v app_pw=... -v system_pw=... -v db=chta -f scripts/db/setup-roles.sql

# 2. Configure environment
cp .env.example .env.local      # fill in the three database URLs and ENCRYPTION_KEY

# 3. Migrate and seed
npm run db:migrate
npm run db:seed -- --demo       # omit --demo outside development

npm run dev                     # http://localhost:3000
```

`npm run db:reset` rebuilds the dev database from migrations and reseeds it (refuses to run in production).

### Course library and content governance

`npm run db:seed` loads the library courses in `src/content/courses/` as **IN_REVIEW** global courses. They reach learners only after a platform administrator, or qualified reviewers, record Review → Clinical (when required) → Compliance approvals in **Platform → Course Library**. The database refuses to publish without that chain. With `--demo`, the library is auto-published with approvals that state they are *not* qualified reviews, and learners see a DEMO notice.

### Demo accounts (development only)

All demo tenants are named "(DEMO)", show a DEMO DATA banner, and use reserved `.example` email domains. Default password: `Demo-Academy#2026` (override with `SEED_DEMO_PASSWORD`).

| Account | Role |
|---|---|
| superadmin@chta-platform.example | Platform Super Administrator |
| orgadmin@sunshine.example | Organization Administrator, Sunshine Care Group |
| director@sunshine.example | Training Director |
| facadmin@sunshine.example | Facility Administrator (Tampa ALF only) |
| instructor@sunshine.example | Instructor |
| supervisor@sunshine.example | Supervisor (3 direct reports) |
| learner@sunshine.example | Healthcare Employee |
| orgadmin@gulfcoast.example | Organization Administrator, second tenant (isolation testing) |
| admin@bayview.example | Organization awaiting approval |

## Environment variables

See [`.env.example`](.env.example). Required: `DATABASE_URL` (app role), `SYSTEM_DATABASE_URL` (system role), `MIGRATION_DATABASE_URL` (owner, migrations only), `APP_URL`, `ENCRYPTION_KEY` (32 random bytes, base64). Optional: `SESSION_TTL_HOURS` (default 12), `SESSION_IDLE_MINUTES` (default 60), `EMAIL_PROVIDER` (`console` | `resend`) + `RESEND_API_KEY`, `EMAIL_FROM`. `CRON_SECRET` protects scheduled jobs (`/api/cron/daily` — certificate expiry, renewal/expiration engine, email; `/api/cron/email` — email queue; scheduled in `vercel.json`). In production set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `EMAIL_FROM`. Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `STRIPE_PRICE_<PLAN>_<MONTHLY|ANNUAL>` (webhook endpoint `POST /api/webhooks/stripe`); without them, online checkout is hidden and platform administrators set plans manually. AI assistant: `ANTHROPIC_API_KEY`, `AI_MODEL` (default `claude-sonnet-5-5`), `AI_HOURLY_LIMIT` (default 30). Files: `STORAGE_DRIVER=s3` + `S3_*` (local disk only in development), `UPLOAD_MAX_MB`, `UPLOAD_MAX_MEDIA_MB`, `CLAMAV_HOST`, `UPLOAD_REQUIRE_SCAN`. SMS: `SMS_PROVIDER=twilio` + `TWILIO_*`. No secret uses a `NEXT_PUBLIC_` prefix.

## Testing

```bash
npm run typecheck
npm run lint
npm test                    # unit tests (no database)
npm run test:integration    # rebuilds the *_test database from migrations, then runs; uses .env.test
npm run build
npm run db:reset            # E2E expects fresh demo data
scripts/e2e-server.sh &     # production build with test-only AI provider and local storage
npm run test:e2e            # Playwright; set CHROME_PATH if using a system Chrome
```

The integration bootstrap refuses to run against any database whose name doesn't end in `_test`. CI runs everything in `.github/workflows/ci.yml`. Performance tooling: `scripts/perf/` (volume, bench, load) against a `*_perf` database — results in [docs/TESTING.md](docs/TESTING.md).

## Deployment (Vercel + managed Postgres)

1. Provision PostgreSQL 15+ (Neon, Supabase, RDS, Azure). Run `scripts/db/setup-roles.sql` with an admin connection. On providers that restrict `BYPASSRLS`, map `chta_system` to the provider's service role.
2. Set all environment variables in the hosting project. Use the pooled connection string for `DATABASE_URL` and `SYSTEM_DATABASE_URL`, and the direct connection for `MIGRATION_DATABASE_URL`.
3. Run `npm run db:migrate` (CI step or release command) and `npm run db:seed` (reference data only).
4. Deploy. Point health checks at `/api/health`.
5. Create the first platform administrator with `tsx scripts/ops/create-platform-admin.ts <email> <first> <last>` (emails a one-time setup link), then require MFA for that account.

Full checklist, Docker option, upload limits on serverless hosts and post-deploy checks: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Every new migration must end with `SELECT chta_apply_security();`** so new tenant tables automatically get RLS and grants.
