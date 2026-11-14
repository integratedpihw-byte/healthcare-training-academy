/**
 * Employee training compliance status (spec §12 step 11, §13 "Employee compliance
 * status"), computed from assignments, external license expirations and competency
 * reassessment dates visible to the caller (RLS).
 */
import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { DUE_SOON_DAYS, addDays, deriveCompliance, todayIso, type ComplianceCounts, type ComplianceStatus } from "./rules";

const zero = (): ComplianceCounts => ({
  openAssignments: 0,
  overdueAssignments: 0,
  dueSoonAssignments: 0,
  expiredLicenses: 0,
  expiringLicenses: 0,
  overdueCompetencies: 0,
  dueSoonCompetencies: 0,
  completedAssignments: 0,
});

export async function complianceFor(tx: Tx, employeeIds: string[]): Promise<Map<string, { status: ComplianceStatus; counts: ComplianceCounts }>> {
  const out = new Map<string, { status: ComplianceStatus; counts: ComplianceCounts }>();
  if (!employeeIds.length) return out;
  const today = todayIso();
  const soon = addDays(today, DUE_SOON_DAYS);
  const ids = sql.join(employeeIds.map((id) => sql`${id}::uuid`), sql`, `);
  const counts = new Map(employeeIds.map((id) => [id, zero()]));

  const a = await tx.execute<{ employee_id: string; open: number; overdue: number; due_soon: number; completed: number }>(sql`
    select employee_id,
           count(*) filter (where status in ('ASSIGNED','IN_PROGRESS','OVERDUE'))::int open,
           count(*) filter (where status = 'OVERDUE' or (status in ('ASSIGNED','IN_PROGRESS') and due_date < ${today}::date))::int overdue,
           count(*) filter (where status in ('ASSIGNED','IN_PROGRESS') and due_date between ${today}::date and ${soon}::date)::int due_soon,
           count(*) filter (where status = 'COMPLETED')::int completed
      from training_assignments where employee_id in (${ids}) group by employee_id`);
  for (const r of a.rows) Object.assign(counts.get(r.employee_id)!, { openAssignments: r.open, overdueAssignments: r.overdue, dueSoonAssignments: r.due_soon, completedAssignments: r.completed });

  const l = await tx.execute<{ employee_id: string; expired: number; expiring: number }>(sql`
    select employee_id,
           count(*) filter (where expires_on < ${today}::date)::int expired,
           count(*) filter (where expires_on between ${today}::date and ${soon}::date)::int expiring
      from licenses where employee_id in (${ids}) and verification_status <> 'REJECTED' and expires_on is not null
     group by employee_id`);
  for (const r of l.rows) Object.assign(counts.get(r.employee_id)!, { expiredLicenses: r.expired, expiringLicenses: r.expiring });

  const c = await tx.execute<{ employee_id: string; overdue: number; due_soon: number }>(sql`
    with latest as (
      select distinct on (employee_id, competency_id) employee_id, next_assessment_due
        from competency_assessments
       where status = 'SIGNED' and employee_id in (${ids})
       order by employee_id, competency_id, assessed_on desc, signed_at desc)
    select employee_id,
           count(*) filter (where next_assessment_due < ${today}::date)::int overdue,
           count(*) filter (where next_assessment_due between ${today}::date and ${soon}::date)::int due_soon
      from latest group by employee_id`);
  for (const r of c.rows) Object.assign(counts.get(r.employee_id)!, { overdueCompetencies: r.overdue, dueSoonCompetencies: r.due_soon });

  for (const [id, cnt] of counts) out.set(id, { status: deriveCompliance(cnt), counts: cnt });
  return out;
}

/** Upcoming and past-due expirations visible to the caller (Training → Expirations). */
export async function expirationsReport(tx: Tx, horizonDays = 90) {
  const today = todayIso();
  const until = addDays(today, horizonDays);
  const certs = await tx.execute<{ id: string; recipient_name: string; course_title: string; expires_on: string; status: string; employee_id: string | null }>(sql`
    select c.id, c.recipient_name, c.course_title, c.expires_on::text, c.status::text,
           (select e.id from employees e where e.user_id = c.user_id limit 1) employee_id
      from certificates c
     where c.status in ('ACTIVE','EXPIRED') and c.expires_on is not null and c.expires_on <= ${until}::date
       and not exists (select 1 from certificates n where n.supersedes_id = c.id)
     order by c.expires_on`);
  const lic = await tx.execute<{ id: string; employee_id: string; employee_name: string; name: string; license_number: string; expires_on: string; verification_status: string }>(sql`
    select l.id, l.employee_id, e.first_name || ' ' || e.last_name employee_name, l.name, l.license_number, l.expires_on::text, l.verification_status::text
      from licenses l join employees e on e.id = l.employee_id
     where l.expires_on is not null and l.expires_on <= ${until}::date and l.verification_status <> 'REJECTED'
       and e.employment_status <> 'TERMINATED'
     order by l.expires_on`);
  const comp = await tx.execute<{ id: string; employee_id: string; employee_name: string; competency: string; next_due: string }>(sql`
    with latest as (
      select distinct on (employee_id, competency_id) id, employee_id, competency_id, next_assessment_due
        from competency_assessments where status = 'SIGNED'
       order by employee_id, competency_id, assessed_on desc, signed_at desc)
    select l.id, l.employee_id, e.first_name || ' ' || e.last_name employee_name, c.name competency, l.next_assessment_due::text next_due
      from latest l join employees e on e.id = l.employee_id join competencies c on c.id = l.competency_id
     where l.next_assessment_due is not null and l.next_assessment_due <= ${until}::date and e.employment_status <> 'TERMINATED'
     order by l.next_assessment_due`);
  return { today, certificates: certs.rows, licenses: lic.rows, competencies: comp.rows };
}
