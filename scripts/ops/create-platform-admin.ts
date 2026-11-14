/**
 * OPERATIONS: bootstrap a platform administrator in a new environment.
 * Creates (or promotes) the account and emails a one-time password-setup link through
 * the configured email provider — no password is ever printed or passed on the
 * command line. Audited. Two-step verification is enforced for platform administrators at first use of the console.
 *   dotenv -e .env.production -- tsx scripts/ops/create-platform-admin.ts admin@example.org "First" "Last"
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { closePools, systemDb } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { secureUnverifiedAccount, sendPasswordLink } from "@/lib/auth/service";
import { writeAudit } from "@/lib/audit";

async function main() {
  const [rawEmail, firstName = "Platform", lastName = "Administrator"] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Usage: create-platform-admin.ts <email> [first] [last]");
  const db = systemDb();
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  let userId: string;
  if (existing) {
    await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.id, existing.id));
    userId = existing.id;
  } else {
    // Unusable random password until the owner sets one through the emailed link.
    const [u] = await db.insert(users).values({ email, firstName, lastName, passwordHash: await hashPassword(randomBytes(32).toString("base64url")), isPlatformAdmin: true }).returning({ id: users.id });
    userId = u.id;
  }
  await writeAudit(db, { tenantId: null, actorUserId: null, action: "platform.admin_bootstrapped", entityType: "user", entityId: userId, after: { email, existing: !!existing } });
  // An existing account whose email was never verified is locked to its mailbox owner first.
  if (!existing || !(await secureUnverifiedAccount(db, userId, email))) await sendPasswordLink(db, userId, email, "invite");
  console.log(`✓ Platform administrator ${existing ? "promoted" : "created"}: ${email}. A password-setup link (valid 72 hours) was sent by email.`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => closePools());
