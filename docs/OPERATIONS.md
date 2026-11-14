# Operations runbook

## Health and monitoring
| Signal | How | Alert when |
|---|---|---|
| Liveness/readiness | `GET /api/health` (checks the database) | non-200 for 2 minutes |
| Scheduled jobs | `/api/cron/daily`, `/api/cron/email` responses and host cron logs | any non-200; daily job missing for 26 h |
| Email/SMS backlog | `select status, count(*) from email_outbox group by 1` (same for `sms_outbox`) | PENDING older than 30 min, FAILED rising |
| Errors | host logs; add Sentry or similar with PII scrubbing | 5xx rate > 1% over 5 min |
| Database | provider metrics | CPU > 80%, connections near limit, storage > 80% |
| Security | audit log (`audit_logs`), failed sign-ins (`rate_limits` login keys) | spikes in failed sign-ins or `api.read` from one key |

## Backups and restore
- Use the database provider's **automated backups with point-in-time recovery**; keep at least 30 days (align with your records-retention policy).
- Object storage: enable **versioning** and a lifecycle policy; back up the bucket to a second region if required.
- **Quarterly restore drill** (performed on 2026-11-13 during Phase 7 — see below):
  1. Restore the latest backup into a new database (`pg_restore --no-owner --role=chta_owner` or provider snapshot restore).
  2. Run `SYSTEM_DATABASE_URL=… DATABASE_URL=… tsx scripts/ops/verify-restore.ts`. It prints key row counts, confirms the RLS baseline (policies and forced-RLS tables) and verifies **every tenant's hash-chained audit log**. Exit code 1 means the restore is not trustworthy.
  3. Point a staging deployment at the restored database and sign in.
  4. Record the drill (date, backup timestamp, duration, result) in your compliance records.

### Drill result (2026-11-13, demo dataset)
| Step | Result |
|---|---|
| `pg_dump -Fc` | 1 s, 592 KB |
| `pg_restore` into a new database | < 1 s, no errors |
| Row counts and RLS baseline | identical to source (232 policies, 53 forced-RLS tables) |
| Audit chain verification | all tenants valid |
| Tamper test | an audit row altered with triggers disabled was detected ("first broken id"), exit status failure |

## Common procedures
| Task | Procedure |
|---|---|
| Bootstrap a platform admin | `tsx scripts/ops/create-platform-admin.ts <email> <first> <last>` (emails a setup link) |
| Apply migrations | `MIGRATION_DATABASE_URL=… npx drizzle-kit migrate` — every migration re-runs `chta_apply_security()` |
| Rotate `CRON_SECRET` | update host secret and scheduler simultaneously |
| Lost authenticator device | Verify identity out of band, then `tsx scripts/ops/reset-mfa.ts <email>` (turns MFA off, signs out all sessions, emails a password link; audited) |
| Rotate `ENCRYPTION_KEY` | requires re-encrypting MFA secrets; schedule maintenance — users may re-enroll MFA |
| Revoke a compromised API key | tenant admin: Administration → Integrations → Revoke (permanent); platform: `update api_keys set revoked_at = now() where prefix = '…'` as `chta_system` |
| Lock a user out | Administration → Users → deactivate (sessions revoked) |
| Suspend a tenant | Platform console → tenant → suspend (all members lose access; data retained) |
| Stuck outbox | check provider credentials; FAILED rows can be reset to PENDING after the cause is fixed |
| Course content correction | edit a new version in the builder; it re-enters the approval workflow; published versions are immutable |
| Regulatory change | Platform → Regulatory library → edit rule (change summary required, versioned); tenants are notified |

## Incident response (summary)
1. **Contain** — revoke sessions/keys, suspend affected tenant or feature (plan gate) if needed.
2. **Assess** — use `audit_logs` (immutable) and host logs to determine scope; verify audit chain integrity.
3. **Notify** — follow HIPAA Breach Notification Rule timelines if PHI could be involved, contract obligations, and Florida Information Protection Act (s. 501.171, F.S.) requirements for personal information; involve counsel.
4. **Recover and learn** — restore from backup if needed (verify with the script), post-incident review, update this runbook.

## Data retention
Training records, certificates, competency signatures and audit logs are compliance records — retain per facility and regulatory requirements (often 5+ years). Removed files are soft-deleted (metadata kept); purge bytes from the bucket only per your retention policy.
