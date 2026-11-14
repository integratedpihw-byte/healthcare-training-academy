# Security

## Controls summary
| Area | Control |
|---|---|
| Tenant isolation | Forced RLS on every tenant table; runtime role cannot bypass RLS; permission-aware policies; automated sweep test checks every readable tenant table for cross-tenant rows |
| Authentication | Argon2id hashing, length-first password policy with a common-password deny list (add a Have I Been Pwned k-anonymity check in production), `__Host-` HttpOnly SameSite=Lax session cookie, idle + absolute timeouts, TOTP MFA (secrets AES-256-GCM encrypted), login rate limiting and lockout |
| Authorization | 36-permission catalog, 7 system roles + custom roles, facility-scoped grants; checked in code **and** in RLS |
| Plan entitlements | Feature gates in pages, actions and API; database still enforces permissions |
| Browser | Per-request **nonce-based CSP** (`strict-dynamic`, no `unsafe-inline` scripts), `frame-ancestors 'none'`, HSTS (2 years, preload), `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy; React output escaping |
| CSRF | Server Actions enforce same-origin; upload route checks `Origin`; cookies SameSite=Lax |
| Secrets | Server-only modules (`server-only`), no `NEXT_PUBLIC_` secrets; CI scans the client bundle for secret names |
| Files | Content sniffing (not extensions), per-purpose allowlists, size limits, active-PDF rejection, optional ClamAV scan (`UPLOAD_REQUIRE_SCAN=1` recommended), private storage, RLS follows the parent record, downloads sandboxed with `nosniff` and audited |
| API keys | SHA-256 hashed, shown once, scoped, expiring, immutable, permanent revocation, rate-limited, every call audited |
| Webhooks | Stripe signature + timestamp verification; idempotency ledger (platform-only table) |
| Audit | Append-only, hash-chained per tenant; verifier in Admin → Audit and `scripts/ops/verify-restore.ts` |
| AI | Server-side key; PHI/clinical/authority guardrails before any model call; no write tools; no prompt/answer storage; rate limit |
| Cron | `CRON_SECRET` bearer token; constant-time comparison |
| Database functions | EXECUTE limited to `chta_app`/`chta_system` (no `PUBLIC`); `search_path` pinned on every function |

## Testing evidence (Phase 7)
- Integration: `tests/integration/tenant-isolation.test.ts`, `production.test.ts` (RLS forced on all tenant tables; sweep of every readable table returns zero rows of another tenant; cross-tenant writes rejected).
- End-to-end: `tests/e2e/phase7.spec.ts` (headers and CSP with zero browser CSP violations, anonymous/forged requests refused, cross-tenant URL access returns 404, stored XSS rendered as text, file download headers).
- Client bundle scanned for secrets on every CI run.

## Dependency audit (2026-11-13)
`npm audit --omit=dev` reports **4 moderate** advisories, assessed as not exploitable in this application:
| Package | Path | Assessment |
|---|---|---|
| `postcss` (via `next`) | build-time CSS processing of our own files | No untrusted CSS is processed. Resolve by upgrading Next.js when a patched release is adopted. |
| `zod` 3.x | input validation | Advisory concerns very large constrained collections. Request bodies are capped (Server Actions 1 MB) and arrays carry `.max()`; plan migration to zod 4. |
The `uuid` advisory (via `exceljs`) was **fixed** with an npm override to `uuid@11`.

## Recommended before go-live
1. Independent **penetration test** and code review by a third party (automated tests are not a substitute).
2. Enable **MFA enforcement** for platform administrators and organization administrators (supported; make it policy).
3. Configure **ClamAV** (or a managed scanner) and set `UPLOAD_REQUIRE_SCAN=1`.
4. Sign **BAAs/DPAs** with providers that could receive personal data (email, SMS, AI, hosting, storage) — the product minimizes PHI but staff can still type it.
5. Turn on database **encryption at rest**, automated backups with PITR, and restrict network access to the database.
6. Add error monitoring (e.g., Sentry) with PII scrubbing, and alerting on 5xx rates, cron failures and outbox backlogs.
7. Rotate `ENCRYPTION_KEY`, `CRON_SECRET`, Stripe and provider keys on a schedule and on staff departure.

## Reporting a vulnerability
Email the platform security contact listed by the operator; do not open public issues for vulnerabilities.
