/**
 * Platform regulatory library management (platform administrators only).
 * Every rule change is versioned by a database trigger with the change summary set
 * here, audited, and announced to organizations it affects ("regulatory update
 * notifications", spec §11).
 */
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { regulatoryRules, regulatorySources } from "@/db/schema";
import { FACILITY_TYPES, REGULATORY_CATEGORIES, RULE_KINDS } from "@/db/schema/_shared";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import type { ServiceResult } from "@/lib/tenancy/service";
import { normalizePositionCode } from "@/lib/workforce/rules";
import { ruleAppliesToFacility, type RuleFacts } from "./engine";

const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });
const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const optIso = iso.nullish().or(z.literal("")).transform((v) => v || null);
const optText = (max: number) => z.string().trim().max(max).nullish().or(z.literal("")).transform((v) => v || null);
const optInt = (min: number, max: number) => z.union([z.literal(""), z.null(), z.coerce.number().int().min(min).max(max)]).optional().transform((v) => (v === "" || v == null ? null : v));
const csv = z.string().max(1000).default("").transform((s) => [...new Set(s.split(/[\s,]+/).filter(Boolean))]);

export const ruleSchema = z
  .object({
    sourceId: z.string().uuid("Choose a source"),
    category: z.enum(REGULATORY_CATEGORIES),
    kind: z.enum(RULE_KINDS),
    jurisdiction: z.enum(["FEDERAL", "FL"]),
    agency: z.string().trim().min(2).max(200),
    citation: z.string().trim().min(3, "Required").max(200),
    title: z.string().trim().min(3, "Required").max(200),
    requirementText: z.string().trim().min(10, "Describe the requirement").max(4000),
    audienceText: optText(1000),
    facilityTypes: z.array(z.enum(FACILITY_TYPES)).default([]),
    facilityLicenseTypes: z.array(z.string().regex(/^[A-Z0-9_]{2,40}$/)).default([]),
    positionCodes: csv.transform((a) => a.map(normalizePositionCode)),
    jobDuties: z.array(z.string().regex(/^[A-Z0-9_]{2,40}$/)).default([]),
    requiresClinicalExposure: z.boolean().default(false),
    requiresBloodborneExposure: z.boolean().default(false),
    frequencyMonths: optInt(1, 120),
    frequencyVerified: z.boolean().default(false),
    frequencyText: optText(1000),
    initialTimingText: optText(1000),
    initialDueDaysFromHire: optInt(0, 730),
    effectiveDate: optIso,
    complianceStatus: z.enum(["VERIFIED", "NEEDS_REVIEW", "SUPERSEDED"]),
    lastVerifiedOn: optIso,
    verificationNote: optText(4000),
    pendingChangeNote: optText(2000),
    reviewerName: optText(200),
    suggestedCourseCodes: csv,
    isActive: z.boolean().default(true),
    changeSummary: z.string().trim().max(1000).default(""),
  })
  .superRefine((v, c) => {
    if (v.frequencyMonths != null && !v.frequencyVerified) c.addIssue({ code: "custom", path: ["frequencyMonths"], message: "Only enter a frequency verified against the source (tick 'frequency verified')" });
    if (v.complianceStatus === "VERIFIED" && !v.lastVerifiedOn) c.addIssue({ code: "custom", path: ["lastVerifiedOn"], message: "Verified rules need the date they were verified" });
    if (v.complianceStatus === "VERIFIED" && !v.verificationNote) c.addIssue({ code: "custom", path: ["verificationNote"], message: "Record what was verified and against which source" });
  });

export async function saveRule(sys: Db, adminUserId: string, raw: unknown, id?: string): Promise<ServiceResult<{ id: string; version: number; notified: number }>> {
  const p = ruleSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const { changeSummary, lastVerifiedOn, ...v } = p.data;
  if (id && changeSummary.length < 10) return err("Describe what changed (10+ characters). Organizations are notified with this summary.", { changeSummary: ["Required"] });
  const values = { ...v, lastVerifiedAt: lastVerifiedOn ? new Date(`${lastVerifiedOn}T12:00:00Z`) : null, reviewerUserId: adminUserId };
  try {
    const saved = await sys.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.change_summary', ${id ? changeSummary : changeSummary || "Initial version"}, true), set_config('app.user_id', ${adminUserId}, true)`);
      if (id) {
        const [before] = await tx.select().from(regulatoryRules).where(eq(regulatoryRules.id, id));
        if (!before) return null;
        const [row] = await tx.update(regulatoryRules).set(values).where(eq(regulatoryRules.id, id)).returning({ id: regulatoryRules.id, version: regulatoryRules.version });
        await writeAudit(tx, { tenantId: null, actorUserId: adminUserId, action: "regulatory.rule_updated", entityType: "regulatory_rule", entityId: id, before: { version: before.version, complianceStatus: before.complianceStatus, frequencyMonths: before.frequencyMonths }, after: { version: row.version, complianceStatus: v.complianceStatus, frequencyMonths: v.frequencyMonths, changeSummary } });
        return row;
      }
      const [row] = await tx.insert(regulatoryRules).values(values).returning({ id: regulatoryRules.id, version: regulatoryRules.version });
      await writeAudit(tx, { tenantId: null, actorUserId: adminUserId, action: "regulatory.rule_created", entityType: "regulatory_rule", entityId: row.id, after: { citation: v.citation, title: v.title, complianceStatus: v.complianceStatus } });
      return row;
    });
    if (!saved) return err("Rule not found.");
    const notified = id ? await notifyRuleChange(sys, saved.id, saved.version, changeSummary) : 0;
    return { ok: true, data: { ...saved, notified } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/unique/i.test(msg)) return err("A rule with this citation and title already exists.");
    if (/frequency/i.test(msg)) return err("A frequency can only be recorded when verified.");
    throw e;
  }
}

/**
 * Notifies compliance managers in organizations the rule affects: those that recorded
 * a decision or mapped the rule, and those with an active facility the rule applies to.
 */
export async function notifyRuleChange(sys: Db, ruleId: string, version: number, summary: string): Promise<number> {
  const [rule] = await sys.select().from(regulatoryRules).where(eq(regulatoryRules.id, ruleId));
  if (!rule) return 0;
  const facs = await sys.execute<{ tenant_id: string; id: string; state: string; facility_type: string; tags: string[] }>(sql`
    select f.tenant_id, f.id, f.state, f.facility_type::text facility_type, array_remove(array_append(f.designations, f.license_type), null) tags
      from facilities f join tenants t on t.id = f.tenant_id where f.is_active and t.status = 'ACTIVE'`);
  const tenantFacilities = new Map<string, string[]>();
  for (const f of facs.rows) {
    if (ruleAppliesToFacility(rule as RuleFacts, { state: f.state, facilityType: f.facility_type, tags: f.tags })) tenantFacilities.set(f.tenant_id, [...(tenantFacilities.get(f.tenant_id) ?? []), f.id]);
  }
  const involved = await sys.execute<{ tenant_id: string }>(sql`
    select tenant_id from tenant_rule_decisions where rule_id = ${ruleId}::uuid
    union select tenant_id from training_requirements where regulatory_rule_id = ${ruleId}::uuid and tenant_id is not null`);
  for (const r of involved.rows) if (!tenantFacilities.has(r.tenant_id)) tenantFacilities.set(r.tenant_id, []);
  let sent = 0;
  for (const [tenantId, facilityIds] of tenantFacilities) {
    const facFilter = facilityIds.length ? sql`or mr.facility_id in (${sql.join(facilityIds.map((f) => sql`${f}::uuid`), sql`, `)})` : sql``;
    const users = await sys.execute<{ user_id: string }>(sql`
      select distinct m.user_id from memberships m
        join membership_roles mr on mr.membership_id = m.id
        join role_permissions rp on rp.role_id = mr.role_id
        join permissions p on p.id = rp.permission_id
       where m.tenant_id = ${tenantId}::uuid and m.status = 'ACTIVE' and p.key = 'compliance.manage' and (mr.facility_id is null ${facFilter})`);
    sent += await notify(
      sys,
      users.rows.map((u) => ({
        tenantId,
        userId: u.user_id,
        type: "compliance.rule_updated",
        title: `Regulatory update: ${rule.citation}`,
        body: `${rule.title} was updated (version ${version}): ${summary} Review the change and your applicability decision.`.slice(0, 1000),
        link: `/compliance/rules/${ruleId}`,
        dedupeKey: `rule:${ruleId}:v${version}:${u.user_id}`,
      })),
    );
  }
  return sent;
}

export const sourceSchema = z.object({
  agency: z.string().trim().min(2).max(200),
  category: z.enum(REGULATORY_CATEGORIES),
  jurisdiction: z.enum(["FEDERAL", "FL"]),
  sourceKind: z.enum(["STATUTE", "REGULATION", "GUIDANCE", "PROGRAM_MANUAL"]),
  title: z.string().trim().min(3).max(300),
  url: z.string().trim().url("Enter the source URL").refine((u) => u.startsWith("https://") || u.startsWith("http://"), "Must be a web address"),
  isOfficial: z.boolean().default(true),
  notes: optText(2000),
});

export async function addSource(sys: Db, adminUserId: string, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = sourceSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const [row] = await sys.insert(regulatorySources).values({ ...p.data, lastVerifiedAt: new Date() }).returning({ id: regulatorySources.id });
  await writeAudit(sys, { tenantId: null, actorUserId: adminUserId, action: "regulatory.source_added", entityType: "regulatory_source", entityId: row.id, after: p.data });
  return { ok: true, data: { id: row.id } };
}

/** Rules whose verification is missing or older than a year. */
export async function verificationQueue(sys: Db) {
  return sys.execute<{ id: string; citation: string; title: string; compliance_status: string; last_verified_at: Date | null }>(sql`
    select id, citation, title, compliance_status::text, last_verified_at from regulatory_rules
     where is_active and (compliance_status = 'NEEDS_REVIEW' or last_verified_at is null or last_verified_at < now() - interval '365 days')
     order by last_verified_at nulls first, citation`);
}
