# Phase 1 — Foundation: Completion Report

**Project:** Complete Healthcare Training Academy
**Phase:** 1 of 7 (Foundation: architecture, database, authentication, multi-tenancy, user roles, organization management)
**Date:** November 13, 2026

## 1. Completed functionality

| Spec item | Delivered |
|---|---|
| Project architecture | Next.js 15 + TypeScript + Tailwind v4, modular `src/lib` services separate from UI, server-only DB access, security headers (CSP, HSTS, frame-deny, etc.), health endpoint |
| Database (§20) | Full normalized schema with all 42 core entities from §20 (plus supporting tables: sessions, password resets, rate limits, memberships, membership roles, employee↔facility, notification preferences, training sessions, audit chain heads). 48 tables, foreign keys, indexes, enums, validation. Three SQL migrations. |
| Authentication (§21) | Argon2id hashing; NIST-aligned password policy; opaque HttpOnly session cookies (only hashes stored); absolute and idle expiry; server-side revocation; lockout after 5 failures; per-account and per-IP rate limits; timing equalization; enumeration-safe password reset (single-use, 30-minute tokens); TOTP MFA with secrets encrypted at rest (AES-256-GCM); password change signs out other sessions; active-session list with remote sign-out |
| Multi-tenancy (§2) | Tenant isolation through Postgres RLS on all 41 tenant tables (FORCE RLS, fail-closed), a separate runtime role without bypass, platform-global content model, tenant switcher for multi-organization users, individual learners on personal tenants |
| User roles (§3) | Permission catalog (34 permissions), 6 system role templates plus the Platform Super Administrator flag, facility-scoped roles, custom roles, privilege-escalation guard, permissions enforced in the API **and** in the database (RESTRICTIVE RLS policies) |
| Organization management | Self-service organization registration → super-admin approval/rejection/suspension/reactivation workflow; organization profile; facilities (type, license, expiry) with activate/deactivate; departments; user invitations with role and facility scope; role revocation (with last-administrator protection) |
| Foundational dashboards (§14, §22) | Distinct dashboards for administrators (facility-scoped for Facility Administrators), supervisors (direct reports), instructors and learners; platform console with cross-tenant metrics and an approvals queue; responsive layout with mobile navigation |
| Audit (§15) | Immutable, hash-chained audit log written in the same transaction as every administrative change; in-app chain verification; secrets redacted from audit payloads |
| Supporting modules | Notifications center (read/mark-read), Billing overview (subscription, invoices, payments — read-only until Stripe in Phase 6), Settings (profile, security, organization switching) |
| Integrity triggers | Certificate issuance requires a completed enrollment; CE certificates require recorded accreditation; certificate expiry can never be extended; revocation is permanent; signed competencies are frozen; attempts and certificates can't be deleted |
| Seed data | Idempotent reference seed (permissions, roles, 7 course departments) plus clearly labeled DEMO tenants covering every role, two active tenants for isolation testing, and one pending tenant |

Navigation follows §22 exactly (14 modules, in order). Each module turns on in the phase that delivers it, so nobody ever lands on a "coming soon" screen. Phase 1 exposes Dashboard, Notifications, Billing, Administration and Settings.

## 2. Verification

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | Pass |
| ESLint (zero warnings) | Pass |
| Production build (`next build`) | Pass, 26 routes |
| Unit tests | **29 passed**: password policy, Argon2id, encryption, tamper detection, TOTP, permission catalog invariants, facility scoping, escalation guard, navigation phase gating, audit redaction |
| Integration tests (real PostgreSQL 16) | **48 passed**: see below |
| End-to-end tests (Playwright, production build, Chrome) | **11 passed**: see below |

**Cross-tenant leakage and authorization tests:**
- Tenant A can't read, update, delete, insert into, or move rows into Tenant B, even when it knows B's row IDs.
- No rows come back without a tenant context, and context doesn't leak between pooled transactions.
- Global content is readable by every tenant and writable by none.
- A learner can't create employees, change facilities, grant themselves roles, read the audit trail, or record competencies, even inside their own tenant.
- The app role can't read password hashes or sessions, create tenants, write billing, or issue certificates.
- Pending tenants can't be entered.
- In the browser, Gulf Coast's admin opening a Sunshine facility URL gets a 404, and a learner opening an admin page gets the access-denied page.

**Database persistence:** every E2E flow (registration → approval → dashboard, facility creation, user invitation, custom role creation) writes through the real database and is read back on the next page.

**Role permissions:** verified per role in integration tests (DB-enforced) and E2E (UI visibility and route guards).

## 3. Decisions and best-practice notes

1. **Drizzle ORM instead of Prisma** (the spec allows an equivalent typed ORM). It has no native binaries, its SQL migrations are reviewable, and it supports RLS well. Prisma's engine downloads were blocked in the build environment.
2. **Built-in authentication rather than a hosted identity provider for now.** It's isolated behind `src/lib/auth/service.ts`, so it can be swapped for Auth0, Clerk, Entra ID or Okta (needed for enterprise SSO/SAML) without touching tenant code. *Recommendation:* add SSO for Enterprise plans in Phase 6.
3. **Two database roles (app vs. system).** This is the main structural safeguard: a missed `WHERE tenant_id` in application code can't leak data.
4. **Rate limiting is tuned for healthcare facilities.** The per-IP ceiling is generous because a whole facility often shares one IP at shift change. The per-account counter resets after a successful sign-in. It's Postgres-backed now; move to Redis/Upstash at scale.
5. **Billing rows are written only by platform services**, which keeps subscription data separate from training records (§19).
6. **No PHI by design.** Registration terms tell users not to enter patient information. Training records contain no patient fields (§21).

**Recommended before go-live (tracked for Phase 7):**
- Require MFA for platform and organization administrators (the setting exists; enforcement is a policy toggle).
- Move to a nonce-based CSP.
- Add HIBP k-anonymity breached-password checks.
- Get a third-party penetration test.
- Sign a BAA with hosting and database vendors if any PHI-adjacent feature is ever enabled.

## 4. Remaining work

| Phase | Scope |
|---|---|
| 2 – Learning Management | Course catalog, no-code course builder, lessons (text/presentation/video/interactive), enrollment, progress tracking, bookmarks, resume, downloadable materials; initial library content for the 15 priority courses, written from cited CDC/OSHA/HHS/HRSA/CMS/AHCA/FDOH sources and flagged for qualified clinical review |
| 3 – Assessment & Certification | Question banks (all 9 types), randomized exams, auto and instructor grading, retakes, competency checklists with e-signature, PDF certificates with QR verification, public verification page, revocation/renewal |
| 4 – Workforce Management | Employee profiles CRUD, licenses, onboarding workflow (§12 steps 1–11), training assignments, renewal engine with 90/60/30/15/7-day notifications, email delivery |
| 5 – Regulatory Compliance | Florida + federal regulatory sources and rules. Each rule is recorded with citation, source URL and last-verified date, and **any frequency that can't be verified is flagged for administrator review rather than assumed.** Applicability rules engine, compliance dashboards, audit reports |
| 6 – Enterprise | AI education assistant (approved-content grounding with citations; diagnosis, prescribing and approvals are blocked), instructor portal, analytics with exports (PDF/Excel/CSV), Stripe subscriptions and webhooks, SSO |
| 7 – Production readiness | Security testing, performance and load testing, WCAG 2.1 AA audit, CI/CD, backups and disaster recovery runbook, data-retention policies |

The schema for every later phase is already in place, so later phases add services and screens rather than restructuring the data model.
