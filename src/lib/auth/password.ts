import { hash, verify } from "@node-rs/argon2";
import { createHash } from "node:crypto";
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

/**
 * Breached-password check against Have I Been Pwned using k-anonymity: only the first
 * five characters of the SHA-1 hash leave the server, never the password. Fails open
 * (returns false) when the service is unreachable so sign-up never depends on it.
 * On in production builds unless PASSWORD_BREACH_CHECK=off; elsewhere only when set to "on".
 */
export async function isBreachedPassword(password: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const setting = process.env.PASSWORD_BREACH_CHECK;
  const enabled = setting === "on" || (setting !== "off" && process.env.NODE_ENV === "production");
  if (fetcher === fetch && !enabled) return false;
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  try {
    const res = await fetcher(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`, { headers: { "Add-Padding": "true" }, signal: AbortSignal.timeout(2500) });
    if (!res.ok) return false;
    const suffix = sha1.slice(5);
    return (await res.text()).split("\n").some((line) => {
      const [h, n] = line.trim().split(":");
      return h === suffix && Number(n) > 0;
    });
  } catch {
    return false;
  }
}
export const BREACHED_MESSAGE = "This password has appeared in a known data breach. Choose a different one.";
