import { describe, expect, it } from "vitest";
import { isCorrect } from "@/lib/learning/learner";
import { REG_KEYS, isEmbed, nextStage, parseRefs, refsToText } from "@/lib/learning/builder";
import { splitSlides } from "@/components/learning/lesson-content";

describe("answer grading", () => {
  it("matches single answers exactly", () => {
    expect(isCorrect("b", "b")).toBe(true);
    expect(isCorrect("b", "a")).toBe(false);
    expect(isCorrect("b", undefined)).toBe(false);
  });
  it("requires the exact set for multiple-select, in any order", () => {
    expect(isCorrect(["a", "c"], ["c", "a"])).toBe(true);
    expect(isCorrect(["a", "c"], ["a"])).toBe(false);
    expect(isCorrect(["a", "c"], ["a", "b", "c"])).toBe(false);
  });
});

describe("approval stage computation", () => {
  const t0 = new Date("2026-11-01T00:00:00Z");
  const after = new Date("2026-11-02T00:00:00Z");
  const before = new Date("2026-10-30T00:00:00Z");
  const v = (clinical: boolean, status = "IN_REVIEW") => ({ status, clinicalReviewRequired: clinical, revisedAt: t0 });
  it("drafts and published versions await nothing", () => {
    expect(nextStage(v(false, "DRAFT"), [])).toBeNull();
    expect(nextStage(v(false, "PUBLISHED"), [])).toBeNull();
  });
  it("walks review → clinical → compliance → publish", () => {
    expect(nextStage(v(true), [])).toBe("REVIEW");
    expect(nextStage(v(true), [{ stage: "REVIEW", decision: "APPROVED", decidedAt: after }])).toBe("CLINICAL_APPROVAL");
    expect(nextStage(v(false), [{ stage: "REVIEW", decision: "APPROVED", decidedAt: after }])).toBe("COMPLIANCE_APPROVAL");
    expect(nextStage(v(false), [{ stage: "REVIEW", decision: "APPROVED", decidedAt: after }, { stage: "COMPLIANCE_APPROVAL", decision: "APPROVED", decidedAt: after }])).toBe("PUBLISH");
  });
  it("ignores approvals given before the latest resubmission", () => {
    expect(nextStage(v(false), [{ stage: "REVIEW", decision: "APPROVED", decidedAt: before }])).toBe("REVIEW");
  });
});

describe("authoring helpers", () => {
  it("parses and re-serializes pipe-delimited references", () => {
    const refs = parseRefs("OSHA | 29 CFR 1910.1030 | BBP | https://osha.gov\n\n", REG_KEYS);
    expect(refs).toEqual([{ agency: "OSHA", citation: "29 CFR 1910.1030", title: "BBP", url: "https://osha.gov" }]);
    expect(refsToText(refs, REG_KEYS)).toBe("OSHA | 29 CFR 1910.1030 | BBP | https://osha.gov");
  });
  it("splits presentation slides on --- lines", () => {
    expect(splitSlides("## A\ntext\n---\n## B\n\n---\n")).toEqual(["## A\ntext", "## B"]);
  });
  it("recognizes only approved video embed hosts", () => {
    expect(isEmbed("https://www.youtube.com/watch?v=abc123")).toBe(true);
    expect(isEmbed("https://player.vimeo.com/video/1")).toBe(true);
    expect(isEmbed("https://evil.example/youtube.com/x")).toBe(false);
  });
});
