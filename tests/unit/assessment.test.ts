import { describe, expect, it } from "vitest";
import { grade, normalizeText, pickRandom, questionInputSchema, scorePct } from "@/lib/assessment/grading";
import { parseQuestionForm, questionToForm } from "@/lib/assessment/authoring";
import { deriveResult, signaturePayload } from "@/lib/competency/service";
import { addMonths, effectiveStatus, newCertificateNumber, randomCode } from "@/lib/certificates/service";
import { renderCertificatePdf } from "@/lib/certificates/pdf";

const q = (type: string, options: unknown, correctAnswer: unknown, points = 1) => ({ type: type as never, options, correctAnswer, points });

describe("grading — every question type", () => {
  it("single-answer types", () => {
    for (const t of ["MULTIPLE_CHOICE", "TRUE_FALSE", "SCENARIO", "CASE_STUDY", "IMAGE_IDENTIFICATION"]) {
      expect(grade(q(t, [], "b"), "b")).toEqual({ status: "correct", points: 1 });
      expect(grade(q(t, [], "b"), "a").status).toBe("incorrect");
    }
  });
  it("multiple select is all-or-nothing", () => {
    expect(grade(q("MULTIPLE_SELECT", [], ["a", "c"]), ["c", "a"]).status).toBe("correct");
    expect(grade(q("MULTIPLE_SELECT", [], ["a", "c"]), ["a"]).status).toBe("incorrect");
  });
  it("matching awards partial credit", () => {
    const m = q("MATCHING", {}, { "1": "a", "2": "b", "3": "c", "4": "d" }, 2);
    expect(grade(m, { "1": "a", "2": "b", "3": "c", "4": "d" })).toEqual({ status: "correct", points: 2 });
    expect(grade(m, { "1": "a", "2": "b", "3": "d", "4": "c" })).toEqual({ status: "partial", points: 1 });
    expect(grade(m, {}).status).toBe("incorrect");
  });
  it("fill in the blank ignores case, spacing and trailing punctuation", () => {
    const f = q("FILL_IN_BLANK", [], ["Hepatitis B", "HBV"]);
    expect(grade(f, "  hepatitis   b. ").status).toBe("correct");
    expect(grade(f, "hbv").status).toBe("correct");
    expect(grade(f, "hepatitis c").status).toBe("incorrect");
    expect(normalizeText("A  B!")).toBe("a b");
  });
  it("practical items are pending instructor grading; blanks are incorrect", () => {
    expect(grade(q("PRACTICAL", [], { rubric: "x" }), "anything").status).toBe("pending");
    expect(grade(q("MULTIPLE_CHOICE", [], "a"), undefined).status).toBe("incorrect");
  });
  it("scores round down so a 79.9% never passes an 80% exam", () => {
    expect(scorePct(799, 1000)).toBe(79);
    expect(scorePct(12, 15)).toBe(80);
    expect(scorePct(0, 0)).toBe(0);
  });
  it("random selection returns distinct items of the requested size", () => {
    const pool = Array.from({ length: 30 }, (_, i) => i);
    const pick = pickRandom(pool, 15);
    expect(new Set(pick).size).toBe(15);
    expect(pickRandom(pool, 50)).toHaveLength(30);
    expect(pickRandom(pool, 3, false)).toEqual([0, 1, 2]);
  });
});

describe("question authoring", () => {
  it("parses the plain-text builder form for each type and round-trips", () => {
    const mc = parseQuestionForm({ type: "MULTIPLE_CHOICE", prompt: "Which tube?", optionsText: "a | Red\nb | Lavender", correct: "b", explanation: "EDTA tubes are lavender." });
    expect(questionInputSchema.safeParse(mc).success).toBe(true);
    expect(questionToForm(mc as never).optionsText).toBe("a | Red\nb | Lavender");
    const tf = parseQuestionForm({ type: "TRUE_FALSE", prompt: "Gloves replace hand hygiene.", correct: "false", explanation: "They do not." });
    expect(tf.correctAnswer).toBe("f");
    const ms = parseQuestionForm({ type: "MULTIPLE_SELECT", prompt: "Pick two items", optionsText: "x\ny\nz", correct: "a, c", explanation: "Because." });
    expect(ms.correctAnswer).toEqual(["a", "c"]);
    const mt = parseQuestionForm({ type: "MATCHING", prompt: "Match tubes", matchLeft: "1 | Lavender\n2 | Light blue", matchRight: "a | EDTA\nb | Citrate", matchKey: "1=a, 2=b", explanation: "Standard colors." });
    expect(questionInputSchema.safeParse(mt).success).toBe(true);
    const fb = parseQuestionForm({ type: "FILL_IN_BLANK", prompt: "PPE stands for ___", accepted: "personal protective equipment", explanation: "Definition." });
    expect(questionInputSchema.safeParse(fb).success).toBe(true);
  });
  it("rejects inconsistent questions", () => {
    expect(questionInputSchema.safeParse(parseQuestionForm({ type: "MULTIPLE_CHOICE", prompt: "Which one?", optionsText: "a | X\nb | Y", correct: "z", explanation: "Because." })).success).toBe(false);
    expect(questionInputSchema.safeParse(parseQuestionForm({ type: "MATCHING", prompt: "Match these", matchLeft: "1 | A\n2 | B", matchRight: "a | X\nb | Y", matchKey: "1=a", explanation: "Because." })).success).toBe(false);
    expect(questionInputSchema.safeParse(parseQuestionForm({ type: "IMAGE_IDENTIFICATION", prompt: "Identify the device", optionsText: "a | X\nb | Y", correct: "a", explanation: "Because." })).success).toBe(false);
    expect(questionInputSchema.safeParse(parseQuestionForm({ type: "PRACTICAL", prompt: "Describe donning", rubric: "", explanation: "Because." })).success).toBe(false);
  });
});

describe("competency results and signatures", () => {
  const criteria = [{ id: "1", text: "a", critical: true }, { id: "2", text: "b", critical: false }];
  it("derives PASS / NEEDS_REMEDIATION / FAIL", () => {
    expect(deriveResult(criteria, [{ id: "1", outcome: "MET" }, { id: "2", outcome: "MET" }])).toBe("PASS");
    expect(deriveResult(criteria, [{ id: "1", outcome: "MET" }, { id: "2", outcome: "NOT_MET" }])).toBe("NEEDS_REMEDIATION");
    expect(deriveResult(criteria, [{ id: "1", outcome: "NOT_MET" }, { id: "2", outcome: "MET" }])).toBe("FAIL");
  });
  it("signature payload changes when any signed field changes", () => {
    const base = { id: "x", tenantId: "t", employeeId: "e", facilityId: "f", competencyId: "c", evaluatorUserId: "u", assessedOn: "2026-11-01", result: "PASS", criteriaResults: [{ id: "1", outcome: "MET" }], remediationRequired: null, evaluatorComments: null };
    const a = signaturePayload(base, "2026-11-01T10:00:00.000Z", "Grace Kim");
    expect(signaturePayload({ ...base, result: "FAIL" }, "2026-11-01T10:00:00.000Z", "Grace Kim")).not.toBe(a);
    expect(signaturePayload(base, "2026-11-01T10:00:00.000Z", "Someone Else")).not.toBe(a);
  });
});

describe("certificates", () => {
  it("generates unambiguous codes and numbers", () => {
    expect(randomCode(10)).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
    expect(newCertificateNumber(new Date("2026-05-01"))).toMatch(/^CHITA-2026-[A-HJ-NP-Z2-9]{8}$/);
  });
  it("adds months safely at month ends", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-11-13", 12)).toBe("2027-11-13");
  });
  it("treats past-expiry active certificates as expired", () => {
    expect(effectiveStatus({ status: "ACTIVE", expiresOn: "2026-01-01" }, "2026-11-13")).toBe("EXPIRED");
    expect(effectiveStatus({ status: "ACTIVE", expiresOn: null }, "2026-11-13")).toBe("ACTIVE");
    expect(effectiveStatus({ status: "REVOKED", expiresOn: "2030-01-01" }, "2026-11-13")).toBe("REVOKED");
  });
  it("renders a PDF with the verification QR code", async () => {
    const bytes = await renderCertificatePdf({ certificateNumber: "CHITA-2026-ABCDEFGH", verificationCode: "ABCDEFGHJK", recipientName: "Jordan Lee", courseTitle: "OSHA Bloodborne Pathogens", courseCode: "CHITA-MC-004", completedOn: "2026-11-13", expiresOn: "2027-11-13", trainingHours: "1.25", issuingAuthority: "Complete Healthcare Innovative Training Academy on behalf of Sunshine Care Group", issuedAt: new Date(), status: "ACTIVE", kind: "COURSE_COMPLETION" });
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(5000);
  });
});
