/**
 * Compliance Center services (spec §11, §14, §15).
 *
 * All queries filter by tenant explicitly (in addition to RLS), so the same
 * evaluation runs inside a tenant transaction or on the platform client for the
 * daily snapshot job.
 */
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db, Tx } from "@/db/client";
import {
  competencies,
  complianceSnapshots,
  courses,
  facilities,
  regulatoryRuleVersions,
  regulatoryRules,
  regulatorySources,
  tenantRuleDecisions,
  trainingRequirements,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { can, type Access } from "@/lib/rbac/access";
import type { ServiceResult } from "@/lib/tenancy/service";
import { requirementApplies, todayIso } from "@/lib/workforce/rules";
import {
  COMPLETE,
  GOOD,
  competencyItemStatus,
  courseItemStatus,
  needsReReview,
  pct,
  ruleAppliesToEmployee,
  ruleAppliesToFacility,
  ruleState,
  type Decision,
  type FacilityFacts,
  type ItemStatus,
  type RuleFacts,
  type RuleState,
} from "./engine";

type DbLike = Db | Tx;
export interface Ctx {
  tenantId: string;
  userId: string;
  access: Access;
}
const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });

export type RuleRow = typeof regulatoryRules.$inferSelect;

export interface FacilityRule {
  rule: RuleRow;
  state: RuleState;
  decision: (Decision & { rationale: string; createdAt: Date; facilityId: string | null }) | null;
  requirementIds: string[];
  reReview: boolean;
}
export interface ComplianceItem {
  employeeId: string;
  employeeName: string;
  ruleId: string;
  requirementId: string;
  requirementTitle: string;
  status: ItemStatus;
  validUntil: string | null;
  dueDate: string | null;
}
export interface Summary {
  applicableRules: number;
  mapped: number;
  gaps: number;
  needsReview: number;
  notApplicable: number;
  informational: number;
  items: number;
  good: number;
  complete: number;
  overdue: number;
  missing: number;
  compliancePct: number | null;
  completionPct: number | null;
}
export interface FacilityCompliance {
  id: string;
  name: string;
  facilityType: string;
  rules: FacilityRule[];
  items: ComplianceItem[];
  summary: Summary;
}

function summarize(rules: FacilityRule[], items: ComplianceItem[]): Summary {
  const count = (s: RuleState) => rules.filter((r) => r.state === s).length;
  const good = items.filter((i) => GOOD.includes(i.status)).length;
  const complete = items.filter((i) => COMPLETE.includes(i.status)).length;
  return {
    applicableRules: rules.length,
    mapped: count("MAPPED"),
    gaps: count("GAP"),
    needsReview: count("NEEDS_REVIEW"),
    notApplicable: count("NOT_APPLICABLE"),
    informational: count("INFORMATIONAL") + count("NO_STAFF"),
    items: items.length,
    good,
    complete,
    overdue: items.filter((i) => i.status === "OVERDUE" || i.status === "EXPIRED").length,
    missing: items.filter((i) => i.status === "MISSING").length,
    compliancePct: pct(good, items.length),
    completionPct: pct(complete, items.length),
  };
}

export async function loadRules(db: DbLike, opts: { includeInactive?: boolean } = {}) {
  return db
    .select()
    .from(regulatoryRules)
    .where(opts.includeInactive ? undefined : eq(regulatoryRules.isActive, true))
    .orderBy(asc(regulatoryRules.jurisdiction), asc(regulatoryRules.category), asc(regulatoryRules.citation));
}

async function latestDecisions(db: DbLike, tenantId: string) {
  const rows = await db.execute<{ rule_id: string; facility_id: string | null; decision: Decision["decision"]; rule_version: number; rationale: string; created_at: Date }>(sql`
    select distinct on (rule_id, facility_id) rule_id, facility_id, decision::text decision, rule_version, rationale, created_at
      from tenant_rule_decisions where tenant_id = ${tenantId}::uuid
     order by rule_id, facility_id, created_at desc`);
  const map = new Map<string, FacilityRule["decision"]>();
  for (const r of rows.rows) map.set(`${r.rule_id}:${r.facility_id ?? "org"}`, { decision: r.decision, ruleVersion: r.rule_version, rationale: r.rationale, createdAt: new Date(r.created_at), facilityId: r.facility_id });
  return map;
}

export async function evaluateCompliance(db: DbLike, tenantId: string, opts: { facilityIds?: string[] | null; today?: string } = {}): Promise<{ today: string; facilities: FacilityCompliance[]; org: Summary; employeeStatus: Map<string, { name: string; bad: number; total: number }> }> {
  const today = opts.today ?? todayIso();
  const facs = (
    await db
      .select({ id: facilities.id, name: facilities.name, facilityType: facilities.facilityType, state: facilities.state, licenseType: facilities.licenseType, designations: facilities.designations })
      .from(facilities)
      .where(and(eq(facilities.tenantId, tenantId), eq(facilities.isActive, true)))
      .orderBy(asc(facilities.name))
  ).filter((f) => !opts.facilityIds || opts.facilityIds.includes(f.id));
  const rules = await loadRules(db);
  const decisions = await latestDecisions(db, tenantId);
  const reqs = await db
    .select()
    .from(trainingRequirements)
    .where(and(eq(trainingRequirements.tenantId, tenantId), eq(trainingRequirements.isActive, true), sql`${trainingRequirements.regulatoryRuleId} is not null`));
  const emps = (
    await db.execute<{ id: string; name: string; user_id: string | null; position_code: string; job_duties: string[]; clinical_exposure: boolean; bloodborne_exposure: boolean; facility_ids: string[] }>(sql`
      select e.id, e.first_name || ' ' || e.last_name name, e.user_id, e.position_code, e.job_duties, e.clinical_exposure, e.bloodborne_exposure,
             array(select ef.facility_id from employee_facilities ef where ef.employee_id = e.id) facility_ids
        from employees e where e.tenant_id = ${tenantId}::uuid and e.employment_status <> 'TERMINATED'`)
  ).rows;
  const courseIds = [...new Set(reqs.map((r) => r.courseId).filter((x): x is string => !!x))];
  const completions = new Map<string, { completedOn: string; certStatus: string | null; certExpires: string | null }>();
  if (courseIds.length) {
    const rows = await db.execute<{ user_id: string; course_id: string; completed_on: string; status: string | null; expires_on: string | null }>(sql`
      select distinct on (en.user_id, en.course_id) en.user_id, en.course_id, en.completed_at::date::text completed_on, c.status::text status, c.expires_on::text expires_on
        from enrollments en left join certificates c on c.enrollment_id = en.id
       where en.tenant_id = ${tenantId}::uuid and en.status = 'COMPLETED' and en.course_id in (${sql.join(courseIds.map((c) => sql`${c}::uuid`), sql`, `)})
       order by en.user_id, en.course_id, en.completed_at desc`);
    for (const r of rows.rows) completions.set(`${r.user_id}:${r.course_id}`, { completedOn: r.completed_on, certStatus: r.status, certExpires: r.expires_on });
  }
  const open = new Map<string, { dueDate: string | null; status: string }>();
  for (const r of (
    await db.execute<{ employee_id: string; course_id: string; due_date: string | null; status: string }>(sql`
      select employee_id, course_id, due_date::text due_date, status::text status from training_assignments
       where tenant_id = ${tenantId}::uuid and status in ('ASSIGNED','IN_PROGRESS','OVERDUE')`)
  ).rows)
    open.set(`${r.employee_id}:${r.course_id}`, { dueDate: r.due_date, status: r.status });
  const comp = new Map<string, { result: string; nextDue: string | null }>();
  for (const r of (
    await db.execute<{ employee_id: string; competency_id: string; result: string; next_due: string | null }>(sql`
      select distinct on (employee_id, competency_id) employee_id, competency_id, result::text result, next_assessment_due::text next_due
        from competency_assessments where tenant_id = ${tenantId}::uuid and status = 'SIGNED'
       order by employee_id, competency_id, assessed_on desc, signed_at desc`)
  ).rows)
    comp.set(`${r.employee_id}:${r.competency_id}`, { result: r.result, nextDue: r.next_due });

  const out: FacilityCompliance[] = [];
  const orgItems = new Map<string, ComplianceItem>();
  const orgRules = new Map<string, FacilityRule>();
  for (const f of facs) {
    const ff: FacilityFacts = { state: f.state, facilityType: f.facilityType, tags: [f.licenseType, ...f.designations].filter((x): x is string => !!x) };
    const fRules: FacilityRule[] = [];
    const items: ComplianceItem[] = [];
    for (const r of rules) {
      if (!ruleAppliesToFacility(r as RuleFacts, ff)) continue;
      const decision = decisions.get(`${r.id}:${f.id}`) ?? decisions.get(`${r.id}:org`) ?? null;
      const mapped = reqs.filter((q) => q.regulatoryRuleId === r.id);
      const staffInScope = emps.filter(
        (e) => e.facility_ids.includes(f.id) && ruleAppliesToEmployee(r as RuleFacts, ff, { positionCode: e.position_code, jobDuties: e.job_duties, clinicalExposure: e.clinical_exposure, bloodborneExposure: e.bloodborne_exposure }),
      ).length;
      const state = ruleState(r, decision, mapped.length > 0, staffInScope);
      const fr: FacilityRule = { rule: r, state, decision, requirementIds: mapped.map((m) => m.id), reReview: needsReReview(decision, r.version) };
      fRules.push(fr);
      if (!orgRules.has(r.id) || orgRules.get(r.id)!.state === "NOT_APPLICABLE") orgRules.set(r.id, fr);
      if (state === "NOT_APPLICABLE" || !mapped.length) continue;
      for (const e of emps) {
        if (!e.facility_ids.includes(f.id)) continue;
        const ef = { positionCode: e.position_code, jobDuties: e.job_duties, clinicalExposure: e.clinical_exposure, bloodborneExposure: e.bloodborne_exposure };
        if (!ruleAppliesToEmployee(r as RuleFacts, ff, ef)) continue;
        for (const q of mapped) {
          if (!requirementApplies(q, { ...ef, facilityTypes: [f.facilityType], facilityLicenseTypes: ff.tags })) continue;
          let status: ItemStatus;
          let validUntil: string | null = null;
          let dueDate: string | null = null;
          if (q.competencyId) {
            status = competencyItemStatus(comp.get(`${e.id}:${q.competencyId}`) ?? null, today);
            validUntil = comp.get(`${e.id}:${q.competencyId}`)?.nextDue ?? null;
          } else {
            const c = e.user_id ? completions.get(`${e.user_id}:${q.courseId}`) : undefined;
            const oa = open.get(`${e.id}:${q.courseId}`) ?? null;
            const s = courseItemStatus({ completedOn: c?.completedOn ?? null, certificateStatus: c?.certStatus ?? null, certificateExpiresOn: c?.certExpires ?? null, frequencyMonths: q.frequencyMonths, openAssignment: oa }, today);
            status = s.status;
            validUntil = s.validUntil;
            dueDate = oa?.dueDate ?? null;
          }
          const item: ComplianceItem = { employeeId: e.id, employeeName: e.name, ruleId: r.id, requirementId: q.id, requirementTitle: q.title ?? r.title, status, validUntil, dueDate };
          if (!items.some((i) => i.employeeId === e.id && i.requirementId === q.id)) items.push(item);
          orgItems.set(`${e.id}:${q.id}`, item);
        }
      }
    }
    out.push({ id: f.id, name: f.name, facilityType: f.facilityType, rules: fRules, items, summary: summarize(fRules, items) });
  }
  const employeeStatus = new Map<string, { name: string; bad: number; total: number }>();
  for (const i of orgItems.values()) {
    const s = employeeStatus.get(i.employeeId) ?? { name: i.employeeName, bad: 0, total: 0 };
    s.total++;
    if (!GOOD.includes(i.status)) s.bad++;
    employeeStatus.set(i.employeeId, s);
  }
  return { today, facilities: out, org: summarize([...orgRules.values()], [...orgItems.values()]), employeeStatus };
}

/** Facilities the user may view compliance for. */
export function facilityScope(access: Access, perm: "compliance.view" | "compliance.manage" = "compliance.view", allFacilityIds: string[]): string[] | null {
  if (can(access, perm, null)) return null;
  return allFacilityIds.filter((id) => can(access, perm, id));
}

// ---------------------------------------------------------------------------
// Decisions and mappings
// ---------------------------------------------------------------------------

export const decisionSchema = z.object({
  ruleId: z.string().uuid(),
  facilityId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
  decision: z.enum(["APPLICABLE", "NOT_APPLICABLE", "UNDER_REVIEW"]),
  rationale: z.string().trim().min(10, "Explain the basis for this decision (10+ characters)").max(2000),
});

export async function recordDecision(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = decisionSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  if (!can(ctx.access, "compliance.manage", v.facilityId)) return err(v.facilityId ? "You do not manage compliance for that facility." : "Organization-wide decisions require organization-level compliance permission.");
  const [rule] = await tx.select({ id: regulatoryRules.id, version: regulatoryRules.version }).from(regulatoryRules).where(and(eq(regulatoryRules.id, v.ruleId), eq(regulatoryRules.isActive, true)));
  if (!rule) return err("Rule not found.");
  try {
    const [row] = await tx.insert(tenantRuleDecisions).values({ tenantId: ctx.tenantId, ruleId: v.ruleId, facilityId: v.facilityId, decision: v.decision, rationale: v.rationale, ruleVersion: rule.version, decidedById: ctx.userId }).returning({ id: tenantRuleDecisions.id });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "compliance.decision_recorded", entityType: "regulatory_rule", entityId: v.ruleId, after: { decision: v.decision, facilityId: v.facilityId, ruleVersion: rule.version, rationale: v.rationale } });
    return { ok: true, data: { id: row.id } };
  } catch {
    return err("You are not authorized to record this decision.");
  }
}

export const mappingSchema = z
  .object({
    ruleId: z.string().uuid(),
    target: z.enum(["course", "competency"]),
    courseId: z.string().uuid().optional().or(z.literal("")),
    competencyId: z.string().uuid().optional().or(z.literal("")),
    dueWithinDaysOfHire: z.union([z.literal(""), z.coerce.number().int().min(0).max(730)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    frequencyMonths: z.union([z.literal(""), z.coerce.number().int().min(1).max(120)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    notes: z.string().trim().max(2000).optional().or(z.literal("")).transform((v) => v || null),
  })
  .superRefine((v, c) => {
    if (v.target === "course" && !v.courseId) c.addIssue({ code: "custom", path: ["courseId"], message: "Choose a course" });
    if (v.target === "competency" && !v.competencyId) c.addIssue({ code: "custom", path: ["competencyId"], message: "Choose a skills checklist" });
  });

/**
 * Maps a regulatory rule to a course or skills checklist by creating an organization
 * training requirement that cites the rule. Applicability is copied from the rule.
 * The rule's frequency and initial window are used only when verified; requirements
 * for unverified rules are created "for review" so onboarding does not auto-assign.
 */
export async function mapRuleToTraining(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = mappingSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  if (!can(ctx.access, "compliance.manage") || !can(ctx.access, "training.requirements.manage")) return err("Mapping rules requires compliance and training-requirement management permissions.");
  const [rule] = await tx.select().from(regulatoryRules).where(and(eq(regulatoryRules.id, v.ruleId), eq(regulatoryRules.isActive, true)));
  if (!rule) return err("Rule not found.");
  if (v.target === "course") {
    const [c] = await tx.select({ status: courses.status }).from(courses).where(eq(courses.id, v.courseId!));
    if (!c) return err("Course not found.");
    if (c.status !== "PUBLISHED") return err("Only published courses can be mapped.");
  } else {
    const [c] = await tx.select({ id: competencies.id }).from(competencies).where(eq(competencies.id, v.competencyId!));
    if (!c) return err("Skills checklist not found.");
  }
  const verified = rule.complianceStatus === "VERIFIED";
  const values = {
    tenantId: ctx.tenantId,
    title: `${rule.citation} — ${rule.title}`.slice(0, 200),
    courseId: v.target === "course" ? v.courseId! : null,
    competencyId: v.target === "competency" ? v.competencyId! : null,
    regulatoryRuleId: rule.id,
    source: rule.jurisdiction === "FEDERAL" ? ("FEDERAL_REGULATION" as const) : ("STATE_REGULATION" as const),
    facilityTypes: rule.facilityTypes,
    facilityLicenseTypes: rule.facilityLicenseTypes,
    positionCodes: rule.positionCodes,
    jobDuties: rule.jobDuties,
    requiresClinicalExposure: rule.requiresClinicalExposure,
    requiresBloodborneExposure: rule.requiresBloodborneExposure,
    frequencyMonths: v.frequencyMonths ?? (rule.frequencyVerified ? rule.frequencyMonths : null),
    dueWithinDaysOfHire: v.dueWithinDaysOfHire ?? (verified ? rule.initialDueDaysFromHire : null),
    needsAdminReview: !verified || !["TRAINING_MANDATE", "COMPETENCY_ASSESSMENT", "PROGRAM_REQUIREMENT"].includes(rule.kind),
    notes: v.notes ?? `Implements ${rule.citation}. ${rule.frequencyText ?? ""}`.trim(),
  };
  try {
    const [row] = await tx.insert(trainingRequirements).values(values).returning({ id: trainingRequirements.id });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "compliance.rule_mapped", entityType: "training_requirement", entityId: row.id, after: { ruleId: rule.id, ruleVersion: rule.version, courseId: values.courseId, competencyId: values.competencyId, frequencyMonths: values.frequencyMonths, dueWithinDaysOfHire: values.dueWithinDaysOfHire, needsAdminReview: values.needsAdminReview } });
    return { ok: true, data: { id: row.id } };
  } catch {
    return err("You are not authorized to create training requirements.");
  }
}

export async function getRuleDetail(tx: Tx, tenantId: string, ruleId: string) {
  const [row] = await tx.select({ rule: regulatoryRules, source: regulatorySources }).from(regulatoryRules).innerJoin(regulatorySources, eq(regulatorySources.id, regulatoryRules.sourceId)).where(eq(regulatoryRules.id, ruleId));
  if (!row) return null;
  const versions = await tx.select().from(regulatoryRuleVersions).where(eq(regulatoryRuleVersions.ruleId, ruleId)).orderBy(desc(regulatoryRuleVersions.version));
  const decisions = await tx.execute<{ id: string; facility_id: string | null; facility_name: string | null; decision: string; rationale: string; rule_version: number; created_at: Date; decided_by: string | null }>(sql`
    select d.id, d.facility_id, f.name facility_name, d.decision::text decision, d.rationale, d.rule_version, d.created_at,
           (select u.first_name || ' ' || u.last_name from users u where u.id = d.decided_by_id) decided_by
      from tenant_rule_decisions d left join facilities f on f.id = d.facility_id
     where d.tenant_id = ${tenantId}::uuid and d.rule_id = ${ruleId}::uuid order by d.created_at desc`);
  const mappings = await tx
    .select({ r: trainingRequirements, courseTitle: courses.title, competencyName: competencies.name })
    .from(trainingRequirements)
    .leftJoin(courses, eq(courses.id, trainingRequirements.courseId))
    .leftJoin(competencies, eq(competencies.id, trainingRequirements.competencyId))
    .where(and(eq(trainingRequirements.tenantId, tenantId), eq(trainingRequirements.regulatoryRuleId, ruleId)));
  const suggested = row.rule.suggestedCourseCodes.length
    ? await tx.select({ id: courses.id, code: courses.code, title: courses.title, status: courses.status }).from(courses).where(inArray(courses.code, row.rule.suggestedCourseCodes))
    : [];
  return { ...row, versions, decisions: decisions.rows, mappings, suggested };
}

/** Rule changes in the last `days` that matter to this organization. */
export async function regulatoryUpdates(db: DbLike, tenantId: string, days = 180) {
  const r = await db.execute<{ rule_id: string; version: number; change_summary: string; created_at: Date; citation: string; title: string; decided_version: number | null; mapped: boolean }>(sql`
    select v.rule_id, v.version, v.change_summary, v.created_at, r.citation, r.title,
           (select d.rule_version from tenant_rule_decisions d where d.tenant_id = ${tenantId}::uuid and d.rule_id = r.id order by d.created_at desc limit 1) decided_version,
           exists (select 1 from training_requirements q where q.tenant_id = ${tenantId}::uuid and q.regulatory_rule_id = r.id) mapped
      from regulatory_rule_versions v join regulatory_rules r on r.id = v.rule_id
     where v.version > 1 and v.created_at > now() - make_interval(days => ${days})
     order by v.created_at desc limit 50`);
  return r.rows;
}

// ---------------------------------------------------------------------------
// Snapshots (daily job, platform client)
// ---------------------------------------------------------------------------

export async function snapshotCompliance(sys: Db, today = todayIso()): Promise<number> {
  const tenants = await sys.execute<{ id: string }>(sql`select id from tenants where status = 'ACTIVE' and type = 'ORGANIZATION'`);
  let n = 0;
  for (const t of tenants.rows) {
    const ev = await evaluateCompliance(sys, t.id, { today });
    const rows = [
      ...ev.facilities.map((f) => ({ facilityId: f.id as string | null, s: f.summary })),
      { facilityId: null as string | null, s: ev.org },
    ];
    for (const r of rows) {
      await sys
        .insert(complianceSnapshots)
        .values({ tenantId: t.id, facilityId: r.facilityId, snapshotDate: today, applicable: r.s.items, satisfied: r.s.good, overdue: r.s.overdue + r.s.missing, gaps: r.s.gaps, needsReview: r.s.needsReview })
        .onConflictDoUpdate({
          target: [complianceSnapshots.tenantId, complianceSnapshots.facilityId, complianceSnapshots.snapshotDate],
          set: { applicable: r.s.items, satisfied: r.s.good, overdue: r.s.overdue + r.s.missing, gaps: r.s.gaps, needsReview: r.s.needsReview },
        });
      n++;
    }
  }
  return n;
}

export async function complianceTrend(db: DbLike, tenantId: string, facilityId: string | null, days = 90) {
  return db
    .select()
    .from(complianceSnapshots)
    .where(and(eq(complianceSnapshots.tenantId, tenantId), facilityId ? eq(complianceSnapshots.facilityId, facilityId) : sql`${complianceSnapshots.facilityId} is null`, sql`${complianceSnapshots.snapshotDate} > current_date - ${days}::int`))
    .orderBy(asc(complianceSnapshots.snapshotDate));
}
