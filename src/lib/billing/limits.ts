/**
 * Plan limits (spec §19). Checked before creating employees, facilities or
 * departments. Returns a user-facing message when the plan does not allow it.
 */
import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { hasFeature, type Entitlements } from "./plans";

export async function planLimitCheck(tx: Tx, e: Entitlements, kind: "employee" | "facility" | "department"): Promise<string | null> {
  if (e.restricted) return "Your subscription is not active. Reactivate it under Billing to add records.";
  if (kind === "employee") {
    if (e.plan.unit !== "employee") return null;
    const [r] = (await tx.execute<{ n: number }>(sql`select count(*)::int n from employees where employment_status <> 'TERMINATED'`)).rows;
    return r.n >= e.seats ? `Your ${e.plan.name} plan includes ${e.seats} employee seats and all are in use. Add seats or upgrade under Billing.` : null;
  }
  if (kind === "facility") {
    if (e.maxFacilities == null) return null;
    const [r] = (await tx.execute<{ n: number }>(sql`select count(*)::int n from facilities where is_active`)).rows;
    return r.n >= e.maxFacilities ? `Your ${e.plan.name} plan includes ${e.maxFacilities} active facilit${e.maxFacilities === 1 ? "y" : "ies"}. Upgrade under Billing to add more.` : null;
  }
  if (!hasFeature(e, "multiDepartment")) {
    const [r] = (await tx.execute<{ n: number }>(sql`select count(*)::int n from departments`)).rows;
    return r.n >= 1 ? `Multiple departments are included in the Professional and Enterprise plans. Upgrade under Billing.` : null;
  }
  return null;
}
