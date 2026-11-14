import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt, randomToken, sha256 } from "@/lib/auth/crypto";
import { currentTotp, newTotpSecret, verifyTotp } from "@/lib/auth/mfa";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("AES-256-GCM encryption at rest", () => {
  it("round-trips", () => {
    expect(decrypt(encrypt("JBSWY3DPEHPK3PXP"))).toBe("JBSWY3DPEHPK3PXP");
  });
  it("uses a fresh IV each time", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });
  it("detects tampering", () => {
    const parts = encrypt("secret").split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decrypt(parts.join("."))).toThrow();
  });
});

describe("tokens", () => {
  it("are long, random and hashed deterministically", () => {
    const a = randomToken();
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(a).not.toBe(randomToken());
    expect(sha256(a)).toBe(sha256(a));
    expect(sha256(a)).toHaveLength(64);
  });
});

describe("TOTP", () => {
  it("accepts the current code and rejects others", () => {
    const s = newTotpSecret();
    expect(verifyTotp(s, currentTotp(s))).toBe(true);
    expect(verifyTotp(s, "000000") && verifyTotp(s, "111111")).toBe(false);
    expect(verifyTotp(s, "abc123")).toBe(false);
  });
});
