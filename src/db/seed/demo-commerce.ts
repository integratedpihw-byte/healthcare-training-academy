/**
 * DEMO training revenue data: illustrative prices for the Home Health and Mental Health
 * courses, two training packages, a welcome promo code, an employer seat purchase for
 * Gulf Coast (DEMO) paid by invoice, and an instructor rate for Sunshine (DEMO).
 * Prices here are placeholders for demonstration — the academy sets real prices on
 * Platform → Training revenue. Idempotent (skipped when the demo package exists).
 */
import { and, eq, isNull, like, or } from "drizzle-orm";
import type { Db } from "../client";
import { courses, instructorCompensation, instructors, tenants, trainingPackages, users } from "../schema";
import { createPromo, fulfillOrder, placeOrder, savePackage, setCoursePrice } from "@/lib/billing/commerce";

const PRICES: Record<string, number> = {
  "CHITA-HH-001": 149, "CHITA-HH-002": 59, "CHITA-HH-003": 69, "CHITA-HH-004": 49, "CHITA-HH-005": 49, "CHITA-HH-006": 69,
  "CHITA-MH-001": 59, "CHITA-MH-002": 59, "CHITA-MH-003": 59, "CHITA-MH-004": 59, "CHITA-MH-005": 49, "CHITA-MH-006": 69,
};

export async function seedDemoCommerce(sys: Db): Promise<string[]> {
  const done: string[] = [];
  const [exists] = await sys.select({ id: trainingPackages.id }).from(trainingPackages).where(eq(trainingPackages.code, "DEMO-HHA-STARTER"));
  if (exists) return done;
  const [admin] = await sys.select().from(users).where(eq(users.isPlatformAdmin, true)).limit(1);
  if (!admin) return done;
  const lib = await sys
    .select({ id: courses.id, code: courses.code, status: courses.status })
    .from(courses)
    .where(and(isNull(courses.tenantId), or(like(courses.code, "CHITA-HH-%"), like(courses.code, "CHITA-MH-%"))));
  const published = lib.filter((c) => c.status === "PUBLISHED" && PRICES[c.code] != null);
  if (!published.length) return done;
  for (const c of published) await setCoursePrice(sys, admin.id, { courseId: c.id, price: PRICES[c.code] });
  done.push(`${published.length} course prices`);

  const byCode = new Map(published.map((c) => [c.code, c.id]));
  const pick = (codes: string[]) => codes.map((c) => byCode.get(c)).filter((x): x is string => !!x);
  const hha = await savePackage(sys, admin.id, { code: "DEMO-HHA-STARTER", name: "Home Health Aide starter bundle (DEMO)", audience: "New home health aides", description: "DEMO package: HHA training, personal care, infection control and medication assistance.", courseIds: pick(["CHITA-HH-001", "CHITA-HH-002", "CHITA-HH-004", "CHITA-HH-005"]), price: 229 });
  const mh = await savePackage(sys, admin.id, { code: "DEMO-MH-ESSENTIALS", name: "Mental health essentials (DEMO)", audience: "Direct care and support staff", description: "DEMO package: fundamentals, crisis awareness, trauma-informed care and suicide prevention.", courseIds: pick(["CHITA-MH-001", "CHITA-MH-002", "CHITA-MH-005", "CHITA-MH-006"]), price: 199 });
  if (hha.ok && mh.ok) done.push("2 training packages");
  await createPromo(sys, admin.id, { code: "DEMO-WELCOME10", kind: "PERCENT", value: 10, maxRedemptions: 100, description: "DEMO welcome discount" });
  done.push("promo code DEMO-WELCOME10");

  const [gulf] = await sys.select().from(tenants).where(eq(tenants.slug, "demo-gulfcoast"));
  const [gulfAdmin] = gulf ? await sys.select().from(users).where(eq(users.email, "orgadmin@gulfcoast.example")) : [];
  if (gulf && gulfAdmin && hha.ok) {
    const o = await placeOrder(sys, { tenantId: gulf.id, userId: gulfAdmin.id, email: gulfAdmin.email }, { itemType: "PACKAGE", itemId: hha.data.id, quantity: 5, promoCode: "DEMO-WELCOME10", method: "INVOICE" }, "https://example.invalid/billing");
    if (o.ok && o.data.status === "PENDING") {
      await fulfillOrder(sys, o.data.orderId, { method: "INVOICE", actorUserId: admin.id, note: "DEMO payment reference INV-DEMO-0001" });
      done.push("Gulf Coast (DEMO) bought 5 HHA starter seats");
    }
  }

  const [sun] = await sys.select().from(tenants).where(eq(tenants.slug, "demo-sunshine"));
  const insts = sun ? await sys.select({ id: instructors.id }).from(instructors).where(eq(instructors.tenantId, sun.id)) : [];
  if (sun && insts.length) {
    await sys
      .insert(instructorCompensation)
      .values(insts.map((i) => ({ tenantId: sun.id, instructorId: i.id, rateType: "PER_HOUR" as const, rateCents: 4500, effectiveFrom: "2026-01-01", notes: "DEMO rate" })))
      .onConflictDoNothing();
    done.push("instructor rate for Sunshine (DEMO)");
  }
  return done;
}
