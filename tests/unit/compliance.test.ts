import { describe, expect, it } from "vitest";
import {
  addMonthsIso,
  competencyItemStatus,
  courseItemStatus,
  pct,
  ruleAppliesToEmployee,
  ruleAppliesToFacility,
  ruleState,
  type RuleFacts,
} from "@/lib/compliance/engine";
import { RULES, SOURCES } from "@/content/regulatory";
import { safeCell, toCsv } from "@/lib/reports/export";
import { requirementApplies } from "@/lib/workforce/rules";

const base: RuleFacts = { id: "r", jurisdiction: "FEDERAL", kind: "TRAINING_MANDATE", complianceStatus: "VERIFIED", isActive: true, version: 1, facilityTypes: [], facilityLicenseTypes: [], positionCodes: [], jobDuties: [], requiresClinicalExposure: false, requiresBloodborneExposure: false };
const alf = { state: "FL", facilityType: "ASSISTED_LIVING_FACILITY", tags: ["ALF_STANDARD"] };
const emp = { positionCode: "CAREGIVER", jobDuties: ["PERSONAL_CARE"], clinicalExposure: true, bloodborneExposure: false };

describe("applicability rules engine (spec §11)", () => {
  it("applies federal rules everywhere and state rules only in that state", () => {
    expect(ruleAppliesToFacility(base, alf)).toBe(true);
    expect(ruleAppliesToFacility({ ...base, jurisdiction: "FL" }, alf)).toBe(true);
    expect(ruleAppliesToFacility({ ...base, jurisdiction: "FL" }, { ...alf, state: "GA" })).toBe(false);
  });
  it("matches facility type and license/program designations", () => {
    expect(ruleAppliesToFacility({ ...base, facilityTypes: ["HOSPITAL"] }, alf)).toBe(false);
    expect(ruleAppliesToFacility({ ...base, facilityLicenseTypes: ["VFC_PROVIDER"] }, alf)).toBe(false);
    expect(ruleAppliesToFacility({ ...base, facilityLicenseTypes: ["ALF_STANDARD"] }, alf)).toBe(true);
  });
  it("never applies inactive or superseded rules", () => {
    expect(ruleAppliesToFacility({ ...base, isActive: false }, alf)).toBe(false);
    expect(ruleAppliesToFacility({ ...base, complianceStatus: "SUPERSEDED" }, alf)).toBe(false);
  });
  it("narrows by position, job duties and exposure for employees", () => {
    expect(ruleAppliesToEmployee({ ...base, jobDuties: ["FOOD_SERVICE"] }, alf, emp)).toBe(false);
    expect(ruleAppliesToEmployee({ ...base, jobDuties: ["FOOD_SERVICE", "PERSONAL_CARE"] }, alf, emp)).toBe(true);
    expect(ruleAppliesToEmployee({ ...base, positionCodes: ["CNA"] }, alf, emp)).toBe(false);
    expect(ruleAppliesToEmployee({ ...base, requiresBloodborneExposure: true }, alf, emp)).toBe(false);
    expect(ruleAppliesToEmployee({ ...base, requiresClinicalExposure: true }, alf, emp)).toBe(true);
  });
  it("organization requirements honour duties and designations too", () => {
    const r = { facilityTypes: [], positionCodes: [], requiresClinicalExposure: false, requiresBloodborneExposure: false, isActive: true, jobDuties: ["MEDICATION_ASSISTANCE"] };
    expect(requirementApplies(r, { positionCode: "MED_TECH", clinicalExposure: true, bloodborneExposure: true, facilityTypes: [], jobDuties: [] })).toBe(false);
    expect(requirementApplies(r, { positionCode: "MED_TECH", clinicalExposure: true, bloodborneExposure: true, facilityTypes: [], jobDuties: ["MEDICATION_ASSISTANCE"] })).toBe(true);
  });
});

describe("rule state for a facility", () => {
  it("prioritizes documented not-applicable, then review, then mapping", () => {
    expect(ruleState(base, { decision: "NOT_APPLICABLE", ruleVersion: 1 }, true)).toBe("NOT_APPLICABLE");
    expect(ruleState({ ...base, version: 2 }, { decision: "NOT_APPLICABLE", ruleVersion: 1 }, false)).toBe("NEEDS_REVIEW"); // rule changed → re-review
    expect(ruleState({ ...base, complianceStatus: "NEEDS_REVIEW" }, null, true)).toBe("NEEDS_REVIEW");
    expect(ruleState({ ...base, version: 3 }, { decision: "APPLICABLE", ruleVersion: 2 }, true)).toBe("NEEDS_REVIEW");
    expect(ruleState(base, { decision: "UNDER_REVIEW", ruleVersion: 1 }, true)).toBe("NEEDS_REVIEW");
    expect(ruleState(base, null, true)).toBe("MAPPED");
    expect(ruleState(base, null, false)).toBe("GAP");
    expect(ruleState({ ...base, kind: "GUIDANCE" }, null, false)).toBe("INFORMATIONAL");
    expect(ruleState(base, null, false, 0)).toBe("NO_STAFF");
    expect(ruleState({ ...base, complianceStatus: "NEEDS_REVIEW" }, null, false, 0)).toBe("NO_STAFF");
  });
});

describe("employee item status", () => {
  const today = "2026-11-13";
  it("uses the earlier of certificate expiry and frequency", () => {
    expect(courseItemStatus({ completedOn: "2026-01-10", certificateStatus: "ACTIVE", certificateExpiresOn: "2027-01-10", frequencyMonths: 12, openAssignment: null }, today)).toEqual({ status: "SATISFIED", validUntil: "2027-01-10" });
    expect(courseItemStatus({ completedOn: "2025-12-01", certificateStatus: "ACTIVE", certificateExpiresOn: null, frequencyMonths: 12, openAssignment: null }, today)).toEqual({ status: "DUE_SOON", validUntil: "2026-12-01" });
    expect(courseItemStatus({ completedOn: "2025-01-01", certificateStatus: "EXPIRED", certificateExpiresOn: "2026-01-01", frequencyMonths: null, openAssignment: null }, today).status).toBe("EXPIRED");
    expect(courseItemStatus({ completedOn: "2026-10-01", certificateStatus: "ACTIVE", certificateExpiresOn: null, frequencyMonths: null, openAssignment: null }, today)).toEqual({ status: "SATISFIED", validUntil: null });
  });
  it("revoked certificates never satisfy; open assignments are pending or overdue", () => {
    expect(courseItemStatus({ completedOn: "2026-10-01", certificateStatus: "REVOKED", certificateExpiresOn: null, frequencyMonths: null, openAssignment: null }, today).status).toBe("MISSING");
    expect(courseItemStatus({ completedOn: null, certificateStatus: null, certificateExpiresOn: null, frequencyMonths: null, openAssignment: { dueDate: "2026-12-01", status: "ASSIGNED" } }, today).status).toBe("PENDING");
    expect(courseItemStatus({ completedOn: null, certificateStatus: null, certificateExpiresOn: null, frequencyMonths: null, openAssignment: { dueDate: "2026-11-01", status: "ASSIGNED" } }, today).status).toBe("OVERDUE");
  });
  it("competency status from the latest signed evaluation", () => {
    expect(competencyItemStatus(null, today)).toBe("MISSING");
    expect(competencyItemStatus({ result: "NEEDS_REMEDIATION", nextDue: null }, today)).toBe("OVERDUE");
    expect(competencyItemStatus({ result: "PASS", nextDue: "2026-11-20" }, today)).toBe("DUE_SOON");
    expect(competencyItemStatus({ result: "PASS", nextDue: "2026-10-01" }, today)).toBe("EXPIRED");
  });
  it("adds months safely at month ends; percentages round down", () => {
    expect(addMonthsIso("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsIso("2024-02-29", 12)).toBe("2025-02-28");
    expect(pct(2, 3)).toBe(66.6);
    expect(pct(0, 0)).toBeNull();
  });
});

describe("regulatory library integrity", () => {
  it("covers every category required by spec §11", () => {
    const cats = new Set(RULES.map((r) => r.category));
    for (const c of ["AHCA", "FL_DOH", "FL_BON", "FL_BOP", "FL_DCF", "CMS", "HRSA", "OSHA", "HHS_OCR", "CDC", "HIPAA", "MEDICARE_MEDICAID", "PROGRAM_340B"]) expect(cats.has(c as never)).toBe(true);
  });
  it("never asserts a frequency or deadline for a rule that needs review, and every rule cites a known source", () => {
    const keys = new Set(SOURCES.map((s) => s.key));
    for (const r of RULES) {
      expect(keys.has(r.source)).toBe(true);
      expect(r.verificationNote.length).toBeGreaterThan(10);
      if (r.status === "NEEDS_REVIEW") {
        expect(r.frequencyMonths).toBeUndefined();
        expect(r.initialDueDaysFromHire).toBeUndefined();
      }
    }
    expect(new Set(RULES.map((r) => `${r.citation}|${r.title}`)).size).toBe(RULES.length);
  });
});

describe("report export", () => {
  it("neutralizes spreadsheet formula injection and escapes CSV", () => {
    expect(safeCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(safeCell("-5")).toBe("'-5");
    expect(safeCell(5)).toBe(5);
    const csv = toCsv({ title: "t", columns: [{ key: "a", label: "A" }, { key: "b", label: "B" }], rows: [{ a: 'x,"y"', b: "@cmd" }] });
    expect(csv).toContain('"x,""y"""');
    expect(csv).toContain("'@cmd");
  });
});
