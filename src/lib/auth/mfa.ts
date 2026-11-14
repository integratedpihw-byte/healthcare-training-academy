import { generateSecret, generateSync, generateURI, verifySync } from "otplib";

export const MFA_ISSUER = "Complete Healthcare Innovative Training Academy";

export function newTotpSecret(): string {
  return generateSecret();
}

export function totpUri(secret: string, email: string): string {
  return generateURI({ secret, label: email, issuer: MFA_ISSUER });
}

/** Accepts the current code and ±1 time step to tolerate clock drift. */
export function verifyTotp(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  try {
    return verifySync({ secret, token, epochTolerance: 30 }).valid;
  } catch {
    return false;
  }
}

/** Like verifyTotp, but returns the matched 30-second time step (for replay protection) or null. */
export function verifyTotpStep(secret: string, token: string): number | null {
  if (!/^\d{6}$/.test(token)) return null;
  try {
    const r = verifySync({ secret, token, epochTolerance: 30 }) as { valid: boolean; timeStep?: number };
    return r.valid ? (r.timeStep ?? Math.floor(Date.now() / 30_000)) : null;
  } catch {
    return null;
  }
}

/** Test helper. */
export function currentTotp(secret: string): string {
  return generateSync({ secret });
}
