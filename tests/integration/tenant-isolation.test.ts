/**
 * Cross-tenant data leakage and database-level authorization tests.
 * These run against PostgreSQL with the real runtime role (chta_app, NOBYPASSRLS).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, isNull, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant } from "@/db/client";
import { auditLogs, courseCategories, employees, facilities, memberships, sessions, tenants, users } from "@/db/schema";
import { addMember, createTenant, expectPgError, type TenantFixture } from "../support/fixtures";

let A: TenantFixture;
let B: TenantFixture;
let learnerA: { userId: string };

beforeAll(async () => {
  A = await createTenant("alpha");
  B = await createTenant("bravo");
  learnerA = await addMember(A, "learner");
});
afterAll(() => closePools());

const asAdmin = (t: TenantFixture) => <R>(fn: Parameters<typeof withTenant<R>>[1]) => withTenant({ tenantId: t.tenantId, userId: t.adminUserId }, fn);

describe("row-level security: tenant isolation", () => {
  it("returns zero tenant rows when no tenant context is set (fail-closed)", async () => {
    // Raw app-role query outside withTenant: open a transaction without set_config.
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const r = await pool.query("select count(*)::int as n from employees");
    await pool.end();
    expect(r.rows[0].n).toBe(0);
  });

  it("each tenant sees only its own employees, facilities and memberships", async () => {
    const a = await asAdmin(A)((tx) => tx.select({ id: employees.id, tenantId: employees.tenantId }).from(employees));
    expect(a.length).toBeGreaterThan(0);
    expect(a.every((r) => r.tenantId === A.tenantId)).toBe(true);
    const facs = await asAdmin(A)((tx) => tx.select().from(facilities));
    expect(facs.map((f) => f.id)).toEqual([A.facilityId]);
    const ms = await asAdmin(A)((tx) => tx.select().from(memberships));
    expect(ms.every((m) => m.tenantId === A.tenantId)).toBe(true);
  });

  it("cannot read another tenant's row even by exact ID", async () => {
    const rows = await asAdmin(A)((tx) => tx.select().from(employees).where(eq(employees.id, B.employeeId)));
    expect(rows).toHaveLength(0);
    const f = await asAdmin(A)((tx) => tx.select().from(facilities).where(eq(facilities.id, B.facilityId)));
    expect(f).toHaveLength(0);
  });

  it("cannot update or delete another tenant's rows (silently affects zero rows)", async () => {
    const upd = await asAdmin(A)((tx) => tx.update(employees).set({ jobTitle: "pwned" }).where(eq(employees.id, B.employeeId)).returning());
    expect(upd).toHaveLength(0);
    const del = await asAdmin(A)((tx) => tx.delete(facilities).where(eq(facilities.id, B.facilityId)).returning());
    expect(del).toHaveLength(0);
    const [still] = await systemDb().select().from(employees).where(eq(employees.id, B.employeeId));
    expect(still.jobTitle).toBe("CNA");
  });

  it("cannot insert rows stamped with another tenant's ID", async () => {
    const err = await expectPgError(
      asAdmin(A)((tx) =>
        tx.insert(employees).values({ tenantId: B.tenantId, organizationId: B.orgId, employeeNumber: "X-1", firstName: "x", lastName: "y", jobTitle: "x", positionCode: "x", hireDate: "2026-01-01" }),
      ),
    );
    expect(err.code).toBe("42501"); // insufficient_privilege: new row violates row-level security policy
  });

  it("cannot move a row into another tenant", async () => {
    const err = await expectPgError(asAdmin(A)((tx) => tx.update(employees).set({ tenantId: B.tenantId }).where(eq(employees.id, A.employeeId))));
    expect(err.code).toBe("42501");
  });

  it("sees only its own tenant record", async () => {
    const t = await asAdmin(A)((tx) => tx.select().from(tenants));
    expect(t.map((x) => x.id)).toEqual([A.tenantId]);
  });

  it("platform-global content is readable by every tenant but writable by none", async () => {
    const cats = await asAdmin(A)((tx) => tx.select().from(courseCategories).where(isNull(courseCategories.tenantId)));
    expect(cats.length).toBe(7);
    const err = await expectPgError(asAdmin(A)((tx) => tx.insert(courseCategories).values({ name: "Hijack", slug: "hijack", department: "MANDATORY_COMPLIANCE" })));
    expect(err.code).toBe("42501");
    const upd = await asAdmin(A)((tx) => tx.update(courseCategories).set({ name: "Changed" }).where(isNull(courseCategories.tenantId)).returning());
    expect(upd).toHaveLength(0);
  });

  it("context set in one transaction does not leak to the next on the same pooled connection", async () => {
    await asAdmin(A)(async (tx) => tx.execute(sql`select 1`));
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const c = await pool.connect();
    await c.query("begin");
    await c.query("select set_config('app.tenant_id', $1, true)", [A.tenantId]);
    await c.query("commit");
    const r = await c.query("select count(*)::int n from employees");
    c.release();
    await pool.end();
    expect(r.rows[0].n).toBe(0);
  });
});

describe("database-level permission enforcement", () => {
  const asLearner = <R>(fn: Parameters<typeof withTenant<R>>[1]) => withTenant({ tenantId: A.tenantId, userId: learnerA.userId }, fn);

  it("a learner cannot create employees even inside their own tenant", async () => {
    const err = await expectPgError(
      asLearner((tx) => tx.insert(employees).values({ tenantId: A.tenantId, organizationId: A.orgId, employeeNumber: "L-1", firstName: "x", lastName: "y", jobTitle: "x", positionCode: "x", hireDate: "2026-01-01" })),
    );
    expect(err.code).toBe("42501");
  });

  it("a learner cannot modify facilities (zero rows affected)", async () => {
    const r = await asLearner((tx) => tx.update(facilities).set({ name: "renamed" }).where(eq(facilities.id, A.facilityId)).returning());
    expect(r).toHaveLength(0);
  });

  it("a learner cannot grant themselves roles", async () => {
    const err = await expectPgError(asLearner((tx) => tx.execute(sql`insert into membership_roles (tenant_id, membership_id, role_id) select ${A.tenantId}::uuid, m.id, r.id from memberships m, roles r where m.user_id = ${learnerA.userId}::uuid and r.key = 'org_admin' and r.tenant_id is null`)));
    expect(err.code).toBe("42501");
  });

  it("a learner cannot read the audit trail; an organization admin can", async () => {
    const asL = await asLearner((tx) => tx.select().from(auditLogs));
    expect(asL).toHaveLength(0);
    const asA = await asAdmin(A)((tx) => tx.select().from(auditLogs));
    expect(asA.length).toBeGreaterThan(0);
    expect(asA.every((r) => r.tenantId === A.tenantId)).toBe(true);
  });

  it("an organization admin can create employees", async () => {
    const [e] = await asAdmin(A)((tx) =>
      tx.insert(employees).values({ tenantId: A.tenantId, organizationId: A.orgId, employeeNumber: "OK-1", firstName: "x", lastName: "y", jobTitle: "x", positionCode: "x", hireDate: "2026-01-01" }).returning(),
    );
    expect(e.tenantId).toBe(A.tenantId);
  });
});

describe("column and table grants for the runtime role", () => {
  it("cannot read password hashes or MFA secrets", async () => {
    const err = await expectPgError(asAdmin(A)((tx) => tx.select({ h: users.passwordHash }).from(users)));
    expect(err.code).toBe("42501");
  });
  it("can read display columns of users", async () => {
    const r = await asAdmin(A)((tx) => tx.select({ id: users.id, email: users.email }).from(users).limit(1));
    expect(r.length).toBe(1);
  });
  it("cannot read sessions", async () => {
    const err = await expectPgError(asAdmin(A)((tx) => tx.select().from(sessions)));
    expect(err.code).toBe("42501");
  });
  it("cannot create tenants (platform-only)", async () => {
    const err = await expectPgError(asAdmin(A)((tx) => tx.insert(tenants).values({ name: "x", slug: `x-${Date.now()}` })));
    expect(err.code).toBe("42501");
  });
  it("cannot write billing records (Stripe webhooks only)", async () => {
    const err = await expectPgError(asAdmin(A)((tx) => tx.execute(sql`update subscriptions set seats = 99999`)));
    expect(err.code).toBe("42501");
  });
});
