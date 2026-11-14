/**
 * Usage:
 *   npm run db:seed            reference data (all environments)
 *   npm run db:seed -- --demo  reference + clearly-labeled DEMO tenants (never in production)
 */
import { closePools, systemDb } from "@/db/client";
import { seedReference } from "@/db/seed/reference";
import { seedRegulatory } from "@/db/seed/regulatory";
import { DEMO_PASSWORD, seedDemo } from "@/db/seed/demo";
import { demoPublishLibrary, seedLibrary } from "@/db/seed/library";
import { seedDemoActivity } from "@/db/seed/demo-activity";
import { seedDemoWorkforce } from "@/db/seed/demo-workforce";
import { seedDemoCompliance } from "@/db/seed/demo-compliance";
import { seedDemoEnterprise } from "@/db/seed/demo-enterprise";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = systemDb();
  await seedReference(db);
  console.log("✓ Reference data seeded (permissions, system roles, course categories)");
  const reg = await seedRegulatory(db);
  console.log(`✓ Regulatory library: ${reg.rules} new rule(s), ${reg.sources} source(s) (Florida + federal, research date 2026-11-13)`);
  const lib = await seedLibrary(db);
  console.log(`✓ Course library: ${lib.created.length} new course(s) loaded for review${lib.skipped.length ? `, ${lib.skipped.length} already present` : ""}`);
  if (process.argv.includes("--demo")) {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEMO_SEED) {
      throw new Error("Refusing to seed demo data in production (set ALLOW_DEMO_SEED=1 to override)");
    }
    const r = await seedDemo(db);
    console.log(`✓ Demo tenants created: ${r.created.join(", ") || "none"}`);
    if (r.skipped.length) console.log(`  (already present: ${r.skipped.join(", ")})`);
    const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, "superadmin@chta-platform.example"));
    const pub = await demoPublishLibrary(db, admin.id);
    if (pub.length) console.log(`✓ DEMO: published ${pub.join(", ")} with auto-approvals labeled "not a qualified review"`);
    for (const line of await seedDemoActivity(db)) console.log(`✓ DEMO activity: ${line}`);
    for (const line of await seedDemoWorkforce(db)) console.log(`✓ DEMO workforce: ${line}`);
    for (const line of await seedDemoCompliance(db)) console.log(`✓ DEMO compliance: ${line}`);
    for (const line of await seedDemoEnterprise(db)) console.log(`✓ DEMO enterprise: ${line}`);
    // Never echo a custom (private) demo password into build logs.
    console.log(process.env.SEED_DEMO_PASSWORD ? "  Demo accounts use the private SEED_DEMO_PASSWORD value." : `  Demo password for all demo accounts: ${DEMO_PASSWORD}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePools());
