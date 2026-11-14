# Architecture

## Stack
| Layer | Choice |
|---|---|
| Web framework | Next.js 15 (App Router, React Server Components, Server Actions), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, own accessible component set (`src/components/ui.tsx`) |
| Database | PostgreSQL 16, Drizzle ORM (typed schema, SQL migrations in `drizzle/`) |
| Auth | Own session auth: Argon2id passwords, server-side sessions (`__Host-` cookie), TOTP MFA, rate limiting |
| Payments | Stripe Checkout, Customer Portal, signed webhooks |
| Files | Private S3-compatible object storage behind an authorized download route |
| Email / SMS | Outbox tables + scheduled delivery (Resend/Postmark/SES; Twilio) |
| AI | Provider abstraction (Anthropic Messages API), server-side only |
| Hosting | Vercel (cron jobs in `vercel.json`); Dockerfile for self-hosting |

## Multi-tenancy and data isolation
Every tenant-owned row carries `tenant_id`. Isolation is enforced **in the database**, not only in application code:

- Three roles: `chta_app` (runtime, **NOBYPASSRLS**), `chta_system` (platform jobs, auth, webhooks — BYPASSRLS), `chta_owner` (migrations).
- Every request that touches tenant data runs inside `withTenant()`, which sets `app.tenant_id` and `app.user_id` for the transaction. **Forced row-level security** on all 53 tenant tables restricts rows to the current tenant.
- **Permission-aware RLS**: restrictive policies call SECURITY DEFINER helpers (`app_has_permission`, `app_has_permission_at`, `app_can_access_employee`, …) so a supervisor sees only their team, a facility administrator only their facilities, and so on — even if application code has a bug.
- `chta_apply_security()` (v8) re-applies tenant isolation, grants and platform-only tables after every migration.
- Integrity rules live in triggers: hash-chained immutable audit log, append-only competency signatures, course publishing approval chain, exam attempt rules, attendance capacity, file immutability, billing tables write-protected from tenants.

## Request flow
```
Browser ──► middleware (nonce CSP, cookie gate)
        ──► Server Component / Server Action
              requireUser → requireTenant → requirePermission / requireFeature
              ctx.tx(tx => service(tx, …))      ◄── withTenant: SET app.tenant_id / app.user_id
                                                      Postgres RLS + triggers decide
        ◄── HTML (React escapes all user text)
```
Route handlers (`/api/*`) follow the same pattern; `/api/v1/*` authenticates with hashed API keys, `/api/cron/*` with `CRON_SECRET`, `/api/webhooks/stripe` with Stripe signatures.

## Code layout
```
src/app/(auth)        sign-in, registration, password reset, MFA
src/app/(app)         authenticated application (one folder per main navigation item)
src/app/api           exports, files, cron, webhooks, v1 API, health
src/lib/<domain>      services: auth, rbac, learning, assessment, competency, workforce,
                      compliance, reports, analytics, billing, instructors, ai, files,
                      integrations, notify
src/db/schema         Drizzle schema; src/db/seed reference + demo data
src/content           course library (15 courses) and regulatory library (37 rules)
drizzle/              SQL migrations 0000–0015 (schema + security rules)
tests/unit|integration|e2e
```

## Scheduled jobs
| Route | Schedule | Work |
|---|---|---|
| `/api/cron/daily` | daily | assignment status/overdue, reminders and escalations, renewals, certificate expiry, compliance snapshots, trial warnings/expiry |
| `/api/cron/email` | every 10 minutes | deliver queued email and SMS with retries |

## Key design decisions
- **Course completion ≠ competency**: competency requires a signed evaluator assessment; certificates state this.
- **Internal certificates are not licenses or accredited CE** — wording is enforced in templates.
- **Regulatory rules are versioned and flagged** VERIFIED / NEEDS_REVIEW; unverifiable requirements are never presented as law.
- **Minimal PHI**: the platform stores workforce training data, not patient records; uploads warn against patient images; the AI assistant blocks PHI-like input and stores no prompt content.
