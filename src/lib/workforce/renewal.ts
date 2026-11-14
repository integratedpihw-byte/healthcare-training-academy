/**
 * Training renewal and expiration engine (spec §13). Runs daily on the platform client.
 *
 *  1. Overdue assignments → OVERDUE; employee + supervisor notified; administrators
 *     escalated after the organization's escalation delay.
 *  2. Upcoming due dates → reminders at the configured lead times (per requirement
 *     override, else organization schedule; default 90/60/30/15/7).
 *  3. Certificate expirations → warnings at the lead times; a renewal assignment is
 *     created when the certificate enters the renewal window (recurring training).
 *  4. Requirement frequencies (courses without certificate expiry) → recurring assignments.
 *  5. External license expirations → warnings; expired licenses marked EXPIRED.
 *  6. Competency reassessments → warnings, overdue alerts and escalation.
 *
 * The engine NEVER extends an expiration date: new dates come only from a new completion
 * (new certificate), a newly signed evaluation, or an audited administrative correction.
 * Every notification carries a dedupe key, so re-running on the same day is harmless.
 */
import { sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { trainingAssignments } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify, type NewNotification } from "@/lib/notify/notifications";
import { DEFAULT_LEAD_DAYS, addDays, daysBetween, reminderThreshold, todayIso } from "./rules";

export interface EngineSummary {
  tenants: number;
  markedOverdue: number;
  dueReminders: number;
  escalations: number;
  certificateWarnings: number;
  renewalAssignments: number;
  licenseWarnings: number;
  licensesExpired: number;
  competencyWarnings: number;
  /** Notifications actually created (duplicates from earlier runs are skipped). */
  notifications: number;
}

interface Prefs {
  lead: number[];
  escalateAfterDays: number;
  renewalWindowDays: number;
}

type Rows<T> = { rows: T[] };

/** Users holding `perm` tenant-wide or at one of the facilities (for escalation). */
async function holders(sys: Db, tenantId: string, perm: string, facilityIds: string[]): Promise<string[]> {
  const facs = facilityIds.length ? sql`or mr.facility_id in (${sql.join(facilityIds.map((f) => sql`${f}::uuid`), sql`, `)})` : sql``;
  const r = (await sys.execute(sql`
    select distinct m.user_id from memberships m
      join membership_roles mr on mr.membership_id = m.id
      join role_permissions rp on rp.role_id = mr.role_id
      join permissions p on p.id = rp.permission_id
      join users u on u.id = m.user_id
     where m.tenant_id = ${tenantId}::uuid and m.status = 'ACTIVE' and u.status <> 'DISABLED'
       and p.key = ${perm} and (mr.facility_id is null ${facs})`)) as Rows<{ user_id: string }>;
  return r.rows.map((x) => x.user_id);
}

export async function runRenewalEngine(sys: Db, opts: { today?: string } = {}): Promise<EngineSummary> {
  const today = opts.today ?? todayIso();
  const s: EngineSummary = { tenants: 0, markedOverdue: 0, dueReminders: 0, escalations: 0, certificateWarnings: 0, renewalAssignments: 0, licenseWarnings: 0, licensesExpired: 0, competencyWarnings: 0, notifications: 0 };
  const tenants = (await sys.execute(sql`
    select t.id, coalesce(np.expiry_lead_days, ${sql.raw(`'{${DEFAULT_LEAD_DAYS.join(",")}}'::int[]`)}) lead,
           coalesce(np.escalate_after_days, 7) escalate_after_days, coalesce(np.renewal_window_days, 60) renewal_window_days
      from tenants t left join notification_preferences np on np.tenant_id = t.id
     where t.status = 'ACTIVE'`)) as Rows<{ id: string; lead: number[]; escalate_after_days: number; renewal_window_days: number }>;

  for (const t of tenants.rows) {
    s.tenants++;
    const prefs: Prefs = { lead: t.lead?.length ? t.lead : DEFAULT_LEAD_DAYS, escalateAfterDays: t.escalate_after_days, renewalWindowDays: t.renewal_window_days };
    const out: NewNotification[] = [];
    const push = (n: Omit<NewNotification, "tenantId">) => out.push({ tenantId: t.id, ...n });
    await processAssignments(sys, t.id, today, prefs, push, s);
    await processCertificates(sys, t.id, today, prefs, push, s);
    await processRecurringRequirements(sys, t.id, today, prefs, s);
    await processLicenses(sys, t.id, today, prefs, push, s);
    await processCompetencies(sys, t.id, today, prefs, push, s);
    // Insert in chunks; duplicates (same dedupe key) are ignored by the unique index.
    for (let i = 0; i < out.length; i += 200) s.notifications += await notify(sys, out.slice(i, i + 200));
  }
  return s;
}

type Push = (n: Omit<NewNotification, "tenantId">) => void;

async function processAssignments(sys: Db, tenantId: string, today: string, prefs: Prefs, push: Push, s: EngineSummary) {
  // 1) Mark overdue.
  const marked = (await sys.execute(sql`
    update training_assignments set status = 'OVERDUE', updated_at = now()
     where tenant_id = ${tenantId}::uuid and status in ('ASSIGNED','IN_PROGRESS') and due_date < ${today}::date
     returning id`)) as Rows<{ id: string }>;
  s.markedOverdue += marked.rows.length;
  for (const m of marked.rows) await writeAudit(sys, { tenantId, actorUserId: null, action: "assignment.overdue", entityType: "training_assignment", entityId: m.id });

  const rows = (await sys.execute(sql`
    select ta.id, ta.status::text, ta.due_date::text due_date, ta.created_at::date::text created_on, c.title course_title,
           e.id employee_id, e.first_name || ' ' || e.last_name employee_name, e.user_id,
           (select s.user_id from employees s where s.id = e.supervisor_id) supervisor_user_id,
           array(select ef.facility_id from employee_facilities ef where ef.employee_id = e.id) facility_ids,
           tr.reminder_lead_days
      from training_assignments ta
      join employees e on e.id = ta.employee_id
      join courses c on c.id = ta.course_id
      left join training_requirements tr on tr.id = ta.requirement_id
     where ta.tenant_id = ${tenantId}::uuid and ta.status in ('ASSIGNED','IN_PROGRESS','OVERDUE') and ta.due_date is not null
       and e.employment_status <> 'TERMINATED'`)) as Rows<{
    id: string; status: string; due_date: string; created_on: string; course_title: string; employee_id: string; employee_name: string; user_id: string | null;
    supervisor_user_id: string | null; facility_ids: string[]; reminder_lead_days: number[] | null;
  }>;

  for (const a of rows.rows) {
    const daysUntil = daysBetween(today, a.due_date);
    if (daysUntil >= 0) {
      // 2) Due-date reminders.
      const lead = a.reminder_lead_days?.length ? a.reminder_lead_days : prefs.lead;
      const th = reminderThreshold(daysUntil, lead);
      // Skip thresholds already inside the window when the assignment was made (the
      // assignment notice itself told the employee the due date).
      const windowAtCreation = daysBetween(a.created_on, a.due_date);
      if (th !== null && th < windowAtCreation && a.user_id) {
        push({ userId: a.user_id, type: "reminder.due", title: `Training due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, body: `${a.course_title} is due on ${a.due_date}.`, link: "/learning", dedupeKey: `due:${a.id}:${th}` });
        s.dueReminders++;
      }
      continue;
    }
    const daysOver = -daysUntil;
    if (a.user_id) push({ userId: a.user_id, type: "training.overdue", title: "Required training is overdue", body: `${a.course_title} was due on ${a.due_date}. Please complete it as soon as possible.`, link: "/learning", dedupeKey: `overdue:${a.id}` });
    if (a.supervisor_user_id && a.supervisor_user_id !== a.user_id) {
      push({ userId: a.supervisor_user_id, type: "training.overdue.supervisor", title: "A team member's training is overdue", body: `${a.employee_name}: ${a.course_title} was due on ${a.due_date}.`, link: `/employees/${a.employee_id}`, dedupeKey: `overdue-sup:${a.id}` });
    }
    // 3) Administrator escalation.
    if (daysOver >= prefs.escalateAfterDays) {
      const admins = await holders(sys, tenantId, "training.assign", a.facility_ids ?? []);
      for (const u of admins) {
        if (u === a.user_id) continue;
        push({ userId: u, type: "training.escalation", title: `Escalation: training ${daysOver} days overdue`, body: `${a.employee_name}: ${a.course_title} (due ${a.due_date}) remains incomplete.`, link: `/employees/${a.employee_id}`, dedupeKey: `escalate:${a.id}:${u}` });
      }
      if (admins.length) s.escalations++;
    }
  }
}

async function processCertificates(sys: Db, tenantId: string, today: string, prefs: Prefs, push: Push, s: EngineSummary) {
  const rows = (await sys.execute(sql`
    select c.id, c.user_id, c.course_id, c.course_title, c.expires_on::text expires_on,
           e.id employee_id, e.first_name || ' ' || e.last_name employee_name, e.employment_status::text employment_status,
           (select s.user_id from employees s where s.id = e.supervisor_id) supervisor_user_id,
           co.status::text course_status,
           (select tr.reminder_lead_days from training_requirements tr
             where tr.course_id = c.course_id and tr.is_active and tr.reminder_lead_days is not null
               and (tr.tenant_id = c.tenant_id or tr.tenant_id is null)
             order by tr.tenant_id nulls last limit 1) reminder_lead_days
      from certificates c
      join courses co on co.id = c.course_id
      left join employees e on e.tenant_id = c.tenant_id and e.user_id = c.user_id
     where c.tenant_id = ${tenantId}::uuid and c.status = 'ACTIVE' and c.expires_on is not null and c.expires_on >= ${today}::date`)) as Rows<{
    id: string; user_id: string; course_id: string; course_title: string; expires_on: string; employee_id: string | null; employee_name: string | null;
    employment_status: string | null; supervisor_user_id: string | null; course_status: string; reminder_lead_days: number[] | null;
  }>;
  for (const c of rows.rows) {
    if (c.employment_status === "TERMINATED") continue;
    const daysUntil = daysBetween(today, c.expires_on);
    const lead = c.reminder_lead_days?.length ? c.reminder_lead_days : prefs.lead;
    const th = reminderThreshold(daysUntil, lead);
    if (th !== null) {
      push({ userId: c.user_id, type: "certificate.expiring", title: `Certificate expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, body: `Your ${c.course_title} certificate expires on ${c.expires_on}. Complete the course again to renew it.`, link: `/certificates/${c.id}`, dedupeKey: `cert-exp:${c.id}:${th}` });
      if (c.supervisor_user_id && th <= 30) push({ userId: c.supervisor_user_id, type: "certificate.expiring.supervisor", title: "A team member's certificate is expiring", body: `${c.employee_name}: ${c.course_title} expires on ${c.expires_on}.`, link: `/employees/${c.employee_id}`, dedupeKey: `cert-exp-sup:${c.id}:${th}` });
      s.certificateWarnings++;
    }
    // Renewal assignment when entering the renewal window (one per certificate).
    if (c.employee_id && c.course_status === "PUBLISHED" && daysUntil <= prefs.renewalWindowDays) {
      const created = (await sys.execute(sql`
        insert into training_assignments (tenant_id, employee_id, course_id, source, reason, due_date, renews_certificate_id)
        select ${tenantId}::uuid, ${c.employee_id}::uuid, ${c.course_id}::uuid, 'RENEWAL', ${`Renewal: certificate expires ${c.expires_on}`}, ${c.expires_on}::date, ${c.id}::uuid
         where not exists (select 1 from training_assignments x where x.renews_certificate_id = ${c.id}::uuid)
        on conflict do nothing
        returning id`)) as Rows<{ id: string }>;
      if (created.rows.length) {
        s.renewalAssignments++;
        await writeAudit(sys, { tenantId, actorUserId: null, action: "assignment.renewal_created", entityType: "training_assignment", entityId: created.rows[0].id, after: { certificateId: c.id, dueDate: c.expires_on } });
        push({ userId: c.user_id, type: "assignment.renewal", title: "Renewal training assigned", body: `${c.course_title} must be completed again by ${c.expires_on} to keep your certificate current.`, link: "/learning", dedupeKey: `assign:${created.rows[0].id}` });
      }
    }
  }
}

async function processRecurringRequirements(sys: Db, tenantId: string, today: string, prefs: Prefs, s: EngineSummary) {
  // Requirements with a frequency, for courses whose certificates do not carry an expiry.
  const rows = (await sys.execute(sql`
    select distinct on (ta.employee_id, ta.course_id) ta.id, ta.employee_id, ta.course_id, ta.requirement_id, ta.completed_at::date::text completed_on, tr.frequency_months, tr.title
      from training_assignments ta
      join training_requirements tr on tr.id = ta.requirement_id and tr.is_active and tr.frequency_months is not null
      join courses co on co.id = ta.course_id and co.status = 'PUBLISHED' and co.renewal_months is null
      join employees e on e.id = ta.employee_id and e.employment_status <> 'TERMINATED'
     where ta.tenant_id = ${tenantId}::uuid and ta.status = 'COMPLETED'
       and not exists (select 1 from training_assignments y
                        where y.employee_id = ta.employee_id and y.course_id = ta.course_id and y.created_at > ta.completed_at)
     order by ta.employee_id, ta.course_id, ta.completed_at desc`)) as Rows<{ id: string; employee_id: string; course_id: string; requirement_id: string; completed_on: string; frequency_months: number; title: string | null }>;
  for (const r of rows.rows) {
    const [y, m, d] = r.completed_on.split("-").map(Number);
    const due = new Date(Date.UTC(y, m - 1 + r.frequency_months, d)).toISOString().slice(0, 10);
    if (addDays(due, -prefs.renewalWindowDays) > today) continue;
    const created = await sys
      .insert(trainingAssignments)
      .values({ tenantId, employeeId: r.employee_id, courseId: r.course_id, requirementId: r.requirement_id, source: "RENEWAL", reason: `Recurring requirement (${r.frequency_months} months): ${r.title ?? "training"}`, dueDate: due < today ? addDays(today, 30) : due })
      .onConflictDoNothing()
      .returning({ id: trainingAssignments.id, employeeId: trainingAssignments.employeeId });
    if (created.length) {
      s.renewalAssignments++;
      await writeAudit(sys, { tenantId, actorUserId: null, action: "assignment.recurring_created", entityType: "training_assignment", entityId: created[0].id, after: { previousAssignmentId: r.id, dueDate: due } });
    }
  }
}

async function processLicenses(sys: Db, tenantId: string, today: string, prefs: Prefs, push: Push, s: EngineSummary) {
  const expired = (await sys.execute(sql`
    update licenses set verification_status = 'EXPIRED', updated_at = now()
     where tenant_id = ${tenantId}::uuid and expires_on < ${today}::date and verification_status in ('UNVERIFIED','VERIFIED')
     returning id`)) as Rows<{ id: string }>;
  s.licensesExpired += expired.rows.length;
  for (const l of expired.rows) await writeAudit(sys, { tenantId, actorUserId: null, action: "license.expired", entityType: "license", entityId: l.id });

  const rows = (await sys.execute(sql`
    select l.id, l.name, l.expires_on::text expires_on, e.id employee_id, e.first_name || ' ' || e.last_name employee_name, e.user_id,
           (select s.user_id from employees s where s.id = e.supervisor_id) supervisor_user_id,
           array(select ef.facility_id from employee_facilities ef where ef.employee_id = e.id) facility_ids
      from licenses l join employees e on e.id = l.employee_id
     where l.tenant_id = ${tenantId}::uuid and l.expires_on is not null and l.verification_status <> 'REJECTED'
       and e.employment_status <> 'TERMINATED'`)) as Rows<{ id: string; name: string; expires_on: string; employee_id: string; employee_name: string; user_id: string | null; supervisor_user_id: string | null; facility_ids: string[] }>;
  for (const l of rows.rows) {
    const daysUntil = daysBetween(today, l.expires_on);
    const th = daysUntil >= 0 ? reminderThreshold(daysUntil, prefs.lead) : null;
    const key = th !== null ? `lic:${l.id}:${th}` : daysUntil < 0 ? `lic-expired:${l.id}` : null;
    if (!key) continue;
    const title = daysUntil < 0 ? "A professional license has expired" : `License expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
    if (l.user_id) push({ userId: l.user_id, type: "license.expiring", title, body: `Your ${l.name} ${daysUntil < 0 ? "expired" : "expires"} on ${l.expires_on}. Provide your renewed license to your administrator.`, link: "/learning", dedupeKey: key });
    const managers = new Set(await holders(sys, tenantId, "employees.manage", l.facility_ids ?? []));
    if (l.supervisor_user_id) managers.add(l.supervisor_user_id);
    for (const u of managers) {
      if (u === l.user_id) continue;
      push({ userId: u, type: "license.expiring.manager", title: daysUntil < 0 ? "Employee license expired" : "Employee license expiring", body: `${l.employee_name}: ${l.name} ${daysUntil < 0 ? "expired" : "expires"} on ${l.expires_on}.`, link: `/employees/${l.employee_id}`, dedupeKey: `${key}:${u}` });
    }
    s.licenseWarnings++;
  }
}

async function processCompetencies(sys: Db, tenantId: string, today: string, prefs: Prefs, push: Push, s: EngineSummary) {
  const rows = (await sys.execute(sql`
    with latest as (
      select distinct on (employee_id, competency_id) id, employee_id, competency_id, next_assessment_due
        from competency_assessments where tenant_id = ${tenantId}::uuid and status = 'SIGNED'
       order by employee_id, competency_id, assessed_on desc, signed_at desc)
    select l.id, l.next_assessment_due::text next_due, c.name competency, e.id employee_id, e.first_name || ' ' || e.last_name employee_name, e.user_id,
           (select s.user_id from employees s where s.id = e.supervisor_id) supervisor_user_id,
           array(select ef.facility_id from employee_facilities ef where ef.employee_id = e.id) facility_ids
      from latest l join employees e on e.id = l.employee_id join competencies c on c.id = l.competency_id
     where l.next_assessment_due is not null and e.employment_status <> 'TERMINATED'`)) as Rows<{ id: string; next_due: string; competency: string; employee_id: string; employee_name: string; user_id: string | null; supervisor_user_id: string | null; facility_ids: string[] }>;
  for (const c of rows.rows) {
    const daysUntil = daysBetween(today, c.next_due);
    if (daysUntil >= 0) {
      const th = reminderThreshold(daysUntil, prefs.lead);
      if (th === null) continue;
      if (c.user_id) push({ userId: c.user_id, type: "competency.due", title: `Skills reassessment due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, body: `${c.competency} reassessment is due on ${c.next_due}.`, link: "/competency", dedupeKey: `comp-due:${c.id}:${th}` });
      if (c.supervisor_user_id && th <= 30) push({ userId: c.supervisor_user_id, type: "competency.due.supervisor", title: "Team skills reassessment due", body: `${c.employee_name}: ${c.competency} is due on ${c.next_due}.`, link: "/competency/new", dedupeKey: `comp-due-sup:${c.id}:${th}` });
      s.competencyWarnings++;
      continue;
    }
    if (c.user_id) push({ userId: c.user_id, type: "competency.overdue", title: "Skills reassessment overdue", body: `${c.competency} reassessment was due on ${c.next_due}.`, link: "/competency", dedupeKey: `comp-overdue:${c.id}` });
    if (c.supervisor_user_id) push({ userId: c.supervisor_user_id, type: "competency.overdue.supervisor", title: "Team skills reassessment overdue", body: `${c.employee_name}: ${c.competency} was due on ${c.next_due}.`, link: "/competency/new", dedupeKey: `comp-overdue-sup:${c.id}` });
    if (-daysUntil >= prefs.escalateAfterDays) {
      for (const u of await holders(sys, tenantId, "competency.view", c.facility_ids ?? [])) {
        if (u === c.user_id) continue;
        push({ userId: u, type: "competency.escalation", title: "Escalation: skills reassessment overdue", body: `${c.employee_name}: ${c.competency} was due on ${c.next_due}.`, link: `/employees/${c.employee_id}`, dedupeKey: `comp-esc:${c.id}:${u}` });
      }
      s.escalations++;
    }
    s.competencyWarnings++;
  }
}
