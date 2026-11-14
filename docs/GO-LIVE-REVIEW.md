# Go-live review (2026-11-14)

The full security and usability review, with findings, fixes and remaining owner actions, is kept in the project as `claude/go-live-review.md`. Summary of what changed in code:

- Existing unverified accounts are secured before an organization grants them access (`secureUnverifiedAccount`); emailed links mark the address verified.
- Platform administrators must use two-step verification (`MFA_ENFORCEMENT`); `scripts/ops/reset-mfa.ts` recovers a lost device.
- Self-registration is rate limited; expired sessions, reset links and counters are purged daily.
- `/terms`, `/privacy` and `/help` pages (legal text needs attorney review); error pages; `SUPPORT_EMAIL` and `LEGAL_ENTITY_NAME` settings.
- Timestamps are shown in labelled Eastern Time; learner dashboard leads with required training; table and tap-target accessibility fixes.
- `zod` upgraded to 4.6.7.

Open items are listed in `docs/SECURITY.md` under "Recommended before go-live".

## Follow-up (same day)
Product renamed to **Complete Healthcare Innovative Training Academy**. Closed from the open list: email confirmation at sign-up, organization two-step verification policy, one-time recovery codes, single-use authenticator codes, breached-password check, per-organization time zone, show-password control and a phone menu. Certificate numbers and course codes now use the `CHITA-` prefix (migration 0019 also converts existing rows). The supplied logo is used on screens, certificates and app icons. Internal identifiers (`chta_*` database roles, the session cookie) are unchanged.
