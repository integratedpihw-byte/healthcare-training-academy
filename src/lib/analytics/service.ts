/**
 * Management dashboard analytics (spec §14). Runs inside the viewer's RLS transaction,
 * so every figure is limited to the facilities, teams and records the viewer may see.
 * The population is the set of active employees matching the filters; learning metrics
 * are computed for those employees' academy accounts.
 */
import { sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { complianceFor } from "@/lib/workforce/compliance";
import { addDays, todayIso, type ComplianceStatus } from "@/lib/workforce/rules";

const uuidOpt = z.string().uuid().optional().catch(undefined);
const dateOpt = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined);
export const filterSchema = z.object({
  facilityId: uuidOpt,
  departmentId: uuidOpt,
  employeeId: uuidOpt,
  position: z.string().max(80).optional().catch(undefined),
  categoryId: uuidOpt,
  from: dateOpt,
  to: dateOpt,
  status: z.enum(["COMPLIANT", "AT_RISK", "NON_COMPLIANT", "NO_REQUIREMENTS"]).optional().catch(undefined),
});
export type Filters = z.infer<typeof filterSchema>;

export function normalizeRange(f: Filters, today = todayIso()) {
  let to = f.to ?? today;
  let from = f.from ?? addDays(to, -364);
  if (from > to) [from, to] = [to, from];
  if (addDays(from, 3 * 366) < to) from = addDays(to, -3 * 366); // cap at ~3 years
  return { from, to };
}

const arr = (ids: string[]) => `{${ids.join(",")}}`;
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

export interface Analytics {
  range: { from: string; to: string };
  kpis: {
    employees: number;
    activeStudents: number;
    courses: number;
    enrollments: number;
    completed: number;
    pending: number;
    overdue: number;
    expiringCerts: number;
    failedExams: number;
    competencyPassRate: number | null;
    competencySigned: number;
    compliancePct: number | null;
    trainingHours: number;
  };
  statusMix: Record<ComplianceStatus, number>;
  monthly: { month: string; enrollments: number; completions: number; hours: number }[];
  utilization: { title: string; code: string; enrollments: number; completions: number; ratePct: number | null }[];
  byCategory: { category: string; completions: number; hours: number }[];
  facilityRanking: { facility: string; employees: number; compliant: number; pct: number | null }[];
  employees: { id: string; name: string; number: string; position: string; facility: string | null; status: ComplianceStatus; open: number; overdue: number }[];
}

export async function analytics(tx: Tx, raw: unknown, today = todayIso()): Promise<Analytics> {
  const f = filterSchema.parse(raw ?? {});
  const range = normalizeRange(f, today);
  const pop = (
    await tx.execute<{ id: string; user_id: string | null; name: string; number: string; position: string; facility_id: string | null; facility: string | null }>(sql`
    select e.id, e.user_id, e.last_name || ', ' || e.first_name name, e.employee_number number, e.job_title position, e.primary_facility_id facility_id, f.name facility
      from employees e left join facilities f on f.id = e.primary_facility_id
     where e.employment_status <> 'TERMINATED'
       and (${f.facilityId ?? null}::uuid is null or e.primary_facility_id = ${f.facilityId ?? null}::uuid)
       and (${f.departmentId ?? null}::uuid is null or e.department_id = ${f.departmentId ?? null}::uuid)
       and (${f.employeeId ?? null}::uuid is null or e.id = ${f.employeeId ?? null}::uuid)
       and (${f.position ?? null}::text is null or e.position_code = ${f.position ?? null}::text)
     order by e.last_name, e.first_name`)
  ).rows;
  const comp = await complianceFor(tx, pop.map((p) => p.id));
  const people = f.status ? pop.filter((p) => comp.get(p.id)?.status === f.status) : pop;
  const empIds = arr(people.map((p) => p.id));
  const userIds = arr(people.map((p) => p.user_id).filter((u): u is string => !!u));
  const cat = f.categoryId ?? null;
  const { from, to } = range;

  const [k] = (
    await tx.execute<{ active: number; courses: number; enrollments: number; completed: number; pending: number; overdue: number; expiring: number; failed: number; signed: number; passed: number; minutes: number }>(sql`
    with pu as materialized (select unnest(${userIds}::uuid[]) id),
         pe as materialized (select unnest(${empIds}::uuid[]) id),
         en as materialized (select en.*, c.estimated_minutes from enrollments en join pu on pu.id = en.user_id join courses c on c.id = en.course_id
                 where (${cat}::uuid is null or c.category_id = ${cat}::uuid))
    select
      (select count(distinct user_id)::int from en where status in ('NOT_STARTED','IN_PROGRESS','AWAITING_ASSESSMENT') or completed_at::date between ${from}::date and ${to}::date) active,
      (select count(*)::int from courses c where c.status = 'PUBLISHED' and (${cat}::uuid is null or c.category_id = ${cat}::uuid)) courses,
      (select count(*)::int from en where created_at::date between ${from}::date and ${to}::date) enrollments,
      (select count(*)::int from en where status = 'COMPLETED' and completed_at::date between ${from}::date and ${to}::date) completed,
      (select count(*)::int from en where status in ('NOT_STARTED','IN_PROGRESS','AWAITING_ASSESSMENT')) pending,
      (select count(*)::int from training_assignments ta join courses c on c.id = ta.course_id
        join pe on pe.id = ta.employee_id where ta.status = 'OVERDUE' and (${cat}::uuid is null or c.category_id = ${cat}::uuid)) overdue,
      (select count(*)::int from certificates ce join pu on pu.id = ce.user_id where ce.status = 'ACTIVE'
        and ce.expires_on between ${today}::date and ${today}::date + 60) expiring,
      (select count(*)::int from examination_attempts a join en on en.id = a.enrollment_id
        where a.passed = false and a.submitted_at::date between ${from}::date and ${to}::date) failed,
      (select count(*)::int from competency_assessments ca join pe on pe.id = ca.employee_id where ca.status = 'SIGNED' and ca.assessed_on between ${from}::date and ${to}::date) signed,
      (select count(*)::int from competency_assessments ca join pe on pe.id = ca.employee_id where ca.status = 'SIGNED' and ca.result = 'PASS' and ca.assessed_on between ${from}::date and ${to}::date) passed,
      (select coalesce(sum(estimated_minutes), 0)::int from en where status = 'COMPLETED' and completed_at::date between ${from}::date and ${to}::date) minutes`)
  ).rows;

  const monthly = (
    await tx.execute<{ month: string; enrollments: number; completions: number; minutes: number }>(sql`
    with en as materialized (select en.created_at, en.completed_at, en.status, c.estimated_minutes from enrollments en
                   join (select unnest(${userIds}::uuid[]) id) pu on pu.id = en.user_id join courses c on c.id = en.course_id
                  where (${cat}::uuid is null or c.category_id = ${cat}::uuid)),
         m as (select generate_series(date_trunc('month', ${from}::date), date_trunc('month', ${to}::date), interval '1 month')::date m),
         e as (select date_trunc('month', created_at)::date m, count(*)::int n from en where created_at::date between ${from}::date and ${to}::date group by 1),
         c as (select date_trunc('month', completed_at)::date m, count(*)::int n, coalesce(sum(estimated_minutes), 0)::int mins from en
                where status = 'COMPLETED' and completed_at::date between ${from}::date and ${to}::date group by 1)
    select to_char(m.m, 'YYYY-MM') as month, coalesce(e.n, 0) enrollments, coalesce(c.n, 0) completions, coalesce(c.mins, 0) minutes
      from m left join e on e.m = m.m left join c on c.m = m.m order by m.m`)
  ).rows;

  const utilization = (
    await tx.execute<{ title: string; code: string; enrollments: number; completions: number }>(sql`
    select c.title, c.code, count(*)::int enrollments, count(*) filter (where en.status = 'COMPLETED')::int completions
      from enrollments en join (select unnest(${userIds}::uuid[]) id) pu on pu.id = en.user_id join courses c on c.id = en.course_id
     where en.created_at::date between ${from}::date and ${to}::date
       and (${cat}::uuid is null or c.category_id = ${cat}::uuid)
     group by c.id order by 3 desc, 4 desc limit 10`)
  ).rows;

  const byCategory = (
    await tx.execute<{ category: string; completions: number; minutes: number }>(sql`
    select cc.name category, count(*)::int completions, coalesce(sum(c.estimated_minutes), 0)::int minutes
      from enrollments en join (select unnest(${userIds}::uuid[]) id) pu on pu.id = en.user_id join courses c on c.id = en.course_id join course_categories cc on cc.id = c.category_id
     where en.status = 'COMPLETED' and en.completed_at::date between ${from}::date and ${to}::date
       and (${cat}::uuid is null or c.category_id = ${cat}::uuid)
     group by cc.name order by 2 desc`)
  ).rows;

  const statusMix: Record<ComplianceStatus, number> = { COMPLIANT: 0, AT_RISK: 0, NON_COMPLIANT: 0, NO_REQUIREMENTS: 0 };
  const byFacility = new Map<string, { employees: number; compliant: number }>();
  for (const p of people) {
    const s = comp.get(p.id)?.status ?? "NO_REQUIREMENTS";
    statusMix[s]++;
    if (s === "NO_REQUIREMENTS") continue;
    const key = p.facility ?? "No primary facility";
    const b = byFacility.get(key) ?? { employees: 0, compliant: 0 };
    b.employees++;
    if (s === "COMPLIANT" || s === "AT_RISK") b.compliant++;
    byFacility.set(key, b);
  }
  const withReq = people.length - statusMix.NO_REQUIREMENTS;

  return {
    range,
    kpis: {
      employees: people.length,
      activeStudents: k.active,
      courses: k.courses,
      enrollments: k.enrollments,
      completed: k.completed,
      pending: k.pending,
      overdue: k.overdue,
      expiringCerts: k.expiring,
      failedExams: k.failed,
      competencyPassRate: pct(k.passed, k.signed),
      competencySigned: k.signed,
      // In good standing = compliant or merely "due soon" (nothing overdue/expired/missing).
      compliancePct: pct(statusMix.COMPLIANT + statusMix.AT_RISK, withReq),
      trainingHours: Math.round((k.minutes / 60) * 10) / 10,
    },
    statusMix,
    monthly: monthly.map((m) => ({ month: m.month, enrollments: m.enrollments, completions: m.completions, hours: Math.round((m.minutes / 60) * 10) / 10 })),
    utilization: utilization.map((u) => ({ ...u, ratePct: pct(u.completions, u.enrollments) })),
    byCategory: byCategory.map((c) => ({ category: c.category, completions: c.completions, hours: Math.round((c.minutes / 60) * 10) / 10 })),
    facilityRanking: [...byFacility.entries()].map(([facility, b]) => ({ facility, employees: b.employees, compliant: b.compliant, pct: pct(b.compliant, b.employees) })).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.employees - a.employees),
    employees: people.map((p) => {
      const c = comp.get(p.id);
      return { id: p.id, name: p.name, number: p.number, position: p.position, facility: p.facility, status: c?.status ?? "NO_REQUIREMENTS", open: c?.counts.openAssignments ?? 0, overdue: c?.counts.overdueAssignments ?? 0 };
    }),
  };
}

/** Options for the filter bar (RLS-scoped). */
export async function filterOptions(tx: Tx) {
  const q = async <T>(s: ReturnType<typeof sql>) => (await tx.execute<T & Record<string, unknown>>(s)).rows as T[];
  return {
    facilities: await q<{ id: string; name: string }>(sql`select id, name from facilities order by name`),
    departments: await q<{ id: string; name: string; facility: string | null }>(sql`select d.id, d.name, f.name facility from departments d left join facilities f on f.id = d.facility_id order by d.name`),
    positions: await q<{ code: string; title: string }>(sql`select position_code code, min(job_title) title from employees group by position_code order by 2`),
    categories: await q<{ id: string; name: string }>(sql`select id, name from course_categories order by name`),
    employees: await q<{ id: string; name: string }>(sql`select id, last_name || ', ' || first_name name from employees where employment_status <> 'TERMINATED' order by last_name, first_name limit 1000`),
  };
}

/** Platform-wide statistics (platform console). Uses the system connection. */
export async function platformStats(sys: { execute: Tx["execute"] }) {
  const [r] = (
    await sys.execute<{ organizations: number; active_orgs: number; facilities: number; employees: number; learners: number; courses: number; enrollments: number; completions_30: number; certificates: number }>(sql`
    select (select count(*)::int from tenants where type = 'ORGANIZATION') organizations,
           (select count(*)::int from tenants where type = 'ORGANIZATION' and status = 'ACTIVE') active_orgs,
           (select count(*)::int from facilities) facilities,
           (select count(*)::int from employees where employment_status <> 'TERMINATED') employees,
           (select count(distinct user_id)::int from enrollments where status in ('NOT_STARTED','IN_PROGRESS','AWAITING_ASSESSMENT') or completed_at > now() - interval '90 days') learners,
           (select count(*)::int from courses where status = 'PUBLISHED') courses,
           (select count(*)::int from enrollments) enrollments,
           (select count(*)::int from enrollments where completed_at > now() - interval '30 days') completions_30,
           (select count(*)::int from certificates where status = 'ACTIVE') certificates`)
  ).rows;
  const plans = (await sys.execute<{ plan: string; status: string; n: number }>(sql`select plan::text, status::text, count(*)::int n from (select distinct on (tenant_id) * from subscriptions order by tenant_id, created_at desc) s group by 1, 2 order by 1, 2`)).rows;
  return { ...r, plans };
}
