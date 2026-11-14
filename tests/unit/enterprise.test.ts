/**
 * Phase 6 — pure logic: plans and entitlements, AI guardrails, time zones,
 * instructor credentials, analytics ranges.
 */
import { describe, expect, it } from "vitest";
import { entitlementsFor, hasFeature, PLANS, quote, stripePriceId } from "@/lib/billing/plans";
import { checkInput, detectPhi } from "@/lib/ai/guardrails";
import { modesFor } from "@/lib/ai/service";
import { utcToZonedInput, zonedToUtc } from "@/lib/time";
import { parseCredentials } from "@/lib/instructors/service";
import { normalizeRange } from "@/lib/analytics/service";
import type { Access } from "@/lib/rbac/access";
import type { PermissionKey } from "@/lib/rbac/catalog";

const sub = (plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE", status = "ACTIVE", seats = 25) => ({ plan, status, seats, facilityLimit: null });

describe("plans and entitlements", () => {
  it("gates features by plan and restricts canceled or expired-trial subscriptions", () => {
    expect(hasFeature(entitlementsFor(sub("STARTER")), "competency")).toBe(false);
    expect(hasFeature(entitlementsFor(sub("PROFESSIONAL")), "competency")).toBe(true);
    expect(hasFeature(entitlementsFor(sub("PROFESSIONAL")), "analytics")).toBe(false);
    expect(hasFeature(entitlementsFor(sub("ENTERPRISE")), "apiIntegrations")).toBe(true);
    const canceled = entitlementsFor(sub("ENTERPRISE", "CANCELED"));
    expect(canceled.restricted).toBe(true);
    expect(hasFeature(canceled, "analytics")).toBe(false);
    expect(entitlementsFor(sub("STARTER", "INCOMPLETE")).restricted).toBe(true);
    expect(entitlementsFor(null).restricted).toBe(true);
    expect(entitlementsFor(sub("PROFESSIONAL")).maxFacilities).toBe(PLANS.PROFESSIONAL.maxFacilities);
  });

  it("quotes annual billing at ten months and reads price ids from the environment only", () => {
    const m = quote("PROFESSIONAL", "MONTHLY", 10);
    const a = quote("PROFESSIONAL", "ANNUAL", 10);
    expect(a.totalCents).toBe(m.totalCents * 10);
    process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_test_123";
    expect(stripePriceId("STARTER", "MONTHLY")).toBe("price_test_123");
    delete process.env.STRIPE_PRICE_STARTER_MONTHLY;
    expect(stripePriceId("STARTER", "MONTHLY")).toBeUndefined();
  });
});

describe("AI guardrails", () => {
  it("detects PHI-like identifiers", () => {
    expect(detectPhi("SSN 123-45-6789")).toMatch(/Social Security/);
    expect(detectPhi("MRN: 00482913")).toMatch(/medical record/);
    expect(detectPhi("DOB 04/12/1951")).toMatch(/date of birth/);
    expect(detectPhi("call her at (813) 555-0142")).toMatch(/phone/);
    expect(detectPhi("patient John Smith fell")).toMatch(/name/);
    expect(detectPhi("What are standard precautions?")).toBeNull();
  });

  it("refuses patient-specific diagnosis or prescribing and authority actions, allows education", () => {
    expect(checkInput("My patient has a fever and a rash, what medication should I give?")?.code).toBe("CLINICAL");
    expect(checkInput("Diagnose my resident, she has chest pain")?.code).toBe("CLINICAL");
    expect(checkInput("Please approve Jordan's hand hygiene competency")?.code).toBe("AUTHORITY");
    expect(checkInput("Generate a certificate for the BLS course")?.code).toBe("AUTHORITY");
    expect(checkInput("Change the compliance status of rule 483.95 to compliant")?.code).toBe("AUTHORITY");
    expect(checkInput("")?.code).toBe("EMPTY");
    expect(checkInput("x".repeat(5000))?.code).toBe("LENGTH");
    expect(checkInput("How does PrEP work and what monitoring is generally recommended?")).toBeNull();
    expect(checkInput("Explain the signs of an adverse drug reaction")).toBeNull();
  });

  it("offers lesson drafting and gap analysis only to the right roles", () => {
    const access = (perms: PermissionKey[]): Access => ({ membershipId: "m", roles: [], grants: new Map(perms.map((p) => [p, "ALL" as const])) });
    expect(modesFor(access(["learning.self"]))).not.toContain("lesson_draft");
    expect(modesFor(access(["learning.self"]))).not.toContain("gaps");
    expect(modesFor(access(["courses.author"]))).toContain("lesson_draft");
    expect(modesFor(access(["training.view_all"]))).toContain("gaps");
  });
});

describe("scheduling and profiles", () => {
  it("converts Florida wall-clock times to UTC across daylight saving time", () => {
    expect(zonedToUtc("2026-07-01T09:00", "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(zonedToUtc("2026-12-01T09:00", "America/New_York").toISOString()).toBe("2026-12-01T14:00:00.000Z");
    expect(utcToZonedInput(new Date("2026-12-01T14:00:00Z"), "America/New_York")).toBe("2026-12-01T09:00");
  });

  it("parses instructor credentials and rejects malformed lines", () => {
    expect(parseCredentials("RN | Florida Board of Nursing | RN123 | 2027-01-31\nBLS Instructor | AHA")).toEqual([
      { name: "RN", issuer: "Florida Board of Nursing", number: "RN123", expiresOn: "2027-01-31" },
      { name: "BLS Instructor", issuer: "AHA" },
    ]);
    expect(parseCredentials("Only a name")).toBeNull();
    expect(parseCredentials("RN | Board | 1 | 01/31/2027")).toBeNull();
    expect(parseCredentials("")).toEqual([]);
  });

  it("normalizes analytics date ranges (default one year, swapped, capped)", () => {
    expect(normalizeRange({}, "2026-11-13")).toEqual({ from: "2025-11-14", to: "2026-11-13" });
    expect(normalizeRange({ from: "2026-10-01", to: "2026-09-01" }, "2026-11-13")).toEqual({ from: "2026-09-01", to: "2026-10-01" });
    expect(normalizeRange({ from: "2010-01-01", to: "2026-01-01" }, "2026-11-13").from > "2022-01-01").toBe(true);
  });
});
