# Deployment

The primary target is **Vercel + managed PostgreSQL 16** (e.g., Neon, Supabase, AWS RDS, Crunchy Bridge) **+ an S3-compatible private bucket**. A `Dockerfile` is included for self-hosting.

## 1. Provision
| Service | Notes |
|---|---|
| PostgreSQL 16 | Encryption at rest, automated backups with point-in-time recovery, TLS required, network allow-list. Use a pooled connection string for the app roles if your provider offers one. |
| Object storage | Private bucket (block all public access), SSE enabled, lifecycle rule for removed files per your retention policy. |
| Email | Resend, Postmark or SES with SPF/DKIM/DMARC on your sending domain. |
| Stripe (optional) | Products/prices per plan and cycle; webhook endpoint `POST https://<host>/api/webhooks/stripe` subscribed to `checkout.session.completed`, `customer.subscription.*`, `invoice.*`; Customer Portal enabled. |
| ClamAV (recommended) | clamd reachable from the app (e.g., a small container); set `UPLOAD_REQUIRE_SCAN=1`. |
| Twilio (optional) | A messaging number or service with A2P 10DLC registration for U.S. SMS. |
| AI (optional) | Anthropic API key under an agreement appropriate to your data policy. |

## 2. Create database roles (once per environment)
```bash
psql "$ADMIN_URL" -v owner_pw=… -v app_pw=… -v system_pw=… -v db=chta -f scripts/db/setup-roles.sql
```

## 3. Configure environment variables
Copy names from `.env.example` into the host's secret store (Vercel → Project → Settings → Environment Variables). **Never** prefix secrets with `NEXT_PUBLIC_`. Required: `DATABASE_URL`, `SYSTEM_DATABASE_URL`, `APP_URL`, `ENCRYPTION_KEY`, `CRON_SECRET`, email settings, `STORAGE_DRIVER=s3` + S3 settings. `MIGRATION_DATABASE_URL` is needed only where migrations run.

## 4. Migrate and seed reference data
```bash
MIGRATION_DATABASE_URL=… npx drizzle-kit migrate          # applies drizzle/0000–0015
dotenv -e .env.production -- tsx scripts/seed.ts           # reference data + regulatory library + course library (IN_REVIEW)
```
Do **not** pass `--demo` in production. Create the first platform administrator with `tsx scripts/ops/create-platform-admin.ts <email> <first> <last>` (emails a one-time setup link; no password is printed), then enroll MFA.

Courses load **IN_REVIEW**. Qualified reviewers must complete Review → Clinical → Compliance approval in *Platform → Course library* before learners see them.

## 5. Deploy
- **Vercel**: import the repository, framework preset Next.js, Node 22. `vercel.json` registers the cron jobs. Note: the 10-minute email/SMS job requires a plan that allows sub-daily cron schedules; otherwise run it from an external scheduler with the `CRON_SECRET` bearer token.
- **Docker**: `docker build -t chta . && docker run --env-file .env.production -p 3000:3000 chta`, behind a TLS-terminating proxy; schedule the cron routes externally.

### Upload size on serverless hosts
Vercel functions accept request bodies of about 4.5 MB. License documents and evidence fit comfortably; for large lesson videos either host them on a video platform (YouTube-nocookie/Vimeo links are supported) or keep `UPLOAD_MAX_MEDIA_MB` ≤ 4 on Vercel. Direct-to-bucket presigned uploads are a recommended enhancement for large media.

## 6. Post-deploy checks
1. `GET /api/health` returns `{"status":"ok"}`.
2. Response headers include the nonce-based `Content-Security-Policy` and HSTS.
3. Sign in as platform admin with MFA; approve one course end-to-end in a staging tenant.
4. Trigger `/api/cron/daily` and `/api/cron/email` with the bearer token; confirm 200.
5. Send a Stripe test webhook (if enabled) and confirm it appears once in billing records.
6. Upload a test PDF to a license record and download it; confirm a malware scan result of CLEAN when ClamAV is configured.
7. Run `scripts/ops/verify-restore.ts` against a restored copy of the production backup (see OPERATIONS.md).

## 7. Staging
Use a separate database, bucket, Stripe test mode and `SMS_PROVIDER=console`. The demo seed (`--demo`) is appropriate for staging and sales demos only; all demo data is labeled DEMO.
