/**
 * Seeds the platform regulatory library (Florida + federal). Idempotent: sources are
 * matched by URL+title and rules by citation+title; existing rules are never
 * overwritten here (changes go through the platform editor, which versions them).
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../client";
import { regulatoryRules, regulatorySources } from "../schema";
import { RESEARCH_DATE, REVIEWER_PLACEHOLDER, RULES, SOURCES } from "@/content/regulatory";

export async function seedRegulatory(sys: Db): Promise<{ sources: number; rules: number }> {
  const ids = new Map<string, string>();
  let sources = 0;
  let rules = 0;
  const verifiedAt = new Date(`${RESEARCH_DATE}T12:00:00Z`);
  for (const s of SOURCES) {
    const [found] = await sys.select({ id: regulatorySources.id }).from(regulatorySources).where(and(eq(regulatorySources.url, s.url), eq(regulatorySources.title, s.title)));
    if (found) {
      ids.set(s.key, found.id);
      continue;
    }
    const [row] = await sys
      .insert(regulatorySources)
      .values({ agency: s.agency, category: s.category, jurisdiction: s.jurisdiction, sourceKind: s.sourceKind, title: s.title, url: s.url, isOfficial: s.isOfficial, notes: s.notes ?? null, lastVerifiedAt: verifiedAt })
      .returning({ id: regulatorySources.id });
    ids.set(s.key, row.id);
    sources++;
  }
  for (const r of RULES) {
    const [found] = await sys.select({ id: regulatoryRules.id }).from(regulatoryRules).where(and(eq(regulatoryRules.citation, r.citation), eq(regulatoryRules.title, r.title)));
    if (found) continue;
    const sourceId = ids.get(r.source);
    if (!sourceId) throw new Error(`Unknown source ${r.source}`);
    await sys.insert(regulatoryRules).values({
      sourceId,
      agency: r.agency,
      category: r.category,
      kind: r.kind,
      jurisdiction: r.jurisdiction,
      citation: r.citation,
      title: r.title,
      requirementText: r.requirementText,
      audienceText: r.audienceText,
      facilityTypes: r.facilityTypes ?? [],
      facilityLicenseTypes: r.facilityLicenseTypes ?? [],
      positionCodes: r.positionCodes ?? [],
      jobDuties: r.jobDuties ?? [],
      requiresClinicalExposure: r.requiresClinicalExposure ?? false,
      requiresBloodborneExposure: r.requiresBloodborneExposure ?? false,
      frequencyMonths: r.frequencyMonths ?? null,
      frequencyVerified: r.frequencyMonths != null && r.status === "VERIFIED",
      frequencyText: r.frequencyText,
      initialTimingText: r.initialTimingText,
      initialDueDaysFromHire: r.initialDueDaysFromHire ?? null,
      effectiveDate: r.effectiveDate ?? null,
      lastVerifiedAt: r.status === "VERIFIED" ? verifiedAt : null,
      verificationNote: r.verificationNote,
      pendingChangeNote: r.pendingChangeNote ?? null,
      reviewerName: REVIEWER_PLACEHOLDER,
      complianceStatus: r.status,
      suggestedCourseCodes: r.suggestedCourseCodes ?? [],
    });
    rules++;
  }
  return { sources, rules };
}
