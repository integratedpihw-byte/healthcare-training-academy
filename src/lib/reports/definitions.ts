/**
 * Report catalog (spec §15). Reports run inside the requesting user's tenant
 * transaction, so row-level security limits every report to the facilities, teams and
 * records the user may see. Each returns a uniform table for on-screen display and
 * CSV / Excel / PDF export.
 */
import { sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { evaluateCompliance, facilityScope } from "@/lib/compliance/service";
import { CATEGORY_LABELS, ITEM_LABEL, RULE_STATE_LABEL } from "@/lib/compliance/engine";
import { can, type Access } from "@/lib/rbac/access";
import type { PermissionKey } from "@/lib/rbac/catalog";
import { complianceFor, expirationsReport } from "@/lib/workforce/compliance";
import { COMPLIANCE_LABEL, addDays, todayIso } from "@/lib/workforce/rules";
import type { ReportResult } from "./export";
import { compensation } from "@/lib/instructors/compensation";
import { CERT_KIND } from "@/lib/certificates/labels";

const money = (cents: number | null) => (cents == null ? "—" : (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }));

export interface ReportCtx {
  tenantId: string;
  userId: string;
  access: Access;
}

export const paramsSchema = z.object({
  facilityId: z.string().uuid().optional().catch(undefined),
  employeeId: z.string().uuid().optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  days: z.coerce.number().int().min(1).max(730).optional().catch(undefined),
  year: z.coerce.number().int().min(2000).max(2100).optional().catch(undefined),
});
export type ReportParams = z.infer<typeof paramsSchema>;
export type ParamKey = keyof ReportParams;

export interface ReportDef {
  key: string;
  number: number;
  title: string;
  description: string;
  group: "Compliance" | "Training" | "Workforce" | "Business";
  params: ParamKey[];
  required?: ParamKey[];
  /** Extra permissions, any one of which is needed (in addition to reports.view). */
  anyOf?: PermissionKey[];
  run: (tx: Tx, ctx: ReportCtx, p: ReportParams) => Promise<ReportResult>;
}

const hours = (min: number | string | null) => (min == null ? 0 : Math.round((Number(min) / 60) * 100) / 100);
const range = (p: ReportParams) => {
  const to = p.to ?? todayIso();
  const from = p.from ?? addDays(to, -365);
  return { from, to };
};

async function scopedFacilities(tx: Tx, ctx: ReportCtx, facilityId?: string) {
  const all = (await tx.execute<{ id: string }>(sql`select id from facilities where tenant_id = ${ctx.tenantId}::uuid`)).rows.map((r) => r.id);
  const scope = facilityScope(ctx.access, "compliance.view", all) ?? all;
  return facilityId ? scope.filter((f) => f === facilityId) : scope;
}

export const REPORTS: ReportDef[] = [
  {
    key: "transcript",
    number: 1,
    title: "Employee training transcript",
    description: "Every course, exam, certificate, skills evaluation and license on record for one employee.",
    group: "Workforce",
    params: ["employeeId"],
    required: ["employeeId"],
    async run(tx, _ctx, p) {
      const [e] = (await tx.execute<{ id: string; name: string; number: string; title: string; user_id: string | null; hire: string }>(sql`select id, first_name || ' ' || last_name name, employee_number number, job_title title, user_id, hire_date::text hire from employees where id = ${p.employeeId!}::uuid`)).rows;
      if (!e) return { title: "Employee training transcript", columns: [], rows: [], notes: ["Employee not found or not visible to you."] };
      const rows = (
        await tx.execute<{ date: string; type: string; item: string; result: string; hours: number | null; reference: string | null; expires: string | null }>(sql`
        select * from (
          select en.completed_at::date::text date, 'Course' type, c.title item, 'Completed' result, c.estimated_minutes hours, cert.certificate_number reference, cert.expires_on::text expires
            from enrollments en join courses c on c.id = en.course_id left join certificates cert on cert.enrollment_id = en.id
           where en.user_id = ${e.user_id}::uuid and en.status = 'COMPLETED'
          union all
          select coalesce(en.started_at, en.created_at)::date::text, 'Course', c.title, initcap(replace(en.status::text, '_', ' ')), c.estimated_minutes, null, null
            from enrollments en join courses c on c.id = en.course_id
           where en.user_id = ${e.user_id}::uuid and en.status <> 'COMPLETED'
          union all
          select a.submitted_at::date::text, 'Exam attempt', c.title || ' (attempt ' || a.attempt_number || ')', case when a.passed then 'Passed ' else 'Not passed ' end || coalesce(a.score_pct::text || '%', ''), null, null, null
            from examination_attempts a join examinations x on x.id = a.examination_id join course_versions v on v.id = x.course_version_id join courses c on c.id = v.course_id
           where a.user_id = ${e.user_id}::uuid and a.submitted_at is not null
          union all
          select ca.assessed_on::text, 'Skills evaluation', k.name, ca.status::text || ' — ' || ca.result::text, null, null, ca.next_assessment_due::text
            from competency_assessments ca join competencies k on k.id = ca.competency_id where ca.employee_id = ${e.id}::uuid and ca.status <> 'DRAFT'
          union all
          select coalesce(l.issued_on, l.created_at::date)::text, 'License / certification', l.name || ' — ' || l.issuing_authority, l.verification_status::text, null, l.license_number, l.expires_on::text
            from licenses l where l.employee_id = ${e.id}::uuid
        ) t order by date desc nulls last`)
      ).rows;
      return {
        title: "Employee training transcript",
        subtitle: `${e.name} · ${e.number} · ${e.title} · hired ${e.hire}`,
        columns: [
          { key: "date", label: "Date" },
          { key: "type", label: "Type", width: 1.2 },
          { key: "item", label: "Item", width: 3 },
          { key: "result", label: "Result", width: 1.5 },
          { key: "hours", label: "Hours", width: 0.6 },
          { key: "reference", label: "Certificate / license no.", width: 1.4 },
          { key: "expires", label: "Expires / next due" },
        ],
        rows: rows.map((r) => ({ ...r, hours: r.type === "Course" && r.result === "Completed" ? hours(r.hours) : null })),
        notes: ["Course completion certificates are internal training records — not licenses, professional certifications or accredited continuing education. Completion does not establish clinical competency."],
      };
    },
  },
  {
    key: "facility-compliance",
    number: 2,
    title: "Facility training compliance",
    description: "Each employee's status against every regulation-mapped training requirement, by facility.",
    group: "Compliance",
    params: ["facilityId"],
    async run(tx, ctx, p) {
      const ev = await evaluateCompliance(tx, ctx.tenantId, { facilityIds: await scopedFacilities(tx, ctx, p.facilityId) });
      const rules = new Map(ev.facilities.flatMap((f) => f.rules.map((r) => [r.rule.id, r.rule])));
      return {
        title: "Facility training compliance",
        subtitle: `As of ${ev.today}`,
        columns: [
          { key: "facility", label: "Facility", width: 1.6 },
          { key: "employee", label: "Employee", width: 1.4 },
          { key: "requirement", label: "Requirement", width: 3 },
          { key: "citation", label: "Citation", width: 1.6 },
          { key: "status", label: "Status" },
          { key: "validUntil", label: "Valid until" },
          { key: "dueDate", label: "Due" },
        ],
        rows: ev.facilities.flatMap((f) =>
          f.items.map((i) => ({ facility: f.name, employee: i.employeeName, requirement: i.requirementTitle, citation: rules.get(i.ruleId)?.citation ?? "", status: ITEM_LABEL[i.status].label, validUntil: i.validUntil, dueDate: i.dueDate })),
        ),
        notes: ["Status reflects training records in the academy. Legal sufficiency of training is determined by the organization's compliance reviewer."],
      };
    },
  },
  {
    key: "org-compliance",
    number: 3,
    title: "Organization-wide compliance",
    description: "Compliance and completion percentages, gaps and items needing review for every facility.",
    group: "Compliance",
    params: [],
    async run(tx, ctx) {
      const ev = await evaluateCompliance(tx, ctx.tenantId, { facilityIds: await scopedFacilities(tx, ctx) });
      const row = (name: string, s: (typeof ev.org)) => ({ facility: name, rules: s.applicableRules, mapped: s.mapped, gaps: s.gaps, review: s.needsReview, items: s.items, good: s.good, overdue: s.overdue + s.missing, compliance: s.compliancePct == null ? "—" : `${s.compliancePct}%`, completion: s.completionPct == null ? "—" : `${s.completionPct}%` });
      return {
        title: "Organization-wide compliance",
        subtitle: `As of ${ev.today}`,
        columns: [
          { key: "facility", label: "Facility", width: 2 },
          { key: "rules", label: "Applicable rules", width: 0.8 },
          { key: "mapped", label: "Mapped", width: 0.7 },
          { key: "gaps", label: "Gaps", width: 0.6 },
          { key: "review", label: "Needs review", width: 0.8 },
          { key: "items", label: "Employee items", width: 0.8 },
          { key: "good", label: "In good standing", width: 0.9 },
          { key: "overdue", label: "Overdue / missing", width: 0.9 },
          { key: "compliance", label: "Compliance %", width: 0.8 },
          { key: "completion", label: "Completion %", width: 0.8 },
        ],
        rows: [...ev.facilities.map((f) => row(f.name, f.summary)), row("All facilities (deduplicated)", ev.org)],
        notes: ["Compliance % = items not overdue, expired or missing. Completion % = items with current completed training."],
      };
    },
  },
  {
    key: "mandatory-completion",
    number: 4,
    title: "Mandatory training completion",
    description: "Assignment completion for each organization training requirement (policy and regulation-mapped).",
    group: "Training",
    params: [],
    async run(tx, ctx) {
      const rows = (
        await tx.execute<{ title: string; source: string; citation: string | null; total: number; completed: number; in_progress: number; overdue: number; open: number }>(sql`
        select coalesce(q.title, c.title, k.name) title, q.source::text source, r.citation,
               count(a.id)::int total,
               count(a.id) filter (where a.status = 'COMPLETED')::int completed,
               count(a.id) filter (where a.status = 'IN_PROGRESS')::int in_progress,
               count(a.id) filter (where a.status = 'OVERDUE' or (a.status in ('ASSIGNED','IN_PROGRESS') and a.due_date < current_date))::int overdue,
               count(a.id) filter (where a.status in ('ASSIGNED','IN_PROGRESS','OVERDUE'))::int open
          from training_requirements q
          left join courses c on c.id = q.course_id left join competencies k on k.id = q.competency_id
          left join regulatory_rules r on r.id = q.regulatory_rule_id
          left join training_assignments a on a.requirement_id = q.id
         where q.tenant_id = ${ctx.tenantId}::uuid and q.is_active
         group by q.id, c.title, k.name, r.citation order by 1`)
      ).rows;
      return {
        title: "Mandatory training completion",
        columns: [
          { key: "title", label: "Requirement", width: 3 },
          { key: "source", label: "Basis", width: 1.2 },
          { key: "citation", label: "Citation", width: 1.5 },
          { key: "total", label: "Assigned", width: 0.7 },
          { key: "completed", label: "Completed", width: 0.7 },
          { key: "open", label: "Open", width: 0.6 },
          { key: "overdue", label: "Overdue", width: 0.6 },
          { key: "pct", label: "Completion %", width: 0.8 },
        ],
        rows: rows.map((r) => ({ ...r, source: r.source.replace("_", " ").toLowerCase(), pct: r.total ? `${Math.floor((r.completed / r.total) * 1000) / 10}%` : "—" })),
        notes: ["Skills-checklist requirements are tracked as evaluations, not assignments; see the Employee competency report."],
      };
    },
  },
  {
    key: "overdue",
    number: 5,
    title: "Overdue employee training",
    description: "Open assignments past their due date, oldest first.",
    group: "Training",
    params: ["facilityId"],
    async run(tx, _ctx, p) {
      const rows = (
        await tx.execute<{ employee: string; number: string; facility: string | null; supervisor: string | null; course: string; due: string; days: number; status: string }>(sql`
        select e.first_name || ' ' || e.last_name employee, e.employee_number number, f.name facility,
               (select s.first_name || ' ' || s.last_name from employees s where s.id = e.supervisor_id) supervisor,
               c.title course, a.due_date::text due, (current_date - a.due_date)::int days, a.status::text status
          from training_assignments a join employees e on e.id = a.employee_id join courses c on c.id = a.course_id left join facilities f on f.id = e.primary_facility_id
         where (a.status = 'OVERDUE' or (a.status in ('ASSIGNED','IN_PROGRESS') and a.due_date < current_date))
           ${p.facilityId ? sql`and exists (select 1 from employee_facilities ef where ef.employee_id = e.id and ef.facility_id = ${p.facilityId}::uuid)` : sql``}
         order by a.due_date asc`)
      ).rows;
      return {
        title: "Overdue employee training",
        columns: [
          { key: "employee", label: "Employee", width: 1.4 },
          { key: "number", label: "Employee ID", width: 0.8 },
          { key: "facility", label: "Facility", width: 1.5 },
          { key: "supervisor", label: "Supervisor", width: 1.2 },
          { key: "course", label: "Course", width: 2.5 },
          { key: "due", label: "Due" },
          { key: "days", label: "Days overdue", width: 0.7 },
        ],
        rows,
      };
    },
  },
  {
    key: "certificate-expiration",
    number: 6,
    title: "Certificate expiration",
    description: "Course certificates expired or expiring within the window.",
    group: "Training",
    params: ["days"],
    async run(tx, _ctx, p) {
      const r = await expirationsReport(tx, p.days ?? 90);
      return {
        title: "Certificate expiration",
        subtitle: `Expired or expiring within ${p.days ?? 90} days of ${r.today}`,
        columns: [
          { key: "recipient", label: "Employee", width: 1.5 },
          { key: "course", label: "Course", width: 3 },
          { key: "expires", label: "Expires" },
          { key: "status", label: "Status" },
        ],
        rows: r.certificates.map((c) => ({ recipient: c.recipient_name, course: c.course_title, expires: c.expires_on, status: c.expires_on < r.today ? "Expired" : "Expiring" })),
      };
    },
  },
  {
    key: "competency",
    number: 7,
    title: "Employee competency",
    description: "Latest signed skills evaluation per employee and skill, with reassessment dates.",
    group: "Workforce",
    params: ["facilityId"],
    async run(tx, _ctx, p) {
      const rows = (
        await tx.execute<{ employee: string; skill: string; result: string; assessed: string; evaluator: string | null; next_due: string | null }>(sql`
        select distinct on (ca.employee_id, ca.competency_id) e.first_name || ' ' || e.last_name employee, k.name skill, ca.result::text result,
               ca.assessed_on::text assessed, (select u.first_name || ' ' || u.last_name from users u where u.id = ca.evaluator_user_id) evaluator, ca.next_assessment_due::text next_due
          from competency_assessments ca join employees e on e.id = ca.employee_id join competencies k on k.id = ca.competency_id
         where ca.status = 'SIGNED' ${p.facilityId ? sql`and ca.facility_id = ${p.facilityId}::uuid` : sql``}
         order by ca.employee_id, ca.competency_id, ca.assessed_on desc, ca.signed_at desc`)
      ).rows;
      const today = todayIso();
      return {
        title: "Employee competency",
        columns: [
          { key: "employee", label: "Employee", width: 1.5 },
          { key: "skill", label: "Skill", width: 2 },
          { key: "result", label: "Result" },
          { key: "assessed", label: "Assessed" },
          { key: "evaluator", label: "Evaluator (signed)", width: 1.4 },
          { key: "next_due", label: "Reassessment due" },
          { key: "state", label: "Status" },
        ],
        rows: rows.map((r) => ({ ...r, result: r.result.replace("_", " ").toLowerCase(), state: r.next_due && r.next_due < today ? "Overdue" : "Current" })),
        notes: ["Competency is established only by signed practical evaluations — never by course completion."],
      };
    },
  },
  {
    key: "exam-results",
    number: 8,
    title: "Examination results",
    description: "Submitted exam attempts with scores and outcomes in the date range.",
    group: "Training",
    params: ["from", "to"],
    async run(tx, _ctx, p) {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ submitted: string; learner: string; course: string; attempt: number; score: number | null; passed: boolean | null; status: string }>(sql`
        select a.submitted_at::date::text submitted, u.first_name || ' ' || u.last_name learner, c.title course, a.attempt_number attempt, a.score_pct score, a.passed, a.grading_status::text status
          from examination_attempts a join users u on u.id = a.user_id join examinations x on x.id = a.examination_id
          join course_versions v on v.id = x.course_version_id join courses c on c.id = v.course_id
         where a.submitted_at is not null and a.submitted_at::date between ${from}::date and ${to}::date
         order by a.submitted_at desc`)
      ).rows;
      const passed = rows.filter((r) => r.passed).length;
      return {
        title: "Examination results",
        subtitle: `${from} to ${to} · ${rows.length} attempts · pass rate ${rows.length ? Math.round((passed / rows.length) * 100) : 0}%`,
        columns: [
          { key: "submitted", label: "Submitted" },
          { key: "learner", label: "Learner", width: 1.5 },
          { key: "course", label: "Course", width: 3 },
          { key: "attempt", label: "Attempt", width: 0.6 },
          { key: "score", label: "Score %", width: 0.6 },
          { key: "outcome", label: "Outcome" },
        ],
        rows: rows.map((r) => ({ submitted: r.submitted, learner: r.learner, course: r.course, attempt: r.attempt, score: r.score, outcome: r.status === "PENDING_INSTRUCTOR" ? "Awaiting grading" : r.passed ? "Passed" : "Not passed" })),
      };
    },
  },
  {
    key: "course-attendance",
    number: 9,
    title: "Course attendance",
    description: "Instructor-led and live virtual classes in the date range with registered, present, absent and excused counts.",
    group: "Training",
    params: ["facilityId", "from", "to"],
    async run(tx, _ctx, p) {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ date: string; class: string; course: string | null; instructor: string | null; facility: string | null; status: string; registered: number; present: number; absent: number; excused: number; rate: string }>(sql`
        select to_char(s.starts_at at time zone coalesce((select time_zone from organizations limit 1), 'America/New_York'), 'YYYY-MM-DD HH24:MI') date, s.title class, c.title course,
               (select u.first_name || ' ' || u.last_name from instructors i join users u on u.id = i.user_id where i.id = s.instructor_id) instructor,
               f.name facility, initcap(s.status::text) status,
               count(a.id)::int registered,
               count(a.id) filter (where a.status = 'PRESENT')::int present,
               count(a.id) filter (where a.status = 'ABSENT')::int absent,
               count(a.id) filter (where a.status = 'EXCUSED')::int excused,
               case when count(a.id) filter (where a.status in ('PRESENT','ABSENT')) = 0 then '—'
                    else round(100.0 * count(a.id) filter (where a.status = 'PRESENT') / count(a.id) filter (where a.status in ('PRESENT','ABSENT')))::text || '%' end rate
          from training_sessions s
          left join courses c on c.id = s.course_id
          left join facilities f on f.id = s.facility_id
          left join attendance a on a.session_id = s.id
         where (s.starts_at at time zone coalesce((select time_zone from organizations limit 1), 'America/New_York'))::date between ${from}::date and ${to}::date
           and (${p.facilityId ?? null}::uuid is null or s.facility_id = ${p.facilityId ?? null}::uuid)
         group by s.id, c.title, f.name order by s.starts_at`)
      ).rows;
      return {
        title: "Course attendance",
        subtitle: `${from} to ${to} (times in Eastern Time)`,
        columns: [
          { key: "date", label: "Date / time" },
          { key: "class", label: "Class", width: 2.2 },
          { key: "course", label: "Course", width: 2 },
          { key: "instructor", label: "Instructor", width: 1.3 },
          { key: "facility", label: "Facility", width: 1.3 },
          { key: "status", label: "Status", width: 0.9 },
          { key: "registered", label: "Registered", width: 0.7 },
          { key: "present", label: "Present", width: 0.6 },
          { key: "absent", label: "Absent", width: 0.6 },
          { key: "excused", label: "Excused", width: 0.6 },
          { key: "rate", label: "Attendance rate", width: 0.8 },
        ],
        rows,
        notes: ["Attendance rate = present ÷ (present + absent). Attending a class does not by itself establish clinical competency."],
      };
    },
  },
  {
    key: "instructor-activity",
    number: 10,
    title: "Instructor performance",
    description: "Classes taught, attendance, exam items graded, skills evaluations signed and learner ratings of assigned courses, per instructor or evaluator.",
    group: "Workforce",
    params: ["from", "to"],
    async run(tx, _ctx, p) {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ name: string; classes: number; attendance: string; graded: number; evaluations: number; rating: string; last: string | null }>(sql`
        with g as (select ea.graded_by_id uid, count(*)::int n, max(coalesce(a.graded_at, ea.saved_at)) last
                     from examination_answers ea join examination_attempts a on a.id = ea.attempt_id
                    where ea.graded_by_id is not null and coalesce(a.graded_at, ea.saved_at)::date between ${from}::date and ${to}::date group by ea.graded_by_id),
             s as (select evaluator_user_id uid, count(*)::int n, max(signed_at) last from competency_assessments
                    where status = 'SIGNED' and signed_at::date between ${from}::date and ${to}::date group by evaluator_user_id),
             k as (select i.user_id uid, count(distinct ts.id) filter (where ts.status = 'COMPLETED')::int n,
                          count(at.id) filter (where at.status = 'PRESENT')::int present,
                          count(at.id) filter (where at.status in ('PRESENT','ABSENT'))::int marked, max(ts.ends_at) last
                     from instructors i join training_sessions ts on ts.instructor_id = i.id left join attendance at on at.session_id = ts.id
                    where ts.starts_at::date between ${from}::date and ${to}::date group by i.user_id),
             r as (select i.user_id uid, round(avg(cr.rating)::numeric, 2) avg, count(cr.id)::int n
                     from instructors i join instructor_courses ic on ic.instructor_id = i.id join course_reviews cr on cr.course_id = ic.course_id group by i.user_id)
        select u.first_name || ' ' || u.last_name name, coalesce(k.n, 0) classes,
               case when coalesce(k.marked, 0) = 0 then '—' else round(100.0 * k.present / k.marked)::text || '%' end attendance,
               coalesce(g.n, 0) graded, coalesce(s.n, 0) evaluations,
               case when r.n is null then '—' else r.avg::text || ' (' || r.n || ')' end rating,
               greatest(g.last, s.last, k.last)::date::text last
          from users u left join g on g.uid = u.id left join s on s.uid = u.id left join k on k.uid = u.id left join r on r.uid = u.id
         where g.uid is not null or s.uid is not null or k.uid is not null or u.id in (select user_id from instructors)
         order by 2 desc, 4 desc, 5 desc`)
      ).rows;
      return {
        title: "Instructor performance",
        subtitle: `${from} to ${to}`,
        columns: [
          { key: "name", label: "Instructor / evaluator", width: 2 },
          { key: "classes", label: "Classes completed", width: 0.8 },
          { key: "attendance", label: "Attendance rate", width: 0.8 },
          { key: "graded", label: "Exam items graded", width: 0.8 },
          { key: "evaluations", label: "Skills evaluations signed", width: 0.9 },
          { key: "rating", label: "Avg. rating of assigned courses (n)", width: 1.2 },
          { key: "last", label: "Last activity" },
        ],
        rows,
        notes: ["Course ratings come from learner course evaluations (1–5) and reflect the course as a whole, not only the instructor."],
      };
    },
  },
  {
    key: "course-evaluations",
    number: 16,
    title: "Course evaluations",
    description: "Learner ratings (1–5) and comment counts for each course.",
    group: "Training",
    params: [],
    async run(tx) {
      const rows = (
        await tx.execute<{ course: string; code: string; n: number; avg: string; low: number; comments: number }>(sql`
        select c.title course, c.code, count(*)::int n, round(avg(r.rating)::numeric, 2)::text avg,
               count(*) filter (where r.rating <= 2)::int low, count(r.comment)::int comments
          from course_reviews r join courses c on c.id = r.course_id group by c.id order by 3 desc`)
      ).rows;
      return {
        title: "Course evaluations",
        columns: [
          { key: "course", label: "Course", width: 3 },
          { key: "code", label: "Code" },
          { key: "n", label: "Evaluations", width: 0.8 },
          { key: "avg", label: "Average rating", width: 0.8 },
          { key: "low", label: "Ratings of 1–2", width: 0.8 },
          { key: "comments", label: "With comments", width: 0.8 },
        ],
        rows,
        notes: ["Only learners who completed a course can evaluate it. Comments are shown to course administrators on the course page."],
      };
    },
  },
  {
    key: "annual-summary",
    number: 11,
    title: "Annual training summary",
    description: "Completions, learners and training hours by course for a calendar year.",
    group: "Training",
    params: ["year"],
    async run(tx, _ctx, p) {
      const year = p.year ?? Number(todayIso().slice(0, 4));
      const rows = (
        await tx.execute<{ course: string; code: string | null; completions: number; learners: number; minutes: number }>(sql`
        select c.title course, c.code, count(*)::int completions, count(distinct en.user_id)::int learners, sum(coalesce(c.estimated_minutes, 0))::int minutes
          from enrollments en join courses c on c.id = en.course_id
         where en.status = 'COMPLETED' and extract(year from en.completed_at) = ${year}
         group by c.id order by completions desc`)
      ).rows;
      const totalMin = rows.reduce((s, r) => s + r.minutes, 0);
      return {
        title: "Annual training summary",
        subtitle: `Calendar year ${year} · ${rows.reduce((s, r) => s + r.completions, 0)} completions · ${hours(totalMin)} training hours`,
        columns: [
          { key: "course", label: "Course", width: 3 },
          { key: "code", label: "Code" },
          { key: "completions", label: "Completions" },
          { key: "learners", label: "Learners" },
          { key: "hours", label: "Training hours" },
        ],
        rows: rows.map((r) => ({ course: r.course, code: r.code, completions: r.completions, learners: r.learners, hours: hours(r.minutes) })),
        notes: ["Training hours use each course's estimated duration."],
      };
    },
  },
  {
    key: "regulatory-audit",
    number: 12,
    title: "Regulatory audit report",
    description: "For each facility: applicable Florida/federal rules with citations, verification dates, your documented decisions, mapped training and current staff compliance.",
    group: "Compliance",
    params: ["facilityId"],
    async run(tx, ctx, p) {
      const ev = await evaluateCompliance(tx, ctx.tenantId, { facilityIds: await scopedFacilities(tx, ctx, p.facilityId) });
      const reqTitles = new Map((await tx.execute<{ id: string; title: string }>(sql`select q.id, coalesce(c.title, k.name) title from training_requirements q left join courses c on c.id = q.course_id left join competencies k on k.id = q.competency_id where q.tenant_id = ${ctx.tenantId}::uuid`)).rows.map((r) => [r.id, r.title]));
      const rows = ev.facilities.flatMap((f) =>
        f.rules.map((r) => {
          const its = f.items.filter((i) => i.ruleId === r.rule.id);
          const good = its.filter((i) => ["SATISFIED", "DUE_SOON", "PENDING"].includes(i.status)).length;
          return {
            facility: f.name,
            citation: r.rule.citation,
            agency: CATEGORY_LABELS[r.rule.category],
            requirement: r.rule.title,
            frequency: r.rule.frequencyText,
            verified: r.rule.lastVerifiedAt ? r.rule.lastVerifiedAt.toISOString().slice(0, 10) : "Not verified",
            state: RULE_STATE_LABEL[r.state].label + (r.reReview ? " (rule changed since decision)" : ""),
            decision: r.decision ? `${r.decision.decision.replace("_", " ").toLowerCase()} — ${r.decision.rationale} (${r.decision.createdAt.toISOString().slice(0, 10)})` : "No decision recorded",
            training: r.requirementIds.map((id) => reqTitles.get(id)).filter(Boolean).join("; ") || "—",
            staff: its.length ? `${good}/${its.length}` : "—",
          };
        }),
      );
      return {
        title: "Regulatory audit report",
        subtitle: `As of ${ev.today} · ${rows.length} rule applications`,
        columns: [
          { key: "facility", label: "Facility", width: 1.3 },
          { key: "citation", label: "Citation", width: 1.4 },
          { key: "agency", label: "Agency", width: 1 },
          { key: "requirement", label: "Requirement", width: 2 },
          { key: "frequency", label: "Frequency (per source)", width: 1.8 },
          { key: "verified", label: "Source verified", width: 0.8 },
          { key: "state", label: "Status", width: 1.2 },
          { key: "decision", label: "Organization decision", width: 2.2 },
          { key: "training", label: "Mapped training", width: 1.6 },
          { key: "staff", label: "Staff in good standing", width: 0.8 },
        ],
        rows,
        notes: [
          "Rules come from the platform regulatory library, compiled with AI-assisted research and verified against the cited sources on the dates shown. This report is not legal advice; a qualified compliance reviewer should confirm applicability.",
          "Where a legal deadline or frequency could not be verified, the rule is marked 'Needs review' and no frequency is asserted.",
        ],
      };
    },
  },
  {
    key: "hours-by-department",
    number: 13,
    title: "Training hours by department",
    description: "Completed training hours per department in the date range.",
    group: "Training",
    params: ["from", "to"],
    async run(tx, _ctx, p) {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ department: string | null; employees: number; completions: number; minutes: number }>(sql`
        select coalesce(dp.name, 'No department') department, count(distinct e.id)::int employees, count(en.id)::int completions, sum(coalesce(c.estimated_minutes, 0))::int minutes
          from enrollments en join employees e on e.user_id = en.user_id and e.tenant_id = en.tenant_id
          join courses c on c.id = en.course_id left join departments dp on dp.id = e.department_id
         where en.status = 'COMPLETED' and en.completed_at::date between ${from}::date and ${to}::date
         group by 1 order by 4 desc`)
      ).rows;
      return {
        title: "Training hours by department",
        subtitle: `${from} to ${to}`,
        columns: [
          { key: "department", label: "Department", width: 2 },
          { key: "employees", label: "Employees trained" },
          { key: "completions", label: "Completions" },
          { key: "hours", label: "Training hours" },
        ],
        rows: rows.map((r) => ({ department: r.department, employees: r.employees, completions: r.completions, hours: hours(r.minutes) })),
      };
    },
  },
  {
    key: "hours-by-employee",
    number: 14,
    title: "Training hours by employee",
    description: "Completed training hours per employee in the date range.",
    group: "Training",
    params: ["from", "to", "facilityId"],
    async run(tx, _ctx, p) {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ employee: string; number: string; title: string; completions: number; minutes: number }>(sql`
        select e.first_name || ' ' || e.last_name employee, e.employee_number number, e.job_title title, count(en.id)::int completions, coalesce(sum(c.estimated_minutes), 0)::int minutes
          from employees e
          left join enrollments en on en.user_id = e.user_id and en.tenant_id = e.tenant_id and en.status = 'COMPLETED' and en.completed_at::date between ${from}::date and ${to}::date
          left join courses c on c.id = en.course_id
         where e.employment_status <> 'TERMINATED'
           ${p.facilityId ? sql`and exists (select 1 from employee_facilities ef where ef.employee_id = e.id and ef.facility_id = ${p.facilityId}::uuid)` : sql``}
         group by e.id order by 5 desc, 1`)
      ).rows;
      return {
        title: "Training hours by employee",
        subtitle: `${from} to ${to}`,
        columns: [
          { key: "employee", label: "Employee", width: 1.6 },
          { key: "number", label: "Employee ID" },
          { key: "title", label: "Job title", width: 1.6 },
          { key: "completions", label: "Completions" },
          { key: "hours", label: "Training hours" },
        ],
        rows: rows.map((r) => ({ employee: r.employee, number: r.number, title: r.title, completions: r.completions, hours: hours(r.minutes) })),
        notes: ["Hours-based requirements (e.g. 12 in-service hours per year) can be checked against this report."],
      };
    },
  },
  {
    key: "onboarding",
    number: 15,
    title: "New employee onboarding compliance",
    description: "Employees hired in the window: onboarding evaluation, required assignments and status.",
    group: "Workforce",
    params: ["days"],
    async run(tx, _ctx, p) {
      const days = p.days ?? 90;
      const emps = (
        await tx.execute<{ id: string; employee: string; hire: string; title: string; account: boolean; run_on: string | null; total: number; completed: number; overdue: number }>(sql`
        select e.id, e.first_name || ' ' || e.last_name employee, e.hire_date::text hire, e.job_title title, e.user_id is not null account,
               (select max(r.created_at)::date::text from onboarding_runs r where r.employee_id = e.id) run_on,
               (select count(*)::int from training_assignments a where a.employee_id = e.id and a.status in ('ASSIGNED','IN_PROGRESS','OVERDUE','COMPLETED')) total,
               (select count(*)::int from training_assignments a where a.employee_id = e.id and a.status = 'COMPLETED') completed,
               (select count(*)::int from training_assignments a where a.employee_id = e.id and (a.status = 'OVERDUE' or (a.status in ('ASSIGNED','IN_PROGRESS') and a.due_date < current_date))) overdue
          from employees e where e.hire_date >= current_date - ${days}::int and e.employment_status <> 'TERMINATED' order by e.hire_date desc`)
      ).rows;
      const comp = await complianceFor(tx, emps.map((e) => e.id));
      return {
        title: "New employee onboarding compliance",
        subtitle: `Hired in the last ${days} days`,
        columns: [
          { key: "employee", label: "Employee", width: 1.5 },
          { key: "title", label: "Job title", width: 1.5 },
          { key: "hire", label: "Hired" },
          { key: "account", label: "Academy account" },
          { key: "run_on", label: "Onboarding evaluated" },
          { key: "progress", label: "Assignments completed" },
          { key: "overdue", label: "Overdue" },
          { key: "status", label: "Training status" },
        ],
        rows: emps.map((e) => ({ employee: e.employee, title: e.title, hire: e.hire, account: e.account ? "Yes" : "No", run_on: e.run_on ?? "Not run", progress: `${e.completed}/${e.total}`, overdue: e.overdue, status: COMPLIANCE_LABEL[comp.get(e.id)!.status].label })),
      };
    },
  },
  {
    key: "enrollment",
    number: 16,
    title: "Student enrollment",
    description: "Enrollments started in a period, by course, with current status and completion rate.",
    group: "Training",
    params: ["from", "to"],
    run: async (tx, _ctx, p) => {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ course: string; code: string; enrolled: number; in_progress: number; completed: number; failed: number; withdrawn: number }>(sql`
          select c.title course, c.code, count(*)::int enrolled,
                 count(*) filter (where e.status in ('NOT_STARTED','IN_PROGRESS','AWAITING_ASSESSMENT'))::int in_progress,
                 count(*) filter (where e.status = 'COMPLETED')::int completed,
                 count(*) filter (where e.status = 'FAILED')::int failed,
                 count(*) filter (where e.status = 'WITHDRAWN')::int withdrawn
            from enrollments e join courses c on c.id = e.course_id
           where e.created_at >= ${from}::date and e.created_at < (${to}::date + 1)
           group by c.title, c.code order by enrolled desc, c.title`)
      ).rows;
      const total = rows.reduce((s, r) => s + r.enrolled, 0);
      return {
        title: "Student enrollment",
        subtitle: `${from} to ${to} · ${total} enrollments`,
        columns: [
          { key: "course", label: "Course", width: 3 },
          { key: "code", label: "Code" },
          { key: "enrolled", label: "Enrolled", width: 0.7 },
          { key: "in_progress", label: "In progress", width: 0.8 },
          { key: "completed", label: "Completed", width: 0.8 },
          { key: "failed", label: "Not passed", width: 0.7 },
          { key: "withdrawn", label: "Withdrawn", width: 0.7 },
          { key: "rate", label: "Completion %", width: 0.8 },
        ],
        rows: rows.map((r) => ({ ...r, rate: r.enrolled ? Math.round((r.completed / r.enrolled) * 100) : 0 })),
      };
    },
  },
  {
    key: "certificates-issued",
    number: 17,
    title: "Certificates issued",
    description: "Every certificate issued in a period, by type, with its current status.",
    group: "Training",
    params: ["from", "to"],
    run: async (tx, _ctx, p) => {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ issued: string; recipient: string; kind: string; course: string; number: string; hours: string; status: string; expires: string | null }>(sql`
          select issued_at::date::text issued, recipient_name recipient, kind::text kind, course_title course, certificate_number number, training_hours::text hours,
                 case when status = 'ACTIVE' and expires_on < current_date then 'EXPIRED' else status::text end status, expires_on::text expires
            from certificates where issued_at >= ${from}::date and issued_at < (${to}::date + 1) order by issued_at desc`)
      ).rows;
      return {
        title: "Certificates issued",
        subtitle: `${from} to ${to} · ${rows.length} certificates`,
        columns: [
          { key: "issued", label: "Issued" },
          { key: "recipient", label: "Recipient", width: 1.5 },
          { key: "kind", label: "Type", width: 1.2 },
          { key: "course", label: "Course or skill", width: 2.5 },
          { key: "number", label: "Certificate no.", width: 1.4 },
          { key: "hours", label: "Hours", width: 0.6 },
          { key: "status", label: "Status" },
          { key: "expires", label: "Expires" },
        ],
        rows: rows.map((r) => ({ ...r, kind: CERT_KIND[r.kind] ?? r.kind, expires: r.expires ?? "—" })),
      };
    },
  },
  {
    key: "student-retention",
    number: 18,
    title: "Student retention",
    description: "Whether learners who start a course finish it: active, inactive for 30+ days, completed and withdrawn.",
    group: "Training",
    params: ["from", "to"],
    run: async (tx, _ctx, p) => {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ course: string; started: number; completed: number; active: number; stalled: number; withdrawn: number }>(sql`
          select c.title course, count(*)::int started,
                 count(*) filter (where e.status = 'COMPLETED')::int completed,
                 count(*) filter (where e.status in ('IN_PROGRESS','AWAITING_ASSESSMENT') and e.updated_at >= now() - interval '30 days')::int active,
                 count(*) filter (where e.status in ('NOT_STARTED','IN_PROGRESS','AWAITING_ASSESSMENT') and e.updated_at < now() - interval '30 days')::int stalled,
                 count(*) filter (where e.status in ('WITHDRAWN','FAILED'))::int withdrawn
            from enrollments e join courses c on c.id = e.course_id
           where e.created_at >= ${from}::date and e.created_at < (${to}::date + 1)
           group by c.title order by started desc`)
      ).rows;
      return {
        title: "Student retention",
        subtitle: `Enrollments started ${from} to ${to}`,
        columns: [
          { key: "course", label: "Course", width: 3 },
          { key: "started", label: "Started", width: 0.7 },
          { key: "completed", label: "Completed", width: 0.8 },
          { key: "active", label: "Active (30 days)", width: 0.9 },
          { key: "stalled", label: "Inactive 30+ days", width: 0.9 },
          { key: "withdrawn", label: "Withdrawn / not passed", width: 1 },
          { key: "retention", label: "Retention %", width: 0.8 },
        ],
        rows: rows.map((r) => ({ ...r, retention: r.started ? Math.round(((r.completed + r.active) / r.started) * 100) : 0 })),
        notes: ["Retention % = (completed + active in the last 30 days) ÷ started."],
      };
    },
  },
  {
    key: "course-effectiveness",
    number: 19,
    title: "Course effectiveness",
    description: "Completion, first-attempt exam pass rate, average score and learner ratings per course.",
    group: "Training",
    params: ["from", "to"],
    run: async (tx, _ctx, p) => {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ course: string; code: string; completions: number; attempts: number; first_pass: number; first_total: number; avg_score: number | null; rating: number | null; ratings: number }>(sql`
          select c.title course, c.code,
                 (select count(*)::int from enrollments e where e.course_id = c.id and e.status = 'COMPLETED' and e.completed_at >= ${from}::date and e.completed_at < (${to}::date + 1)) completions,
                 count(a.id)::int attempts,
                 count(a.id) filter (where a.attempt_number = 1 and a.passed)::int first_pass,
                 count(a.id) filter (where a.attempt_number = 1)::int first_total,
                 round(avg(a.score_pct))::int avg_score,
                 (select round(avg(r.rating)::numeric, 1)::float from course_reviews r where r.course_id = c.id) rating,
                 (select count(*)::int from course_reviews r where r.course_id = c.id) ratings
            from courses c
            join enrollments en on en.course_id = c.id
            left join examination_attempts a on a.enrollment_id = en.id and a.submitted_at >= ${from}::date and a.submitted_at < (${to}::date + 1)
           group by c.id, c.title, c.code
          having count(a.id) > 0 or (select count(*) from enrollments e where e.course_id = c.id and e.status = 'COMPLETED') > 0
           order by c.title`)
      ).rows;
      return {
        title: "Course effectiveness",
        subtitle: `${from} to ${to}`,
        columns: [
          { key: "course", label: "Course", width: 3 },
          { key: "code", label: "Code" },
          { key: "completions", label: "Completions", width: 0.8 },
          { key: "attempts", label: "Exam attempts", width: 0.8 },
          { key: "first", label: "First-attempt pass %", width: 1 },
          { key: "avg_score", label: "Average score %", width: 0.9 },
          { key: "rating", label: "Learner rating (n)", width: 1 },
        ],
        rows: rows.map((r) => ({ course: r.course, code: r.code, completions: r.completions, attempts: r.attempts, first: r.first_total ? Math.round((r.first_pass / r.first_total) * 100) : "—", avg_score: r.avg_score ?? "—", rating: r.rating != null ? `${r.rating} (${r.ratings})` : "—" })),
      };
    },
  },
  {
    key: "training-purchases",
    anyOf: ["billing.view"],
    number: 20,
    title: "Training purchases",
    description: "Course and package orders placed by your organization, with payment and refund status.",
    group: "Business",
    params: ["from", "to"],
    run: async (tx, _ctx, p) => {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ date: string; item: string; quantity: number; subtotal: number; discount: number; total: number; refunded: number; status: string; method: string; promo: string | null }>(sql`
          select created_at::date::text date, item_name item, quantity, subtotal_cents subtotal, discount_cents discount, total_cents total, refunded_cents refunded, status, payment_method method, promo_code promo
            from course_orders where created_at >= ${from}::date and created_at < (${to}::date + 1) order by created_at desc`)
      ).rows;
      return {
        title: "Training purchases",
        subtitle: `${from} to ${to} · ${rows.length} orders`,
        columns: [
          { key: "date", label: "Date" },
          { key: "item", label: "Item", width: 3 },
          { key: "quantity", label: "Seats", width: 0.6 },
          { key: "subtotal", label: "Subtotal", width: 0.8 },
          { key: "discount", label: "Discount", width: 0.8 },
          { key: "total", label: "Total", width: 0.8 },
          { key: "refunded", label: "Refunded", width: 0.8 },
          { key: "status", label: "Status" },
          { key: "method", label: "Payment" },
          { key: "promo", label: "Promo code" },
        ],
        rows: rows.map((r) => ({ ...r, subtotal: money(r.subtotal), discount: money(r.discount), total: money(r.total), refunded: money(r.refunded), promo: r.promo ?? "—" })),
      };
    },
  },
  {
    key: "revenue-by-course",
    anyOf: ["billing.view"],
    number: 21,
    title: "Training spend by course",
    description: "Net amount paid per course or package (after refunds), seats bought and seats used.",
    group: "Business",
    params: ["from", "to"],
    run: async (tx, _ctx, p) => {
      const { from, to } = range(p);
      const rows = (
        await tx.execute<{ item: string; orders: number; seats: number; net: number }>(sql`
          select item_name item, count(*)::int orders, sum(quantity)::int seats, sum(total_cents - refunded_cents)::int net
            from course_orders where status in ('PAID','PARTIALLY_REFUNDED','REFUNDED') and paid_at >= ${from}::date and paid_at < (${to}::date + 1)
           group by item_name order by net desc`)
      ).rows;
      return {
        title: "Training spend by course",
        subtitle: `${from} to ${to} · ${money(rows.reduce((s, r) => s + r.net, 0))} net`,
        columns: [
          { key: "item", label: "Course or package", width: 3 },
          { key: "orders", label: "Orders", width: 0.7 },
          { key: "seats", label: "Seats bought", width: 0.8 },
          { key: "net", label: "Net paid", width: 0.9 },
        ],
        rows: rows.map((r) => ({ ...r, net: money(r.net) })),
      };
    },
  },
  {
    key: "employer-sponsored",
    anyOf: ["billing.view"],
    number: 22,
    title: "Employer-sponsored seats",
    description: "Seats your organization has paid for, by course: purchased, used and remaining.",
    group: "Business",
    params: [],
    run: async (tx) => {
      const rows = (
        await tx.execute<{ course: string; code: string; total: number; used: number; expires: string | null; revoked: boolean }>(sql`
          select c.title course, c.code, sum(e.seats_total)::int total,
                 sum((select count(*) from entitlement_uses u where u.entitlement_id = e.id))::int used,
                 min(e.expires_at)::date::text expires, bool_and(e.revoked_at is not null) revoked
            from course_entitlements e join courses c on c.id = e.course_id group by c.title, c.code order by c.title`)
      ).rows;
      return {
        title: "Employer-sponsored seats",
        columns: [
          { key: "course", label: "Course", width: 3 },
          { key: "code", label: "Code" },
          { key: "total", label: "Purchased", width: 0.8 },
          { key: "used", label: "Used", width: 0.7 },
          { key: "left", label: "Remaining", width: 0.8 },
          { key: "expires", label: "Earliest expiry" },
        ],
        rows: rows.map((r) => ({ course: r.course, code: r.code, total: r.total, used: r.used, left: r.revoked ? 0 : r.total - r.used, expires: r.expires ?? "No expiry" })),
      };
    },
  },
  {
    key: "instructor-compensation",
    anyOf: ["billing.view", "instructors.manage"],
    number: 23,
    title: "Instructor compensation",
    description: "Calculated amounts owed to instructors for completed classes, using the rate in effect on each class date.",
    group: "Business",
    params: ["from", "to"],
    run: async (tx, _ctx, p) => {
      const { from, to } = range(p);
      const rows = await compensation(tx, from, to);
      return {
        title: "Instructor compensation",
        subtitle: `Completed classes ${from} to ${to}`,
        columns: [
          { key: "instructor", label: "Instructor", width: 2 },
          { key: "sessions", label: "Classes", width: 0.7 },
          { key: "hours", label: "Hours taught", width: 0.8 },
          { key: "learners", label: "Learners present", width: 0.9 },
          { key: "basis", label: "Rate basis", width: 1.6 },
          { key: "amount", label: "Amount", width: 0.9 },
        ],
        rows: rows.map((r) => ({ instructor: r.instructor, sessions: r.sessions, hours: r.hours, learners: r.learners, basis: r.basis, amount: money(r.amountCents) })),
        notes: ["Rates are visible only to people who manage instructors or view billing. Amounts are calculated, not paid, by the academy."],
      };
    },
  },
];

export function reportAllowed(def: ReportDef, access: Access | null) {
  return !def.anyOf || def.anyOf.some((perm) => can(access, perm));
}

export function getReport(key: string) {
  return REPORTS.find((r) => r.key === key) ?? null;
}

