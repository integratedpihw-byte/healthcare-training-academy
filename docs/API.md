# Integration API (v1, read-only)

Available on the **Enterprise** plan. Administrators with `integrations.manage` create keys in **Administration → Integrations & API keys**.

## Authentication
```
Authorization: Bearer chta_<prefix>_<secret>
```
- The secret is shown **once**. Only a SHA-256 hash is stored.
- Keys are **scoped**, **expire** (30–365 days) and can be **revoked permanently**.
- A key acts with the row-level-security scope of the administrator who created it. If that person loses `integrations.manage` or is removed, the key stops working (403). Create keys from a dedicated service-administrator account.
- Rate limit: **120 requests per minute per key** (`429` with `Retry-After`). Every call is recorded in the audit log (`api.read`).

## Endpoints
All are `GET`, return JSON `{ "data": [...], "pagination": { "limit", "offset", "nextOffset" } }`, accept `limit` (1–500, default 100) and `offset`.

| Endpoint | Scope | Fields | Filters |
|---|---|---|---|
| `/api/v1/employees` | `employees:read` | id, employeeNumber, firstName, lastName, jobTitle, positionCode, employmentStatus, hireDate, facilityId, facilityName, departmentId, updatedAt | `updatedSince` |
| `/api/v1/assignments` | `assignments:read` | id, employeeId, employeeNumber, courseCode, courseTitle, status, source, dueDate, completedAt, updatedAt | `updatedSince` |
| `/api/v1/certificates` | `certificates:read` | id, certificateNumber, employeeId, recipientName, courseCode, courseTitle, kind, status, completedOn, expiresOn, trainingHours, verificationCode, issuedAt | `updatedSince` |
| `/api/v1/compliance` | `compliance:read` | employeeId, employeeNumber, status (COMPLIANT / AT_RISK / NON_COMPLIANT / NO_REQUIREMENTS) and counts | — |

The API never returns contact details, passwords, examination content or patient information.

## Errors
| Status | Meaning |
|---|---|
| 401 | missing, malformed, invalid, expired or revoked key |
| 402 | the organization's plan does not include API access |
| 403 | key lacks the scope, organization inactive, or key owner lost access |
| 404 | unknown resource |
| 429 | rate limit exceeded |

## Example
```bash
curl -s -H "Authorization: Bearer $CHTA_KEY" \
  "https://academy.example.org/api/v1/assignments?updatedSince=2026-11-01T00:00:00Z&limit=500"
```

## Other machine endpoints
| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/health` | none | liveness/readiness (no data) |
| `POST /api/webhooks/stripe` | Stripe signature | billing sync |
| `GET /api/cron/daily`, `/api/cron/email` | `Authorization: Bearer $CRON_SECRET` | scheduled jobs |
| `GET /verify/<code>` (page) | public | certificate verification (shows only certificate validity details) |
