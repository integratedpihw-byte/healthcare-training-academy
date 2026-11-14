import { NextResponse } from "next/server";
import { withTenant } from "@/db/server";
import { getAuthContext } from "@/lib/auth/context";
import { rateLimit } from "@/lib/auth/rate-limit";
import { systemDb } from "@/db/server";
import { uploadFile } from "@/lib/files/service";
import { PURPOSES, type Purpose } from "@/lib/files/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST multipart/form-data: purpose, entityId, file. Same-origin only (session cookie + Origin check). */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || new URL(origin).host !== host) return NextResponse.json({ error: "Cross-origin uploads are not allowed" }, { status: 403 });
  const s = await getAuthContext();
  if (!s || (s.user.mfaEnabled && !s.session.mfaVerified)) return NextResponse.json({ error: "Sign in to upload files" }, { status: 401 });
  if (!s.tenant || s.tenant.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = await rateLimit(systemDb(), `upload:${s.user.id}`, 30, 600);
  if (!rl.allowed) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const purpose = String(fd.get("purpose") ?? "") as Purpose;
  const entityId = String(fd.get("entityId") ?? "");
  const file = fd.get("file");
  if (!(purpose in PURPOSES) || !/^[0-9a-f-]{36}$/i.test(entityId) || !(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
  const data = Buffer.from(await file.arrayBuffer());
  const tenantId = s.tenant.id;
  let r: Awaited<ReturnType<typeof uploadFile>>;
  try {
    r = await withTenant({ tenantId, userId: s.user.id }, (tx) => uploadFile(tx, { tenantId, userId: s.user.id }, { purpose, entityId, filename: file.name, data }));
  } catch (e) {
    // Storage misconfiguration or outage: the metadata transaction has rolled back.
    console.error("upload failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "File storage is unavailable. Please try again later." }, { status: 503 });
  }
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 422 });
  return NextResponse.json({ id: r.data.id, filename: r.data.filename, url: `/api/files/${r.data.id}` }, { status: 201 });
}
