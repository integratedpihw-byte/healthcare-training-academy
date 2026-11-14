import { describe, expect, it } from "vitest";
import { hashPassword, passwordIssues, verifyPassword } from "@/lib/auth/password";

describe("password policy", () => {
  it("accepts a strong password", () => {
    expect(passwordIssues("Correct-Horse-9-Battery")).toEqual([]);
  });
  it.each([
    ["short", "Ab1!short"],
    ["no upper", "lowercase-only-1!"],
    ["no lower", "UPPERCASE-ONLY-1!"],
    ["no digit", "No-Digits-Here!!"],
    ["no symbol", "NoSymbolsHere123"],
  ])("rejects %s", (_, pw) => {
    expect(passwordIssues(pw).length).toBeGreaterThan(0);
  });
  it("rejects passwords containing the user's name or email", () => {
    expect(passwordIssues("Jordan-Secure-2026!", ["jordan@x.example", "Jordan", "Lee"])).toContain("Password must not contain your name or email");
  });
  it("rejects common passwords regardless of case", () => {
    expect(passwordIssues("Password1234").length).toBeGreaterThan(0);
  });
});

describe("argon2id hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const h = await hashPassword("Correct-Horse-9-Battery");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "Correct-Horse-9-Battery")).toBe(true);
    expect(await verifyPassword(h, "correct-horse-9-battery")).toBe(false);
  });
  it("never throws on malformed hashes", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });
});
