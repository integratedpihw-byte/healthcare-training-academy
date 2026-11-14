import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  deriveCompliance,
  normalizePositionCode,
  onboardingDueDate,
  parseLeadDays,
  reminderThreshold,
  requirementApplies,
  type ComplianceCounts,
} from "@/lib/workforce/rules";
import { categoryOf } from "@/lib/notify/notifications";
import { backoffMinutes, composeEmail } from "@/lib/notify/delivery";

const rule = { facilityTypes: [] as string[], positionCodes: [] as string[], requiresClinicalExposure: false, requiresBloodborneExposure: false, isActive: true };
const emp = { positionCode: "CNA", clinicalExposure: true, bloodborneExposure: false, facilityTypes: ["ASSISTED_LIVING_FACILITY"] };

describe("requirement applicability (spec §12 step 3)", () => {
  it("empty lists apply to everyone; inactive rules never apply", () => {
    expect(requirementApplies(rule, emp)).toBe(true);
    expect(requirementApplies({ ...rule, isActive: false }, emp)).toBe(false);
  });
  it("matches facility types, positions and exposure flags", () => {
    expect(requirementApplies({ ...rule, facilityTypes: ["CLINIC"] }, emp)).toBe(false);
    expect(requirementApplies({ ...rule, facilityTypes: ["CLINIC", "ASSISTED_LIVING_FACILITY"] }, emp)).toBe(true);
    expect(requirementApplies({ ...rule, positionCodes: ["RN"] }, emp)).toBe(false);
    expect(requirementApplies({ ...rule, positionCodes: ["RN", "CNA"] }, emp)).toBe(true);
    expect(requirementApplies({ ...rule, requiresClinicalExposure: true }, emp)).toBe(true);
    expect(requirementApplies({ ...rule, requiresBloodborneExposure: true }, emp)).toBe(false);
  });
  it("normalizes position codes", () => {
    expect(normalizePositionCode(" med tech ")).toBe("MED_TECH");
    expect(normalizePositionCode("Home-Health Aide")).toBe("HOME_HEALTH_AIDE");
  });
});

describe("due dates and reminders (spec §13)", () => {
  it("uses hire date + window, or the default window from today when that has passed", () => {
    expect(onboardingDueDate("2026-11-01", 30, 30, "2026-11-13")).toEqual({ dueDate: "2026-12-01" });
    const late = onboardingDueDate("2025-01-01", 30, 21, "2026-11-13");
    expect(late.dueDate).toBe("2026-12-04");
    expect(late.note).toMatch(/had passed/);
    expect(onboardingDueDate("2026-11-01", null, 14, "2026-11-13")).toEqual({ dueDate: "2026-11-27" });
  });
  it("date helpers handle month and year boundaries", () => {
    expect(addDays("2026-12-25", 10)).toBe("2027-01-04");
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2);
  });
  it("returns the smallest threshold reached, so a missed run never sends stale reminders", () => {
    const lead = [90, 60, 30, 15, 7];
    expect(reminderThreshold(120, lead)).toBeNull();
    expect(reminderThreshold(90, lead)).toBe(90);
    expect(reminderThreshold(45, lead)).toBe(60);
    expect(reminderThreshold(25, lead)).toBe(30);
    expect(reminderThreshold(7, lead)).toBe(7);
    expect(reminderThreshold(0, lead)).toBe(7);
    expect(reminderThreshold(-1, lead)).toBeNull();
  });
  it("parses configurable schedules (whole days 1–365, deduplicated, descending)", () => {
    expect(parseLeadDays("7, 30 90,30")).toEqual([90, 30, 7]);
    expect(parseLeadDays("")).toBeNull();
    expect(parseLeadDays("0, 30")).toBeNull();
    expect(parseLeadDays("400")).toBeNull();
    expect(parseLeadDays("3.5")).toBeNull();
  });
});

describe("employee compliance status", () => {
  const z: ComplianceCounts = { openAssignments: 0, overdueAssignments: 0, dueSoonAssignments: 0, expiredLicenses: 0, expiringLicenses: 0, overdueCompetencies: 0, dueSoonCompetencies: 0, completedAssignments: 0 };
  it("derives the status from the most severe signal", () => {
    expect(deriveCompliance(z)).toBe("NO_REQUIREMENTS");
    expect(deriveCompliance({ ...z, completedAssignments: 3 })).toBe("COMPLIANT");
    expect(deriveCompliance({ ...z, openAssignments: 1, dueSoonAssignments: 1 })).toBe("AT_RISK");
    expect(deriveCompliance({ ...z, expiringLicenses: 1 })).toBe("AT_RISK");
    expect(deriveCompliance({ ...z, openAssignments: 2, overdueAssignments: 1, dueSoonAssignments: 1 })).toBe("NON_COMPLIANT");
    expect(deriveCompliance({ ...z, expiredLicenses: 1 })).toBe("NON_COMPLIANT");
    expect(deriveCompliance({ ...z, overdueCompetencies: 1 })).toBe("NON_COMPLIANT");
  });
});

describe("notifications and email", () => {
  it("maps types to email categories; expirations and escalations are critical", () => {
    expect(categoryOf("assignment.new")).toBe("assignments");
    expect(categoryOf("reminder.due")).toBe("assignments");
    expect(categoryOf("exam.graded")).toBe("results");
    expect(categoryOf("certificate.available")).toBe("results");
    expect(categoryOf("announcement")).toBe("announcements");
    expect(categoryOf("certificate.expiring")).toBe("critical");
    expect(categoryOf("training.overdue")).toBe("critical");
    expect(categoryOf("training.escalation")).toBe("critical");
    expect(categoryOf("license.expiring")).toBe("critical");
  });
  it("composes plain-text email with an absolute link and preference footer", () => {
    process.env.APP_URL = "https://academy.example.org/";
    const m = composeEmail({ subject: "Training due", body: "HIPAA is due on 2026-12-01.", link: "/learning" });
    expect(m.subject).toBe("[Training Academy] Training due");
    expect(m.text).toContain("https://academy.example.org/learning");
    expect(m.text).toContain("/settings/notifications");
  });
  it("backs off exponentially with a cap", () => {
    expect(backoffMinutes(1)).toBe(2);
    expect(backoffMinutes(3)).toBe(8);
    expect(backoffMinutes(20)).toBe(240);
  });
});
