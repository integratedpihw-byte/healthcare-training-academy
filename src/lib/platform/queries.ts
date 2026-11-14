import { count, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { auditLogs, employees, facilities, memberships, organizations, subscriptions, tenants, users } from "@/db/schema";

/** Platform-wide analytics. System client — callers must be platform administrators. */
export async function platformOverview(db: Db) {
  const [[orgs], [facs], [emps], [usr], byStatus] = await Promise.all([
    db.select({ n: count() }).from(tenants).where(eq(tenants.type, "ORGANIZATION")),
    db.select({ n: count() }).from(facilities).where(eq(facilities.isActive, true)),
    db.select({ n: count() }).from(employees).where(sql`${employees.employmentStatus} <> 'TERMINATED'`),
    db.select({ n: count() }).from(users).where(eq(users.status, "ACTIVE")),
    db.select({ status: tenants.status, n: count() }).from(tenants).groupBy(tenants.status),
  ]);
  return {
    organizations: orgs.n,
    facilities: facs.n,
    employees: emps.n,
    users: usr.n,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.n])) as Record<string, number>,
  };
}

export async function listTenants(db: Db, status?: string) {
  return db
    .select({
      id: tenants.id,
      name: tenants.name,
      type: tenants.type,
      status: tenants.status,
      createdAt: tenants.createdAt,
      state: tenants.primaryState,
      facilities: sql<number>`(select count(*)::int from ${facilities} f where f.tenant_id = "tenants"."id")`,
      employees: sql<number>`(select count(*)::int from ${employees} e where e.tenant_id = "tenants"."id")`,
      members: sql<number>`(select count(*)::int from ${memberships} m where m.tenant_id = "tenants"."id")`,
      plan: sql<string | null>`(select s.plan::text from ${subscriptions} s where s.tenant_id = "tenants"."id" order by s.created_at desc limit 1)`,
    })
    .from(tenants)
    .where(status ? sql`${tenants.status} = ${status}` : undefined)
    .orderBy(sql`case ${tenants.status} when 'PENDING_APPROVAL' then 0 else 1 end`, desc(tenants.createdAt))
    .limit(500);
}

export async function tenantDetail(db: Db, id: string) {
  const [t] = await db.select().from(tenants).where(eq(tenants.id, id));
  if (!t) return null;
  const [org, facs, sub, members, audit] = await Promise.all([
    db.select().from(organizations).where(eq(organizations.tenantId, id)).limit(1),
    db.select().from(facilities).where(eq(facilities.tenantId, id)),
    db.select().from(subscriptions).where(eq(subscriptions.tenantId, id)).orderBy(desc(subscriptions.createdAt)).limit(1),
    db
      .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.tenantId, id))
      .limit(20),
    db.select().from(auditLogs).where(eq(auditLogs.tenantId, id)).orderBy(desc(auditLogs.id)).limit(15),
  ]);
  return { tenant: t, org: org[0] ?? null, facilities: facs, subscription: sub[0] ?? null, members, audit };
}
