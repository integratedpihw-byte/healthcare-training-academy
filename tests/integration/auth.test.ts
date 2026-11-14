import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closePools, systemDb } from "@/db/client";
import { rateLimits, sessions, users } from "@/db/schema";
import { rateLimit } from "@/lib/auth/rate-limit";
import {
  LOCKOUT_MINUTES,
  beginMfaEnrollment,
  changePassword,
  confirmMfaEnrollment,
  login,
  requestPasswordReset,
  resetPassword,
  resolveSession,
  revokeSession,
  switchTenant,
  verifyMfaForSession,
} from "@/lib/auth/service";
import { currentTotp } from "@/lib/auth/mfa";
import { consoleOutbox } from "@/lib/notify/email";
import { PW, createTenant, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
const meta = () => ({ ip: `10.0.0.${Math.floor(Math.random() * 250)}`, userAgent: "vitest" });

beforeAll(async () => {
  process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
  T = await createTenant("auth");
});
afterAll(() => closePools());

describe("login and sessions", () => {
  it("signs in with correct credentials and resolves the session into the user's tenant", async () => {
    const r = await login(systemDb(), { email: T.adminEmail.toUpperCase(), password: PW }, meta());
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    const s = await resolveSession(systemDb(), r.token);
    expect(s?.userId).toBe(T.adminUserId);
    expect(s?.activeTenantId).toBe(T.tenantId);
    // Only the hash is stored
    const [row] = await systemDb().select().from(sessions).where(eq(sessions.id, s!.sessionId));
    expect(row.tokenHash).not.toBe(r.token);
  });

  it("rejects wrong passwords and unknown accounts with the same generic result", async () => {
    expect((await login(systemDb(), { email: T.adminEmail, password: "Wrong-Password-1!" }, meta())).status).toBe("invalid");
    expect((await login(systemDb(), { email: "nobody@test.example", password: "Wrong-Password-1!" }, meta())).status).toBe("invalid");
  });

  it("locks the account after 5 consecutive failures", async () => {
    const t = await createTenant("lock");
    let last;
    for (let i = 0; i < 5; i++) last = await login(systemDb(), { email: t.adminEmail, password: "Bad-Password-123!" }, meta());
    expect(last!.status).toBe("locked");
    const ok = await login(systemDb(), { email: t.adminEmail, password: PW }, meta());
    expect(ok.status).toBe("locked");
    if (ok.status === "locked") expect(ok.until.getTime()).toBeGreaterThan(Date.now() + (LOCKOUT_MINUTES - 1) * 60_000);
  });

  it("rate limiter blocks after the limit within a window and reports retry time", async () => {
    const key = `test:${Date.now()}`;
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit(systemDb(), key, 3, 60));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
  });

  it("account attempt counter resets after a successful sign-in", async () => {
    const t = await createTenant("rl");
    for (let i = 0; i < 4; i++) await login(systemDb(), { email: t.adminEmail, password: "Bad-Password-123!" }, meta());
    expect((await login(systemDb(), { email: t.adminEmail, password: PW }, meta())).status).toBe("ok");
    const [row] = await systemDb().select().from(rateLimits).where(eq(rateLimits.key, `login:acct:${t.adminEmail}`));
    expect(row).toBeUndefined();
  });

  it("revoked sessions no longer resolve", async () => {
    const r = await login(systemDb(), { email: T.adminEmail, password: PW }, meta());
    if (r.status !== "ok") throw new Error(r.status);
    await revokeSession(systemDb(), r.token);
    expect(await resolveSession(systemDb(), r.token)).toBeNull();
  });

  it("idle sessions expire", async () => {
    const r = await login(systemDb(), { email: T.adminEmail, password: PW }, meta());
    if (r.status !== "ok") throw new Error(r.status);
    const s = await resolveSession(systemDb(), r.token);
    await systemDb().update(sessions).set({ lastSeenAt: new Date(Date.now() - 2 * 3_600_000) }).where(eq(sessions.id, s!.sessionId));
    expect(await resolveSession(systemDb(), r.token)).toBeNull();
  });

  it("rejects garbage tokens without querying", async () => {
    expect(await resolveSession(systemDb(), "short")).toBeNull();
    expect(await resolveSession(systemDb(), undefined)).toBeNull();
  });

  it("cannot switch into a tenant the user does not belong to, or one that is not active", async () => {
    const other = await createTenant("other");
    const pending = await createTenant("pending", { approve: false });
    const r = await login(systemDb(), { email: T.adminEmail, password: PW }, meta());
    if (r.status !== "ok") throw new Error(r.status);
    const s = (await resolveSession(systemDb(), r.token))!;
    expect(await switchTenant(systemDb(), s, other.tenantId)).toBe(false);
    const p = await login(systemDb(), { email: pending.adminEmail, password: PW }, meta());
    if (p.status !== "ok") throw new Error(p.status);
    const ps = (await resolveSession(systemDb(), p.token))!;
    expect(await switchTenant(systemDb(), ps, pending.tenantId)).toBe(false);
  });
});

describe("password recovery", () => {
  it("emails a single-use link, resets the password and revokes existing sessions", async () => {
    const t = await createTenant("reset");
    const before = await login(systemDb(), { email: t.adminEmail, password: PW }, meta());
    if (before.status !== "ok") throw new Error(before.status);

    consoleOutbox.length = 0;
    await requestPasswordReset(systemDb(), t.adminEmail, meta());
    const mail = consoleOutbox.find((m) => m.to === t.adminEmail);
    expect(mail).toBeDefined();
    const token = /token=([\w-]+)/.exec(mail!.text)![1];

    expect((await resetPassword(systemDb(), token, "weak")).ok).toBe(false);
    const ok = await resetPassword(systemDb(), token, "Brand-New-Passw0rd!");
    expect(ok.ok).toBe(true);
    expect((await resetPassword(systemDb(), token, "Another-Passw0rd!!")).ok).toBe(false); // single use
    expect(await resolveSession(systemDb(), before.token)).toBeNull(); // old sessions revoked
    expect((await login(systemDb(), { email: t.adminEmail, password: PW }, meta())).status).toBe("invalid");
    expect((await login(systemDb(), { email: t.adminEmail, password: "Brand-New-Passw0rd!" }, meta())).status).toBe("ok");
  });

  it("does not reveal whether an email is registered", async () => {
    consoleOutbox.length = 0;
    await expect(requestPasswordReset(systemDb(), "ghost@test.example", meta())).resolves.toBeUndefined();
    expect(consoleOutbox).toHaveLength(0);
  });

  it("changing a password keeps the current session and signs out the others", async () => {
    const t = await createTenant("chg");
    const s1 = await login(systemDb(), { email: t.adminEmail, password: PW }, meta());
    const s2 = await login(systemDb(), { email: t.adminEmail, password: PW }, meta());
    if (s1.status !== "ok" || s2.status !== "ok") throw new Error("login");
    const cur = (await resolveSession(systemDb(), s1.token))!;
    expect((await changePassword(systemDb(), t.adminUserId, cur.sessionId, "wrong", "New-Passw0rd-123!")).ok).toBe(false);
    expect((await changePassword(systemDb(), t.adminUserId, cur.sessionId, PW, "New-Passw0rd-123!")).ok).toBe(true);
    expect(await resolveSession(systemDb(), s1.token)).not.toBeNull();
    expect(await resolveSession(systemDb(), s2.token)).toBeNull();
  });
});

describe("multi-factor authentication", () => {
  it("enrolls TOTP, then requires a code at sign-in", async () => {
    const t = await createTenant("mfa");
    const { secret } = await beginMfaEnrollment(systemDb(), t.adminUserId);
    const [u] = await systemDb().select().from(users).where(eq(users.id, t.adminUserId));
    expect(u.mfaSecretEnc).toBeTruthy();
    expect(u.mfaSecretEnc).not.toContain(secret); // encrypted at rest
    expect(await confirmMfaEnrollment(systemDb(), t.adminUserId, "000000")).toBe(false);
    expect(await confirmMfaEnrollment(systemDb(), t.adminUserId, currentTotp(secret))).toBe(true);

    const r = await login(systemDb(), { email: t.adminEmail, password: PW }, meta());
    expect(r.status).toBe("mfa_required");
    if (r.status !== "mfa_required") return;
    expect((await resolveSession(systemDb(), r.token))!.mfaVerified).toBe(false);
    expect(await verifyMfaForSession(systemDb(), r.token, "123456")).toBe("invalid");
    expect(await verifyMfaForSession(systemDb(), r.token, currentTotp(secret))).toBe("ok");
    expect((await resolveSession(systemDb(), r.token))!.mfaVerified).toBe(true);
  });
});
