import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { withTenant } from "@/db/server";
import { getCertificate } from "@/lib/certificates/service";
import { renderCertificatePdf } from "@/lib/certificates/pdf";
import { can } from "@/lib/rbac/access";

export const dynamic = "force-dynamic";

/** Certificate PDF: the recipient, or users with certificates.view_all in the same organization. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const ctx = await getAuthContext();
  if (!ctx || (ctx.user.mfaEnabled && !ctx.session.mfaVerified)) return new NextResponse("Unauthorized", { status: 401 });
  if (!ctx.tenant || ctx.tenant.status !== "ACTIVE") return new NextResponse("Forbidden", { status: 403 });
  const cert = await withTenant({ tenantId: ctx.tenant.id, userId: ctx.user.id }, (tx) => getCertificate(tx, id));
  if (!cert) return new NextResponse("Not found", { status: 404 }); // other tenants' certificates are invisible (RLS)
  if (cert.userId !== ctx.user.id && !can(ctx.access, "certificates.view_all") && !can(ctx.access, "team.view")) return new NextResponse("Forbidden", { status: 403 });
  const bytes = await renderCertificatePdf({ ...cert, status: cert.status });
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cert.certificateNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
