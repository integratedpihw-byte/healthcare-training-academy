/**
 * Authentication service (framework-agnostic so it can be unit/integration tested).
 * Runs on the platform (system) client because identity is global, not tenant-owned.
 *
 * Design:
 *  - Opaque random session tokens in an HttpOnly cookie; only SHA-256 hashes are stored.
 *  - Absolute TTL + idle timeout; server-side revocation (logout, password reset).
 *  - Argon2id password hashing, lockout after repeated failures, per-IP and
 *    per-account rate limits, timing equalization for unknown accounts.
 *  - TOTP multi-factor authentication; secrets encrypted at rest (AES-256-GCM).
 */
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { memberships, passwordResetTokens, rateLimits, sessions, tenants, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt, randomToken, sha256 } from "./crypto";
import { verifyTotp, verifyTotpStep, newTotpSecret, totpUri } from "./mfa";
import { BREACHED_MESSAGE, burnPasswordCheck, hashPassword, isBreachedPassword, passwordIssues, verifyPassword } from "./password";
import { rateLimit } from "./rate-limit";
import { sendEmail } from "@/lib/notify/email";

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
const RESET_TOKEN_MINUTES = 30;

const ttlHours = () => Number(process.env.SESSION_TTL_HOURS ?? 12);
const idleMinutes = () => Number(process.env.SESSION_IDLE_MINUTES ?? 60);

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export type LoginResult =
  | { status: "ok"; token: string; userId: string }
  | { status: "mfa_required"; token: string; userId: string }
  | { status: "invalid" }
  | { status: "locked"; until: Date }
  | { status: "rate_limited"; retryAfterSeconds: number };

export async function login(
  db: Db,
  input: { email: string; password: string },
  meta: RequestMeta = {},
): Promise<LoginResult> {
  const email = normalizeEmail(input.email);

  // Per-IP ceiling is generous because whole facilities often share one NAT address
  // (e.g. shift change). Per-account attempts are reset on successful sign-in.
  const ipLimit = await rateLimit(db, `login:ip:${meta.ip ?? "unknown"}`, 300, 15 * 60);
  const acctLimit = await rateLimit(db, `login:acct:${email}`, 10, 15 * 60);
  if (!ipLimit.allowed || !acctLimit.allowed) {
    return {
      status: "rate_limited",
      retryAfterSeconds: Math.max(ipLimit.retryAfterSeconds, acctLimit.retryAfterSeconds),
    };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.status === "DISABLED") {
    await burnPasswordCheck(input.password);
    return { status: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { status: "locked", until: user.lockedUntil };
  }

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null;
    await db
      .update(users)
      .set({ failedLoginCount: lock ? 0 : failed, lockedUntil: lock })
      .where(eq(users.id, user.id));
    await writeAudit(db, {
      tenantId: null,
      actorUserId: user.id,
      action: lock ? "auth.account_locked" : "auth.login_failed",
      entityType: "user",
      entityId: user.id,
      ipAddress: meta.ip,
    });
    return lock ? { status: "locked", until: lock } : { status: "invalid" };
  }

  await db
    .update(users)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  await db.delete(rateLimits).where(eq(rateLimits.key, `login:acct:${email}`));

  const defaultTenantId = await defaultTenantFor(db, user.id);
  const token = await createSession(db, user.id, defaultTenantId, !user.mfaEnabled, meta);
  await writeAudit(db, {
    tenantId: null,
    actorUserId: user.id,
    action: user.mfaEnabled ? "auth.password_verified_mfa_pending" : "auth.login",
    entityType: "user",
    entityId: user.id,
    ipAddress: meta.ip,
  });
  return user.mfaEnabled
    ? { status: "mfa_required", token, userId: user.id }
    : { status: "ok", token, userId: user.id };
}

async function defaultTenantFor(db: Db, userId: string): Promise<string | null> {
  const rows = await db
    .select({ tenantId: memberships.tenantId })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")))
    .orderBy(memberships.createdAt)
    .limit(1);
  return rows[0]?.tenantId ?? null;
}

export async function createSession(
  db: Db,
  userId: string,
  tenantId: string | null,
  mfaVerified: boolean,
  meta: RequestMeta = {},
): Promise<string> {
  const token = randomToken(32);
  await db.insert(sessions).values({
    tokenHash: sha256(token),
    userId,
    activeTenantId: tenantId,
    mfaVerified,
    ipAddress: meta.ip ?? null,
    userAgent: meta.userAgent?.slice(0, 400) ?? null,
    expiresAt: new Date(Date.now() + ttlHours() * 3_600_000),
  });
  return token;
}

export interface ResolvedSession {
  sessionId: string;
  userId: string;
  activeTenantId: string | null;
  mfaVerified: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isPlatformAdmin: boolean;
    mfaEnabled: boolean;
    emailVerified: boolean;
  };
}

/** Returns the session if valid; enforces absolute expiry, idle timeout and revocation. */
export async function resolveSession(db: Db, token: string | undefined | null): Promise<ResolvedSession | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const now = new Date();
  const [row] = await db
    .select({
      s: sessions,
      u: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isPlatformAdmin: users.isPlatformAdmin,
        mfaEnabled: users.mfaEnabled,
        emailVerified: sql<boolean>`${users.emailVerifiedAt} is not null`,
        status: users.status,
        passwordChangedAt: users.passwordChangedAt,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)))
    .limit(1);
  if (!row || row.u.status !== "ACTIVE") return null;
  if (now.getTime() - row.s.lastSeenAt.getTime() > idleMinutes() * 60_000) {
    await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, row.s.id));
    return null;
  }
  // Sessions created before a password change are invalid.
  if (row.s.createdAt < row.u.passwordChangedAt) return null;
  // Throttle "last seen" writes to once per minute.
  if (now.getTime() - row.s.lastSeenAt.getTime() > 60_000) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.s.id));
  }
  const { status: _s, passwordChangedAt: _p, ...user } = row.u;
  return {
    sessionId: row.s.id,
    userId: row.s.userId,
    activeTenantId: row.s.activeTenantId,
    mfaVerified: row.s.mfaVerified,
    user,
  };
}

export async function revokeSession(db: Db, token: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, sha256(token)));
}

export async function revokeAllSessions(db: Db, userId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/** Switch the session's active tenant after verifying an ACTIVE membership in an ACTIVE tenant. */
export async function switchTenant(db: Db, session: ResolvedSession, tenantId: string): Promise<boolean> {
  const [m] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(
      and(
        eq(memberships.userId, session.userId),
        eq(memberships.tenantId, tenantId),
        eq(memberships.status, "ACTIVE"),
        eq(tenants.status, "ACTIVE"),
      ),
    )
    .limit(1);
  if (!m) return false;
  await db.update(sessions).set({ activeTenantId: tenantId }).where(eq(sessions.id, session.sessionId));
  return true;
}

// ---------------------------------------------------------------------------
// Multi-factor authentication
// ---------------------------------------------------------------------------

export async function verifyMfaForSession(
  db: Db,
  token: string,
  code: string,
  meta: RequestMeta = {},
): Promise<"ok" | "invalid" | "rate_limited"> {
  const s = await resolveSession(db, token);
  if (!s) return "invalid";
  const lim = await rateLimit(db, `mfa:${s.userId}`, 5, 5 * 60);
  if (!lim.allowed) return "rate_limited";
  const [u] = await db.select({ enc: users.mfaSecretEnc }).from(users).where(eq(users.id, s.userId));
  const input = code.trim();
  let method: "totp" | "recovery" | null = null;
  if (u?.enc && /^\d{6}$/.test(input)) {
    const step = verifyTotpStep(decrypt(u.enc), input);
    if (step !== null) {
      // Each code is accepted once: the stored step only moves forward (atomic).
      const fresh = await db.update(users).set({ mfaLastStep: step }).where(and(eq(users.id, s.userId), sql`(${users.mfaLastStep} is null or ${users.mfaLastStep} < ${step})`)).returning({ id: users.id });
      if (fresh.length) method = "totp";
    }
  } else if (u?.enc && isRecoveryCodeFormat(input)) {
    const hash = sha256(normalizeRecoveryCode(input));
    const used = await db.update(users).set({ mfaRecoveryHashes: sql`array_remove(${users.mfaRecoveryHashes}, ${hash})` }).where(and(eq(users.id, s.userId), sql`${hash} = any(${users.mfaRecoveryHashes})`)).returning({ id: users.id });
    if (used.length) method = "recovery";
  }
  if (!method) {
    await writeAudit(db, { tenantId: null, actorUserId: s.userId, action: "auth.mfa_failed", entityType: "user", entityId: s.userId, ipAddress: meta.ip });
    return "invalid";
  }
  await db.update(sessions).set({ mfaVerified: true }).where(eq(sessions.id, s.sessionId));
  await writeAudit(db, { tenantId: null, actorUserId: s.userId, action: method === "recovery" ? "auth.login_recovery_code" : "auth.login", entityType: "user", entityId: s.userId, ipAddress: meta.ip });
  return "ok";
}

// One-time recovery codes: ten codes like "K7QF2-9XDMP", stored only as SHA-256 hashes.
const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no look-alike characters
const normalizeRecoveryCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");
const isRecoveryCodeFormat = (c: string) => normalizeRecoveryCode(c).length === 10 && /[A-Z]/i.test(c);

export async function recoveryCodesRemaining(db: Db, userId: string): Promise<number> {
  const [u] = await db.select({ n: sql<number>`cardinality(${users.mfaRecoveryHashes})` }).from(users).where(eq(users.id, userId));
  return Number(u?.n ?? 0);
}

/** Replaces any existing recovery codes. Requires the password; the codes are returned once and never stored in clear. */
export async function generateRecoveryCodes(db: Db, userId: string, password: string): Promise<string[] | null> {
  const [u] = await db.select({ hash: users.passwordHash, mfaEnabled: users.mfaEnabled }).from(users).where(eq(users.id, userId));
  if (!u?.mfaEnabled || !(await verifyPassword(u.hash, password))) return null;
  const codes = Array.from({ length: 10 }, () => {
    const raw = Array.from(randomBytes(10), (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join("");
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  await db.update(users).set({ mfaRecoveryHashes: codes.map((c) => sha256(normalizeRecoveryCode(c))) }).where(eq(users.id, userId));
  await writeAudit(db, { tenantId: null, actorUserId: userId, action: "auth.recovery_codes_generated", entityType: "user", entityId: userId });
  return codes;
}

/** Step 1 of enrollment: generate a secret (stored encrypted, not yet enabled). */
export async function beginMfaEnrollment(db: Db, userId: string): Promise<{ secret: string; uri: string }> {
  const [u] = await db.select({ email: users.email, mfaEnabled: users.mfaEnabled }).from(users).where(eq(users.id, userId));
  if (!u) throw new Error("User not found");
  if (u.mfaEnabled) throw new Error("MFA already enabled");
  const secret = newTotpSecret();
  await db.update(users).set({ mfaSecretEnc: encrypt(secret) }).where(eq(users.id, userId));
  return { secret, uri: totpUri(secret, u.email) };
}

/** Step 2: confirm with a valid code to enable MFA. */
export async function confirmMfaEnrollment(db: Db, userId: string, code: string): Promise<boolean> {
  const [u] = await db.select({ enc: users.mfaSecretEnc }).from(users).where(eq(users.id, userId));
  if (!u?.enc || !verifyTotp(decrypt(u.enc), code.trim())) return false;
  await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, userId));
  await writeAudit(db, { tenantId: null, actorUserId: userId, action: "auth.mfa_enabled", entityType: "user", entityId: userId });
  return true;
}

// ---------------------------------------------------------------------------
// Password recovery
// ---------------------------------------------------------------------------

/** Always resolves the same way whether or not the account exists (no enumeration). */
export async function requestPasswordReset(db: Db, rawEmail: string, meta: RequestMeta = {}): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const ipLim = await rateLimit(db, `reset:ip:${meta.ip ?? "unknown"}`, 10, 60 * 60);
  const acctLim = await rateLimit(db, `reset:acct:${email}`, 3, 60 * 60);
  if (!ipLim.allowed || !acctLim.allowed) return;
  const [u] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email));
  if (!u || u.status === "DISABLED") return;
  await sendPasswordLink(db, u.id, email, "reset");
  await writeAudit(db, { tenantId: null, actorUserId: u.id, action: "auth.password_reset_requested", entityType: "user", entityId: u.id, ipAddress: meta.ip });
}

/**
 * Issues a single-use password link. "reset" is used by the public (rate-limited)
 * forgot-password flow; "invite" by authenticated administrators adding users.
 */
export async function sendPasswordLink(db: Db, userId: string, email: string, kind: "reset" | "invite") {
  const token = randomToken(32);
  const minutes = kind === "invite" ? 72 * 60 : RESET_TOKEN_MINUTES;
  await db.insert(passwordResetTokens).values({ userId, tokenHash: sha256(token), purpose: kind, expiresAt: new Date(Date.now() + minutes * 60_000) });
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  await sendEmail(
    kind === "invite"
      ? { to: email, subject: "You have been invited to Complete Healthcare Innovative Training Academy", text: `Your organization added you to Complete Healthcare Innovative Training Academy.\n\nSet your password (link valid 72 hours):\n${url}` }
      : { to: email, subject: "Reset your Complete Healthcare Innovative Training Academy password", text: `A password reset was requested for your account.\n\nReset link (valid ${RESET_TOKEN_MINUTES} minutes):\n${url}\n\nIf you did not request this, you can ignore this email.` },
  );
}

/**
 * Called before an organization grants access to an account that already exists.
 * Self-registration does not prove ownership of the email address, so an account whose
 * address was never verified could have been created by someone else in anticipation of
 * the invitation. Such an account is locked to a random password, signed out everywhere
 * and stripped of MFA, and the real mailbox owner receives a set-password link.
 * Returns true when the account was secured this way.
 */
export async function secureUnverifiedAccount(db: Db, userId: string, email: string): Promise<boolean> {
  const [u] = await db.select({ verified: users.emailVerifiedAt }).from(users).where(eq(users.id, userId));
  if (!u || u.verified) return false;
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: await hashPassword(randomToken(48)), passwordChangedAt: sql`now()`, mfaEnabled: false, mfaSecretEnc: null, mfaRecoveryHashes: [], mfaLastStep: null }).where(eq(users.id, userId));
    await tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
    await writeAudit(tx, { tenantId: null, actorUserId: userId, action: "auth.unverified_account_secured", entityType: "user", entityId: userId });
  });
  await sendPasswordLink(db, userId, email, "invite");
  return true;
}

export type ResetResult = { ok: true } | { ok: false; error: string; issues?: string[] };

export async function resetPassword(db: Db, token: string, newPassword: string): Promise<ResetResult> {
  const now = new Date();
  const [t] = await db
    .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId, email: users.email, firstName: users.firstName, lastName: users.lastName })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(and(eq(passwordResetTokens.tokenHash, sha256(token)), sql`${passwordResetTokens.purpose} in ('reset','invite')`, isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)))
    .limit(1);
  if (!t) return { ok: false, error: "This reset link is invalid or has expired." };
  const issues = passwordIssues(newPassword, [t.email, t.firstName, t.lastName]);
  if (!issues.length && (await isBreachedPassword(newPassword))) issues.push(BREACHED_MESSAGE);
  if (issues.length) return { ok: false, error: "Password does not meet requirements.", issues };

  const passwordHash = await hashPassword(newPassword);
  await db.transaction(async (tx) => {
    // Mark used first; the WHERE clause makes concurrent reuse impossible.
    const used = await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.id, t.id), isNull(passwordResetTokens.usedAt)))
      .returning({ id: passwordResetTokens.id });
    if (!used.length) throw new Error("Token already used");
    await tx
      .update(users)
      // The link was delivered to the mailbox, so completing it proves control of the address.
      .set({ passwordHash, passwordChangedAt: sql`now()`, failedLoginCount: 0, lockedUntil: null, emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())` })
      .where(eq(users.id, t.userId));
    await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.userId, t.userId), isNull(sessions.revokedAt)));
    await writeAudit(tx, { tenantId: null, actorUserId: t.userId, action: "auth.password_reset", entityType: "user", entityId: t.userId });
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Self-service account security
// ---------------------------------------------------------------------------

export async function changePassword(
  db: Db,
  userId: string,
  currentSessionId: string,
  current: string,
  next: string,
): Promise<ResetResult> {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || !(await verifyPassword(u.passwordHash, current))) return { ok: false, error: "Current password is incorrect." };
  const issues = passwordIssues(next, [u.email, u.firstName, u.lastName]);
  if (!issues.length && (await isBreachedPassword(next))) issues.push(BREACHED_MESSAGE);
  if (issues.length) return { ok: false, error: "Password does not meet requirements.", issues };
  if (await verifyPassword(u.passwordHash, next)) return { ok: false, error: "Choose a password different from your current one." };
  const passwordHash = await hashPassword(next);
  await db.transaction(async (tx) => {
    // now() is fixed for the transaction, so the current session (created 1ms "after")
    // stays valid while every other session is invalidated.
    await tx.update(users).set({ passwordHash, passwordChangedAt: sql`now()` }).where(eq(users.id, userId));
    await tx
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), sql`${sessions.id} <> ${currentSessionId}`));
    await tx.update(sessions).set({ createdAt: sql`now() + interval '1 millisecond'` }).where(eq(sessions.id, currentSessionId));
    await writeAudit(tx, { tenantId: null, actorUserId: userId, action: "auth.password_changed", entityType: "user", entityId: userId });
  });
  return { ok: true };
}

export async function disableMfa(db: Db, userId: string, password: string, code: string): Promise<boolean> {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u?.mfaEnabled || !u.mfaSecretEnc) return false;
  if (!(await verifyPassword(u.passwordHash, password))) return false;
  if (!verifyTotp(decrypt(u.mfaSecretEnc), code.trim())) return false;
  await db.update(users).set({ mfaEnabled: false, mfaSecretEnc: null, mfaRecoveryHashes: [], mfaLastStep: null }).where(eq(users.id, userId));
  await writeAudit(db, { tenantId: null, actorUserId: userId, action: "auth.mfa_disabled", entityType: "user", entityId: userId });
  return true;
}

export async function listSessions(db: Db, userId: string) {
  return db
    .select({ id: sessions.id, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt, ipAddress: sessions.ipAddress, userAgent: sessions.userAgent })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .orderBy(sql`${sessions.lastSeenAt} desc`);
}

export async function revokeSessionById(db: Db, userId: string, sessionId: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
}

export async function userTenants(db: Db, userId: string) {
  return db
    .select({ id: tenants.id, name: tenants.name, status: tenants.status, type: tenants.type })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")))
    .orderBy(tenants.name);
}

/** Daily housekeeping: remove expired sessions, spent reset links and stale rate-limit counters. */
export async function purgeExpiredAuthData(db: Db): Promise<{ sessions: number; resetTokens: number; rateLimits: number }> {
  const s = await db.execute(sql`delete from sessions where expires_at < now() - interval '7 days' or revoked_at < now() - interval '7 days'`);
  const t = await db.execute(sql`delete from password_reset_tokens where expires_at < now() - interval '7 days'`);
  const r = await db.execute(sql`delete from rate_limits where window_start < now() - interval '1 day'`);
  return { sessions: s.rowCount ?? 0, resetTokens: t.rowCount ?? 0, rateLimits: r.rowCount ?? 0 };
}

// ---------------------------------------------------------------------------
// Email verification (self-registration)
// ---------------------------------------------------------------------------

const VERIFY_HOURS = 48;

/** "required": unverified self-registered users must confirm before using the app. Defaults to required when a real email provider is configured. */
export function emailVerificationRequired(): boolean {
  const v = process.env.EMAIL_VERIFICATION;
  if (v === "required") return true;
  if (v === "optional") return false;
  return !!process.env.EMAIL_PROVIDER && process.env.EMAIL_PROVIDER !== "console";
}

/** Emails a confirmation link (rate limited per account). Returns false when throttled or already verified. */
export async function sendVerificationEmail(db: Db, userId: string): Promise<boolean> {
  const [u] = await db.select({ email: users.email, verified: users.emailVerifiedAt }).from(users).where(eq(users.id, userId));
  if (!u || u.verified) return false;
  if (!(await rateLimit(db, `verify-email:${userId}`, 5, 60 * 60)).allowed) return false;
  const token = randomToken(32);
  await db.insert(passwordResetTokens).values({ userId, tokenHash: sha256(token), purpose: "verify", expiresAt: new Date(Date.now() + VERIFY_HOURS * 3_600_000) });
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/verify-email?token=${token}`;
  await sendEmail({ to: u.email, subject: "Confirm your email for Complete Healthcare Innovative Training Academy", text: `Confirm that this email address belongs to you (link valid ${VERIFY_HOURS} hours):\n${url}\n\nIf you did not create an account, you can ignore this email.` });
  return true;
}

/** Confirms the address for a valid link. Idempotent for the same link while it is unexpired. */
export async function verifyEmail(db: Db, token: string): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const [t] = await db
    .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, sha256(token)), eq(passwordResetTokens.purpose, "verify"), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  if (!t) return false;
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.id, t.id), isNull(passwordResetTokens.usedAt)));
  const done = await db.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, t.userId), isNull(users.emailVerifiedAt))).returning({ id: users.id });
  if (done.length) await writeAudit(db, { tenantId: null, actorUserId: t.userId, action: "auth.email_verified", entityType: "user", entityId: t.userId });
  return true;
}
