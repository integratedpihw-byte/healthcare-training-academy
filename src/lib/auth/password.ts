import { hash, verify } from "@node-rs/argon2";
import { z } from "zod";

// OWASP-recommended Argon2id parameters (m=19 MiB, t=2, p=1).
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

export const PASSWORD_MIN_LENGTH = 12;

/** Small deny-list of the most common breached passwords; extend with HIBP k-anonymity in production. */
const COMMON = new Set([
  "password1234",
  "password12345",
  "123456789012",
  "qwertyuiop12",
  "welcome12345",
  "letmein12345",
  "healthcare123",
  "iloveyou1234",
  "admin1234567",
]);

/**
 * Strong password policy (NIST SP 800-63B aligned): length is the primary control,
 * plus character variety and a breached/common password check.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Password must be at most 128 characters")
  .refine((p) => /[a-z]/.test(p), "Include a lowercase letter")
  .refine((p) => /[A-Z]/.test(p), "Include an uppercase letter")
  .refine((p) => /\d/.test(p), "Include a number")
  .refine((p) => /[^A-Za-z0-9]/.test(p), "Include a symbol")
  .refine((p) => !COMMON.has(p.toLowerCase()), "This password is too common");

export function passwordIssues(password: string, context: string[] = []): string[] {
  const r = passwordSchema.safeParse(password);
  const issues = r.success ? [] : r.error.issues.map((i) => i.message);
  const lower = password.toLowerCase();
  for (const c of context) {
    const part = c.toLowerCase().split("@")[0];
    if (part.length >= 4 && lower.includes(part)) {
      issues.push("Password must not contain your name or email");
      break;
    }
  }
  return issues;
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2);
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

/** Used to equalize timing when the account does not exist. */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword("timing-equalizer-Aa1!");
  await verifyPassword(await dummyHash, password);
}
