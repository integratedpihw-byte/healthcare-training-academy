import { seq } from "@/db/seq";
import { and, count, desc, eq, gte, inArray, isNull, ne, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Tx } from "@/db/client";
import {
  auditLogs,
  employeeFacilities,
  employees,
  facilities,
  membershipRoles,
  memberships,
  notifications,
  roles,
  subscriptions,
  users,
} from "@/db/schema";

/** facilityIds null = all facilities in tenant. */
function employeeScope(facilityIds: string[] | null): SQL | undefined {
  if (facilityIds === null) return undefined;
  if (facilityIds.length === 0) return sql`false`;
  return sql`exists (select 1 from ${employeeFacilities} ef where ef.employee_id = "employees"."id" and ef.facility_id in (${sql.join(facilityIds.map((f) => sql`${f}::uuid`), sql`, `)}))`;
}

export async function adminDashboard(tx: Tx, facilityIds: string[] | null, includeAudit: boolean) {
  const scope = employeeScope(facilityIds);
  const active = and(ne(employees.employmentStatus, "TERMINATED"), scope);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);

  const facWhere = and(eq(facilities.isActive, true), facilityIds === null ? undefined : facilityIds.length ? inArray(facilities.id, facilityIds) : sql`false`);
  const [[fac], [emp], [clinical], [newHires], [members], [sub]] = await seq([
    tx.select({ n: count() }).from(facilities).where(facWhere),
    tx.select({ n: count() }).from(employees).where(active),
    tx.select({ n: count() }).from(employees).where(and(active, eq(employees.clinicalExposure, true))),
    tx.select({ n: count() }).from(employees).where(and(active, gte(employees.hireDate, ninetyDaysAgo))),
    tx.select({ n: count() }).from(memberships).where(eq(memberships.status, "ACTIVE")),
    tx.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(1),
  ]);

  const byFacility = await tx
    .select({
      id: facilities.id,
      name: facilities.name,
      type: facilities.facilityType,
      employees: sql<number>`count(distinct ${employees.id}) filter (where ${employees.employmentStatus} <> 'TERMINATED')::int`,
      clinical: sql<number>`count(distinct ${employees.id}) filter (where ${employees.employmentStatus} <> 'TERMINATED' and ${employees.clinicalExposure})::int`,
    })
    .from(facilities)
    .leftJoin(employeeFacilities, eq(employeeFacilities.facilityId, facilities.id))
    .leftJoin(employees, eq(employees.id, employeeFacilities.employeeId))
    .where(facWhere)
    .groupBy(facilities.id)
    .orderBy(facilities.name);

  const byStatus = await tx
    .select({ status: employees.employmentStatus, n: count() })
    .from(employees)
    .where(scope)
    .groupBy(employees.employmentStatus);

  const roleMix = await tx
    .select({ role: roles.name, n: sql<number>`count(distinct ${membershipRoles.membershipId})::int` })
    .from(membershipRoles)
    .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
    .groupBy(roles.name)
    .orderBy(roles.name);

  const recentAudit = includeAudit
    ? await tx
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          createdAt: auditLogs.createdAt,
          actorFirst: users.firstName,
          actorLast: users.lastName,
        })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorUserId))
        .orderBy(desc(auditLogs.id))
        .limit(8)
    : [];

  return {
    facilities: fac.n,
    employees: emp.n,
    clinical: clinical.n,
    newHires: newHires.n,
    members: members.n,
    subscription: sub ?? null,
    byFacility,
    byStatus,
    roleMix,
    recentAudit,
  };
}

export async function myEmployeeRecord(tx: Tx, userId: string) {
  const sup = alias(employees, "sup");
  const [row] = await tx
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      jobTitle: employees.jobTitle,
      hireDate: employees.hireDate,
      facility: facilities.name,
      facilityType: facilities.facilityType,
      supervisorFirst: sup.firstName,
      supervisorLast: sup.lastName,
    })
    .from(employees)
    .leftJoin(facilities, eq(facilities.id, employees.primaryFacilityId))
    .leftJoin(sup, eq(sup.id, employees.supervisorId))
    .where(eq(employees.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function directReports(tx: Tx, userId: string) {
  const me = alias(employees, "me");
  return tx
    .select({
      id: employees.id,
      name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      jobTitle: employees.jobTitle,
      status: employees.employmentStatus,
      hireDate: employees.hireDate,
      facility: facilities.name,
      clinical: employees.clinicalExposure,
    })
    .from(employees)
    .innerJoin(me, eq(me.id, employees.supervisorId))
    .leftJoin(facilities, eq(facilities.id, employees.primaryFacilityId))
    .where(eq(me.userId, userId))
    .orderBy(employees.lastName);
}

export async function latestNotifications(tx: Tx, userId: string, limit = 5) {
  return tx
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
