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
| Account ownership | Completing an emailed link marks the address verified. Before an organization grants access to an existing unverified account, its password, sessions and MFA are reset and a set-password link goes to the mailbox owner (blocks pre-registration takeover) |
| Platform administrators | Two-step verification enforced before any platform page or action (`PLATFORM_ADMIN_MFA`); lost device recovery via `scripts/ops/reset-mfa.ts` (audited) |
| Abuse limits | Sign-in, MFA, password reset, registration (20/hour per address), uploads, API keys and certificate lookups are rate limited; expired sessions, reset links and counters are purged daily |
| Database functions | EXECUTE limited to `chta_app`/`chta_system` (no `PUBLIC`); `search_path` pinned on every function |

## Testing evidence (Phase 7)
- Integration: `tests/integration/tenant-isolation.test.ts`, `production.test.ts` (RLS forced on all tenant tables; sweep of every readable table returns zero rows of another tenant; cross-tenant writes rejected).
- End-to-end: `tests/e2e/phase7.spec.ts` (headers and CSP with zero browser CSP violations, anonymous/forged requests refused, cross-tenant URL access returns 404, stored XSS rendered as text, file download headers).
- Client bundle scanned for secrets on every CI run.

## Dependency audit (2026-11-14)
`npm audit --omit=dev` reports one remaining advisory chain (2 entries), assessed as not exploitable in this application:
| Package | Path | Assessment |
|---|---|---|
| `postcss` (bundled inside `next` 15.5.29) | build-time CSS processing of our own files | No untrusted CSS is processed and PostCSS does not run at request time. Clears when the app moves to Next.js 16. |
Fixed: `zod` upgraded to 4.6.7 (memory-exhaustion advisory); `uuid` (via `exceljs`) overridden to `uuid@11`.

## Recommended before go-live
1. Independent **penetration test** and code review by a third party (automated tests are not a substitute).
2. Platform administrators are **forced** to use two-step verification (`PLATFORM_ADMIN_MFA`, on by default). Make it policy for organization administrators too, and add one-time recovery codes.
3. Configure **ClamAV** (or a managed scanner) and set `UPLOAD_REQUIRE_SCAN=1`.
4. Sign **BAAs/DPAs** with providers that could receive personal data (email, SMS, AI, hosting, storage) — the product minimizes PHI but staff can still type it.
5. Turn on database **encryption at rest**, automated backups with PITR, and restrict network access to the database.
6. Add error monitoring (e.g., Sentry) with PII scrubbing, and alerting on 5xx rates, cron failures and outbox backlogs.
7. Add **email verification at sign-up** (today ownership is proven by the first emailed link, and unverified accounts are secured when an organization invites them) and a breached-password check (Have I Been Pwned k-anonymity).
8. Have counsel review the **Terms of Service and Privacy Policy** (`/terms`, `/privacy`) and set `LEGAL_ENTITY_NAME` and `SUPPORT_EMAIL`.
9. Rotate `ENCRYPTION_KEY`, `CRON_SECRET`, Stripe and provider keys on a schedule and on staff departure.

## Reporting a vulnerability
Email the platform security contact listed by the operator; do not open public issues for vulnerabilities.
