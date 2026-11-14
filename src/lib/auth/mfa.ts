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

/** Test helper. */
export function currentTotp(secret: string): string {
  return generateSync({ secret });
}
