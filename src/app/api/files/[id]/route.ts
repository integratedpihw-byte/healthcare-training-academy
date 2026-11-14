import { NextResponse } from "next/server";
import { withTenant } from "@/db/server";
import { getAuthContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/audit";
import { getFile } from "@/lib/files/service";
import { storage } from "@/lib/files/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Authorized download. RLS decides visibility (parent record must be readable). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const s = await getAuthContext();
  if (!s || (s.user.mfaEnabled && !s.session.mfaVerified)) return new NextResponse("Unauthorized", { status: 401 });
  if (!s.tenant || s.tenant.status !== "ACTIVE") return new NextResponse("Not found", { status: 404 });
  const tenantId = s.tenant.id;
  const f = await withTenant({ tenantId, userId: s.user.id }, async (tx) => {
    const f = await getFile(tx, id);
    // Personnel documents are sensitive: log every access. Lesson media is not logged per view.
    if (f && f.purpose !== "LESSON_MEDIA") await writeAudit(tx, { tenantId, actorUserId: s.user.id, action: "file.downloaded", entityType: f.purpose.toLowerCase(), entityId: f.entityId, after: { fileId: f.id } });
    return f;
  });
  if (!f) return new NextResponse("Not found", { status: 404 });
  const body = await storage().get(f.storageKey);
  const inline = new URL(req.url).searchParams.get("download") !== "1" && (f.contentType.startsWith("image/") || f.contentType === "application/pdf" || f.contentType === "video/mp4");
  const headers: Record<string, string> = {
      "Content-Type": f.contentType,
      "Accept-Ranges": "bytes",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${f.filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(f.filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'",
      "Cache-Control": "private, no-store",
      "Cross-Origin-Resource-Policy": "same-origin",
  };
  // Byte ranges let the video player seek and resume.
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    const size = body.length;
    let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    let end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    end = Math.max(start, end);
    start = Math.max(0, start);
    return new NextResponse(new Uint8Array(body.subarray(start, end + 1)), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new NextResponse(new Uint8Array(body), { headers: { ...headers, "Content-Length": String(body.length) } });
}
