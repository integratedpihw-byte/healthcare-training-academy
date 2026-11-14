/**
 * OPERATIONS: recover an account whose authenticator device was lost.
 * Verify the person's identity out of band first. Turns two-step verification off,
 * signs the account out everywhere and emails a password-setup link; platform
 * administrators must enroll again before they can use the console. Audited.
 *   dotenv -e .env.production -- tsx scripts/ops/reset-mfa.ts user@example.org
 */
import { and, eq, isNull } from "drizzle-orm";
import { closePools, systemDb } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { sendPasswordLink } from "@/lib/auth/service";
import { writeAudit } from "@/lib/audit";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage: reset-mfa.ts <email>");
  const db = systemDb();
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!u) throw new Error("No account with that email.");
  await db.update(users).set({ mfaEnabled: false, mfaSecretEnc: null }).where(eq(users.id, u.id));
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, u.id), isNull(sessions.revokedAt)));
  await writeAudit(db, { tenantId: null, actorUserId: null, action: "auth.mfa_reset_by_operator", entityType: "user", entityId: u.id });
  await sendPasswordLink(db, u.id, email, "reset");
  console.log(`✓ Two-step verification reset for ${email}. All sessions were signed out and a password link was emailed.`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => closePools());
