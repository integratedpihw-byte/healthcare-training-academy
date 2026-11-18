import { NextResponse } from "next/server";
import { systemDb } from "@/db/server";
import { getAuthContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/audit";
import { platformRevenue, usd } from "@/lib/billing/commerce";
import { toCsv, toPdf, toXlsx, type ReportResult } from "@/lib/reports/export";

export const dynamic = "force-dynamic";

/** Platform revenue export (by course/package or by organization). Platform administrators only; audited. */
export async function GET(req: Request) {
  const s = await getAuthContext();
  if (!s || !s.user.isPlatformAdmin || (s.user.mfaEnabled && !s.session.mfaVerified)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";
  const view = url.searchParams.get("view") === "organization" ? "organization" : "course";
  const date = /^\d{4}-\d{2}-\d{2}$/;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  if (!["csv", "xlsx", "pdf"].includes(format) || (from && !date.test(from)) || (to && !date.test(to))) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const sys = systemDb();
  const r = await platformRevenue(sys, { from, to });
  const money = (c: number) => usd(c);
  const result: ReportResult =
    view === "course"
      ? {
          title: "Revenue by course or package",
          subtitle: `${r.from} to ${r.to} · net ${money(r.totals.net)}`,
          columns: [{ key: "item", label: "Course or package", width: 3 }, { key: "orders", label: "Orders" }, { key: "seats", label: "Seats" }, { key: "gross", label: "Gross" }, { key: "refunds", label: "Refunds" }, { key: "net", label: "Net" }],
          rows: r.byCourse.map((x) => ({ ...x, gross: money(x.gross), refunds: money(x.refunds), net: money(x.net) })),
        }
      : {
          title: "Revenue by organization",
          subtitle: `${r.from} to ${r.to} · net ${money(r.totals.net)}`,
          columns: [{ key: "organization", label: "Organization", width: 3 }, { key: "orders", label: "Orders" }, { key: "seats", label: "Seats" }, { key: "gross", label: "Gross" }, { key: "refunds", label: "Refunds" }, { key: "net", label: "Net" }],
          rows: r.byOrg.map((x) => ({ ...x, gross: money(x.gross), refunds: money(x.refunds), net: money(x.net) })),
        };
  await writeAudit(sys, { tenantId: null, actorUserId: s.user.id, action: "report.exported", entityType: "report", entityId: `platform-revenue-${view}`, after: { format, from: r.from, to: r.to } });
  const now = new Date();
  const name = `revenue-by-${view}-${r.from}-${r.to}`;
  const h = (type: string, ext: string) => ({ "Content-Type": type, "Content-Disposition": `attachment; filename="${name}.${ext}"`, "Cache-Control": "no-store" });
  if (format === "csv") return new Response(toCsv(result), { headers: h("text/csv; charset=utf-8", "csv") });
  if (format === "xlsx") return new Response(new Uint8Array(await toXlsx(result, now, "CHITA platform")), { headers: h("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx") });
  return new Response(Buffer.from(await toPdf(result, now, "CHITA platform")), { headers: h("application/pdf", "pdf") });
}
