/**
 * Regulatory applicability rules engine (spec §11) — pure functions, unit tested.
 *
 * Applicability is decided from: jurisdiction (facility state), facility type,
 * facility license/program designations, employee position, job duties, clinical and
 * bloodborne exposure. Organizations then record their own decision (applicable / not
 * applicable / under review) with a rationale; a decision made on an older rule
 * version must be re-reviewed. Nothing here is a legal determination.
 */

export interface RuleFacts {
  id: string;
  jurisdiction: "FEDERAL" | "FL";
  kind: string;
  complianceStatus: string;
  isActive: boolean;
  version: number;
  facilityTypes: string[];
  facilityLicenseTypes: string[];
  positionCodes: string[];
  jobDuties: string[];
  requiresClinicalExposure: boolean;
  requiresBloodborneExposure: boolean;
}
export interface FacilityFacts {
  state: string;
  facilityType: string;
  /** license_type plus designations */
  tags: string[];
}
export interface EmployeeFacts {
  positionCode: string;
  jobDuties: string[];
  clinicalExposure: boolean;
  bloodborneExposure: boolean;
}

/** Does the rule apply to (some staff at) this facility? */
export function ruleAppliesToFacility(r: RuleFacts, f: FacilityFacts): boolean {
  if (!r.isActive || r.complianceStatus === "SUPERSEDED") return false;
  if (r.jurisdiction !== "FEDERAL" && r.jurisdiction !== f.state) return false;
  if (r.facilityTypes.length && !r.facilityTypes.includes(f.facilityType)) return false;
  if (r.facilityLicenseTypes.length && !r.facilityLicenseTypes.some((t) => f.tags.includes(t))) return false;
  return true;
}

/** Does the rule apply to this employee working at this facility? */
export function ruleAppliesToEmployee(r: RuleFacts, f: FacilityFacts, e: EmployeeFacts): boolean {
  if (!ruleAppliesToFacility(r, f)) return false;
  if (r.positionCodes.length && !r.positionCodes.includes(e.positionCode)) return false;
  if (r.jobDuties.length && !r.jobDuties.some((d) => e.jobDuties.includes(d))) return false;
  if (r.requiresClinicalExposure && !e.clinicalExposure) return false;
  if (r.requiresBloodborneExposure && !e.bloodborneExposure) return false;
  return true;
}

export type RuleState = "MAPPED" | "GAP" | "NEEDS_REVIEW" | "NOT_APPLICABLE" | "INFORMATIONAL" | "NO_STAFF";

export interface Decision {
  decision: "APPLICABLE" | "NOT_APPLICABLE" | "UNDER_REVIEW";
  ruleVersion: number;
}

export const INFORMATIONAL_KINDS = ["GUIDANCE", "NO_TRAINING_MANDATE_IDENTIFIED"];

/**
 * Status of an applicable rule for one facility. Order matters: an explicit
 * not-applicable decision wins; unverified rules, decisions under review and
 * decisions on an outdated rule version need review; otherwise a rule with no
 * mapped training requirement is a gap.
 */
export function ruleState(r: Pick<RuleFacts, "kind" | "complianceStatus" | "version">, decision: Decision | null, mapped: boolean, staffInScope = 1): RuleState {
  if (decision?.decision === "NOT_APPLICABLE" && decision.ruleVersion === r.version) return "NOT_APPLICABLE";
  // No current employee matches the rule's positions, duties or exposure: nothing to track yet.
  if (staffInScope === 0 && !mapped) return "NO_STAFF";
  if (r.complianceStatus !== "VERIFIED") return "NEEDS_REVIEW";
  if (decision && (decision.decision === "UNDER_REVIEW" || decision.ruleVersion < r.version)) return "NEEDS_REVIEW";
  if (mapped) return "MAPPED";
  if (INFORMATIONAL_KINDS.includes(r.kind)) return "INFORMATIONAL";
  return "GAP";
}

export function needsReReview(decision: Decision | null, version: number) {
  return !!decision && decision.ruleVersion < version;
}

export type ItemStatus = "SATISFIED" | "DUE_SOON" | "PENDING" | "OVERDUE" | "EXPIRED" | "MISSING";

export function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
}

/**
 * Status of one employee against one mapped course requirement.
 * Valid until = the earlier of the certificate expiry and completion + required
 * frequency. A revoked certificate never satisfies a requirement.
 */
export function courseItemStatus(
  input: {
    completedOn: string | null;
    certificateStatus: string | null;
    certificateExpiresOn: string | null;
    frequencyMonths: number | null;
    openAssignment: { dueDate: string | null; status: string } | null;
  },
  today: string,
  soonDays = 30,
): { status: ItemStatus; validUntil: string | null } {
  const { completedOn, certificateStatus, certificateExpiresOn, frequencyMonths, openAssignment } = input;
  let validUntil: string | null = null;
  if (completedOn && certificateStatus !== "REVOKED") {
    const candidates = [certificateExpiresOn, frequencyMonths ? addMonthsIso(completedOn, frequencyMonths) : null].filter((x): x is string => !!x);
    validUntil = candidates.length ? candidates.sort()[0] : null;
    if (!validUntil || validUntil >= today) {
      const soon = new Date(`${today}T00:00:00Z`);
      soon.setUTCDate(soon.getUTCDate() + soonDays);
      return { status: validUntil && validUntil <= soon.toISOString().slice(0, 10) ? "DUE_SOON" : "SATISFIED", validUntil };
    }
  }
  if (openAssignment) {
    const overdue = openAssignment.status === "OVERDUE" || (!!openAssignment.dueDate && openAssignment.dueDate < today);
    return { status: overdue ? "OVERDUE" : "PENDING", validUntil };
  }
  return { status: validUntil ? "EXPIRED" : "MISSING", validUntil };
}

export function competencyItemStatus(latest: { result: string; nextDue: string | null } | null, today: string, soonDays = 30): ItemStatus {
  if (!latest) return "MISSING";
  if (latest.result !== "PASS") return "OVERDUE";
  if (!latest.nextDue) return "SATISFIED";
  if (latest.nextDue < today) return "EXPIRED";
  const soon = new Date(`${today}T00:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + soonDays);
  return latest.nextDue <= soon.toISOString().slice(0, 10) ? "DUE_SOON" : "SATISFIED";
}

/** "In good standing": nothing overdue, expired or missing. */
export const GOOD: ItemStatus[] = ["SATISFIED", "DUE_SOON", "PENDING"];
export const COMPLETE: ItemStatus[] = ["SATISFIED", "DUE_SOON"];

export function pct(n: number, d: number): number | null {
  return d === 0 ? null : Math.floor((n / d) * 1000) / 10;
}

export const RULE_STATE_LABEL: Record<RuleState, { label: string; tone: "green" | "amber" | "red" | "gray" | "blue" }> = {
  MAPPED: { label: "Mapped to training", tone: "green" },
  GAP: { label: "Gap — no training mapped", tone: "red" },
  NEEDS_REVIEW: { label: "Needs review", tone: "amber" },
  NOT_APPLICABLE: { label: "Not applicable (documented)", tone: "gray" },
  INFORMATIONAL: { label: "Guidance / informational", tone: "blue" },
  NO_STAFF: { label: "No staff in scope", tone: "gray" },
};

export const ITEM_LABEL: Record<ItemStatus, { label: string; tone: "green" | "amber" | "red" | "gray" | "blue" | "teal" }> = {
  SATISFIED: { label: "Current", tone: "green" },
  DUE_SOON: { label: "Due soon", tone: "amber" },
  PENDING: { label: "Assigned", tone: "blue" },
  OVERDUE: { label: "Overdue", tone: "red" },
  EXPIRED: { label: "Expired", tone: "red" },
  MISSING: { label: "Not assigned", tone: "red" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  AHCA: "Florida AHCA",
  FL_DOH: "Florida Department of Health",
  FL_BON: "Florida Board of Nursing",
  FL_BOP: "Florida Board of Pharmacy",
  FL_DCF: "Florida DCF",
  CMS: "CMS",
  HRSA: "HRSA",
  OSHA: "OSHA",
  HHS_OCR: "HHS Office for Civil Rights",
  CDC: "CDC",
  HIPAA: "HIPAA",
  MEDICARE_MEDICAID: "Medicare & Medicaid",
  PROGRAM_340B: "340B Program",
};

export const KIND_LABELS: Record<string, string> = {
  TRAINING_MANDATE: "Training mandate",
  CONTINUING_EDUCATION: "Licensure continuing education",
  COMPETENCY_ASSESSMENT: "Competency assessment",
  PROGRAM_REQUIREMENT: "Program requirement",
  GUIDANCE: "Guidance (not legally mandatory)",
  NO_TRAINING_MANDATE_IDENTIFIED: "No training mandate identified",
};
