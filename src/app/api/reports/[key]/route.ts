import { NextResponse } from "next/server";
import { withTenant } from "@/db/server";
import { getAuthContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/audit";
import { can } from "@/lib/rbac/access";
import { getReport, paramsSchema } from "@/lib/reports/definitions";
import { toCsv, toPdf, toXlsx } from "@/lib/reports/export";

export const dynamic = "force-dynamic";

/** Report export (PDF / Excel / CSV). Requires reports.export; every export is audited. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const def = getReport(key);
  if (!def) return NextResponse.json({ error: "not found" }, { status: 404 });
  const s = await getAuthContext();
  if (!s || (s.user.mfaEnabled && !s.session.mfaVerified)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!s.tenant || s.tenant.status !== "ACTIVE") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const access = s.access;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";
  if (!["csv", "xlsx", "pdf"].includes(format)) return NextResponse.json({ error: "bad format" }, { status: 400 });
  const parsed = paramsSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "invalid parameters" }, { status: 400 });
  const p = parsed.data;
  if ((def.required ?? []).some((k) => !p[k])) return NextResponse.json({ error: "missing parameters" }, { status: 400 });
  const tenantId = s.tenant.id;
  const userId = s.user.id;
  const result = await withTenant({ tenantId, userId }, async (tx) => {
    if (!access || !can(access, "reports.export")) return null;
    const r = await def.run(tx, { tenantId, userId, access }, p);
    await writeAudit(tx, { tenantId, actorUserId: userId, action: "report.exported", entityType: "report", entityId: key, after: { format, params: p, rows: r.rows.length } });
    return r;
  });
  if (!result) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const now = new Date();
  const name = `${key}-${now.toISOString().slice(0, 10)}`;
  const headers = (type: string, ext: string) => ({ "Content-Type": type, "Content-Disposition": `attachment; filename="${name}.${ext}"`, "Cache-Control": "no-store" });
  if (format === "csv") return new Response(toCsv(result), { headers: headers("text/csv; charset=utf-8", "csv") });
  if (format === "xlsx") return new Response(new Uint8Array(await toXlsx(result, now, s.tenant.name)), { headers: headers("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx") });
  return new Response(Buffer.from(await toPdf(result, now, s.tenant.name)), { headers: headers("application/pdf", "pdf") });
}
