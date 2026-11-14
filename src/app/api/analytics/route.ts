import { NextResponse } from "next/server";
import { withTenant } from "@/db/server";
import { getAuthContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/audit";
import { can } from "@/lib/rbac/access";
import { entitlementsFor, hasFeature } from "@/lib/billing/plans";
import { analytics, filterSchema } from "@/lib/analytics/service";
import { ANALYTICS_TABLES, analyticsTable, type AnalyticsTable } from "@/lib/analytics/tables";
import { toCsv, toPdf, toXlsx } from "@/lib/reports/export";

export const dynamic = "force-dynamic";

/** Dashboard export. Requires reports.export and the Analytics plan feature; audited. */
export async function GET(req: Request) {
  const s = await getAuthContext();
  if (!s || (s.user.mfaEnabled && !s.session.mfaVerified)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!s.tenant || s.tenant.status !== "ACTIVE" || !s.access || !can(s.access, "reports.export")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasFeature(s.entitlements ?? entitlementsFor(null), "analytics")) return NextResponse.json({ error: "plan" }, { status: 402 });
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";
  const table = (url.searchParams.get("table") ?? "summary") as AnalyticsTable;
  if (!["csv", "xlsx", "pdf"].includes(format) || !ANALYTICS_TABLES.includes(table)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const f = filterSchema.parse(Object.fromEntries(url.searchParams));
  const tenantId = s.tenant.id;
  const userId = s.user.id;
  const result = await withTenant({ tenantId, userId }, async (tx) => {
    const a = await analytics(tx, f);
    const note = Object.entries(f).filter(([k, v]) => v && k !== "from" && k !== "to").length ? "filtered" : "";
    await writeAudit(tx, { tenantId, actorUserId: userId, action: "report.exported", entityType: "report", entityId: `analytics:${table}`, after: { format, filters: f } });
    return analyticsTable(a, table, note);
  });
  const now = new Date();
  const name = `analytics-${table}-${now.toISOString().slice(0, 10)}`;
  const headers = (type: string, ext: string) => ({ "Content-Type": type, "Content-Disposition": `attachment; filename="${name}.${ext}"`, "Cache-Control": "no-store" });
  if (format === "csv") return new Response(toCsv(result), { headers: headers("text/csv; charset=utf-8", "csv") });
  if (format === "xlsx") return new Response(new Uint8Array(await toXlsx(result, now, s.tenant.name)), { headers: headers("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx") });
  return new Response(Buffer.from(await toPdf(result, now, s.tenant.name)), { headers: headers("application/pdf", "pdf") });
}
