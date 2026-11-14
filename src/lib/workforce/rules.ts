/**
 * Pure workforce rules (no database access) — unit tested.
 */

/** Normalized position codes used by training requirements. Organizations may add their own. */
export const STANDARD_POSITIONS: { code: string; label: string }[] = [
  { code: "CAREGIVER", label: "Caregiver / Resident Care Aide" },
  { code: "CNA", label: "Certified Nursing Assistant" },
  { code: "HOME_HEALTH_AIDE", label: "Home Health Aide" },
  { code: "MED_TECH", label: "Medication Technician / Aide" },
  { code: "RN", label: "Registered Nurse" },
  { code: "LPN", label: "Licensed Practical Nurse" },
  { code: "APRN", label: "Advanced Practice Registered Nurse" },
  { code: "PHYSICIAN", label: "Physician" },
  { code: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { code: "PHLEBOTOMIST", label: "Phlebotomist" },
  { code: "LAB_TECH", label: "Laboratory Technician" },
  { code: "PHARMACY_TECH", label: "Pharmacy Technician" },
  { code: "BEHAVIORAL_TECH", label: "Behavioral Health Technician" },
  { code: "COUNSELOR", label: "Counselor / Case Manager" },
  { code: "SUPERVISOR", label: "Clinical Supervisor" },
  { code: "ADMINISTRATOR", label: "Facility Administrator" },
  { code: "DIETARY", label: "Dietary / Food Service" },
  { code: "HOUSEKEEPING", label: "Housekeeping / Environmental Services" },
  { code: "MAINTENANCE", label: "Maintenance" },
  { code: "FRONT_OFFICE", label: "Front Office / Registration" },
  { code: "ADMIN_STAFF", label: "Administrative Staff" },
  { code: "DRIVER", label: "Driver / Transportation" },
];

export function normalizePositionCode(s: string) {
  return s.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export interface RequirementRule {
  facilityTypes: string[];
  positionCodes: string[];
  facilityLicenseTypes?: string[];
  jobDuties?: string[];
  requiresClinicalExposure: boolean;
  requiresBloodborneExposure: boolean;
  isActive: boolean;
}
export interface EmployeeFacts {
  positionCode: string;
  clinicalExposure: boolean;
  bloodborneExposure: boolean;
  /** Types of every facility the employee is assigned to. */
  facilityTypes: string[];
  /** License-type tags of those facilities. */
  facilityLicenseTypes?: string[];
  jobDuties?: string[];
}

/** Spec §12 step 3: does the requirement apply to this employee? Empty lists mean "all". */
export function requirementApplies(r: RequirementRule, e: EmployeeFacts): boolean {
  if (!r.isActive) return false;
  if (r.facilityTypes.length && !r.facilityTypes.some((t) => e.facilityTypes.includes(t))) return false;
  if (r.positionCodes.length && !r.positionCodes.includes(e.positionCode)) return false;
  if (r.facilityLicenseTypes?.length && !r.facilityLicenseTypes.some((t) => (e.facilityLicenseTypes ?? []).includes(t))) return false;
  if (r.jobDuties?.length && !r.jobDuties.some((d) => (e.jobDuties ?? []).includes(d))) return false;
  if (r.requiresClinicalExposure && !e.clinicalExposure) return false;
  if (r.requiresBloodborneExposure && !e.bloodborneExposure) return false;
  return true;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

export function todayIso(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Spec §12 step 6: due date for a requirement-driven assignment. Due = hire date +
 * the requirement's window; when that date has already passed (existing staff) the
 * employee gets the organization's default window from today instead, and the
 * returned note explains why.
 */
export function onboardingDueDate(hireDate: string, dueWithinDaysOfHire: number | null, defaultDueDays: number, today: string): { dueDate: string; note?: string } {
  if (dueWithinDaysOfHire == null) return { dueDate: addDays(today, defaultDueDays) };
  const fromHire = addDays(hireDate, dueWithinDaysOfHire);
  if (fromHire >= today) return { dueDate: fromHire };
  return { dueDate: addDays(today, defaultDueDays), note: `The ${dueWithinDaysOfHire}-day window after hire (${fromHire}) had passed when assigned.` };
}

export const DEFAULT_LEAD_DAYS = [90, 60, 30, 15, 7];

export function parseLeadDays(input: string): number[] | null {
  const parts = input.split(/[\s,]+/).filter(Boolean);
  if (!parts.length) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isInteger(n) || n < 1 || n > 365)) return null;
  return [...new Set(nums)].sort((a, b) => b - a);
}

/**
 * Which reminder threshold applies today? Returns the smallest configured lead time
 * that has been reached (days until ≤ lead), or null when none has. Sending one
 * reminder per threshold (deduplicated) means a missed daily run never produces a
 * burst of stale reminders.
 */
export function reminderThreshold(daysUntil: number, leadDays: number[]): number | null {
  if (daysUntil < 0) return null;
  const reached = leadDays.filter((l) => daysUntil <= l);
  return reached.length ? Math.min(...reached) : null;
}

export type ComplianceStatus = "COMPLIANT" | "AT_RISK" | "NON_COMPLIANT" | "NO_REQUIREMENTS";
export interface ComplianceCounts {
  openAssignments: number;
  overdueAssignments: number;
  dueSoonAssignments: number;
  expiredLicenses: number;
  expiringLicenses: number;
  overdueCompetencies: number;
  dueSoonCompetencies: number;
  completedAssignments: number;
}

/**
 * Spec §12 step 11 / §13: employee training compliance (workforce view). Regulatory
 * applicability per Florida/federal rules is layered on in the Compliance Center.
 */
export function deriveCompliance(c: ComplianceCounts): ComplianceStatus {
  if (c.overdueAssignments || c.expiredLicenses || c.overdueCompetencies) return "NON_COMPLIANT";
  if (c.dueSoonAssignments || c.expiringLicenses || c.dueSoonCompetencies) return "AT_RISK";
  if (!c.openAssignments && !c.completedAssignments) return "NO_REQUIREMENTS";
  return "COMPLIANT";
}

export const COMPLIANCE_LABEL: Record<ComplianceStatus, { label: string; tone: "green" | "amber" | "red" | "gray" }> = {
  COMPLIANT: { label: "Compliant", tone: "green" },
  AT_RISK: { label: "Due soon", tone: "amber" },
  NON_COMPLIANT: { label: "Non-compliant", tone: "red" },
  NO_REQUIREMENTS: { label: "No training assigned", tone: "gray" },
};

/** Window (days) used for "due soon" / "expiring" in compliance status. */
export const DUE_SOON_DAYS = 30;
