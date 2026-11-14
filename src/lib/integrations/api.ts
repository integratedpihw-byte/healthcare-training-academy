import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { systemDb, withTenant } from "@/db/server";
import { writeAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/auth/rate-limit";
import { can, loadAccess } from "@/lib/rbac/access";
import { complianceFor } from "@/lib/workforce/compliance";
import { authenticateApiKey, type ApiScope } from "./api-keys";

export const API_RATE_PER_MINUTE = 120;
const PAGE_MAX = 500;

type Handler = (tx: Tx, q: { limit: number; offset: number; updatedSince: string | null }) => Promise<Record<string, unknown>[]>;

export const RESOURCES: Record<string, { scope: ApiScope; handler: Handler }> = {
  employees: {
    scope: "employees:read",
    handler: async (tx, q) =>
      (await tx.execute(sql`
        select e.id, e.employee_number "employeeNumber", e.first_name "firstName", e.last_name "lastName", e.job_title "jobTitle",
               e.position_code "positionCode", e.employment_status "employmentStatus", e.hire_date "hireDate",
               e.primary_facility_id "facilityId", f.name "facilityName", e.department_id "departmentId", e.updated_at "updatedAt"
          from employees e left join facilities f on f.id = e.primary_facility_id
         where (${q.updatedSince}::timestamptz is null or e.updated_at >= ${q.updatedSince}::timestamptz)
         order by e.employee_number, e.id limit ${q.limit} offset ${q.offset}`)).rows,
  },
  assignments: {
    scope: "assignments:read",
    handler: async (tx, q) =>
      (await tx.execute(sql`
        select ta.id, ta.employee_id "employeeId", e.employee_number "employeeNumber", c.code "courseCode", c.title "courseTitle",
               ta.status, ta.source, ta.due_date "dueDate", ta.completed_at "completedAt", ta.updated_at "updatedAt"
          from training_assignments ta join employees e on e.id = ta.employee_id join courses c on c.id = ta.course_id
         where (${q.updatedSince}::timestamptz is null or ta.updated_at >= ${q.updatedSince}::timestamptz)
         order by ta.created_at, ta.id limit ${q.limit} offset ${q.offset}`)).rows,
  },
  certificates: {
    scope: "certificates:read",
    handler: async (tx, q) =>
      (await tx.execute(sql`
        select c.id, c.certificate_number "certificateNumber", c.employee_id "employeeId", c.recipient_name "recipientName", c.course_code "courseCode",
               c.course_title "courseTitle", c.kind, c.status, c.completed_on "completedOn", c.expires_on "expiresOn", c.training_hours "trainingHours",
               c.verification_code "verificationCode", c.issued_at "issuedAt"
          from certificates c
         where (${q.updatedSince}::timestamptz is null or coalesce(c.revoked_at, c.issued_at) >= ${q.updatedSince}::timestamptz)
         order by c.issued_at, c.id limit ${q.limit} offset ${q.offset}`)).rows,
  },
  compliance: {
    scope: "compliance:read",
    handler: async (tx, q) => {
      const emps = (await tx.execute<{ id: string; employeeNumber: string }>(sql`select id, employee_number "employeeNumber" from employees where employment_status <> 'TERMINATED' order by employee_number, id limit ${q.limit} offset ${q.offset}`)).rows;
      const c = await complianceFor(tx, emps.map((e) => e.id));
      return emps.map((e) => ({ employeeId: e.id, employeeNumber: e.employeeNumber, status: c.get(e.id)?.status ?? "NO_REQUIREMENTS", ...c.get(e.id)?.counts }));
    },
  },
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** GET /api/v1/{resource}?limit=&offset=&updatedSince= — read-only, key-scoped, RLS-enforced. */
export async function handleApi(req: Request, resource: string) {
  const def = RESOURCES[resource];
  if (!def) return json({ error: "Unknown resource", resources: Object.keys(RESOURCES) }, 404);
  const sys = systemDb();
  const p = await authenticateApiKey(sys, req.headers.get("authorization"));
  if ("error" in p) return json({ error: p.error }, p.status, p.status === 401 ? { "WWW-Authenticate": "Bearer" } : {});
  if (!p.scopes.includes(def.scope)) return json({ error: `This key lacks the ${def.scope} scope` }, 403);
  const rl = await rateLimit(sys, `api:${p.keyId}`, API_RATE_PER_MINUTE, 60);
  if (!rl.allowed) return json({ error: "Rate limit exceeded" }, 429, { "Retry-After": String(rl.retryAfterSeconds) });
  const url = new URL(req.url);
  const limit = Math.min(PAGE_MAX, Math.max(1, Number(url.searchParams.get("limit")) || 100));
  const offset = Math.max(0, Math.min(1_000_000, Number(url.searchParams.get("offset")) || 0));
  const since = url.searchParams.get("updatedSince");
  const updatedSince = since && !Number.isNaN(Date.parse(since)) ? new Date(since).toISOString() : null;
  // Keys act with the access of the administrator who created them (RLS); if that
  // person is removed or loses integrations.manage, the key stops working.
  const out = await withTenant({ tenantId: p.tenantId, userId: p.createdById }, async (tx) => {
    const access = await loadAccess(tx, p.tenantId, p.createdById);
    if (!access || !can(access, "integrations.manage")) return null;
    const data = await def.handler(tx, { limit, offset, updatedSince });
    await writeAudit(tx, { tenantId: p.tenantId, actorUserId: null, action: "api.read", entityType: "api_key", entityId: p.keyId, after: { resource, limit, offset, updatedSince, rows: data.length } });
    return data;
  });
  if (!out) return json({ error: "The key's owner no longer has integration access" }, 403);
  return json({ data: out, pagination: { limit, offset, nextOffset: out.length === limit ? offset + limit : null } }, 200, { "X-RateLimit-Remaining": String(rl.remaining) });
}
