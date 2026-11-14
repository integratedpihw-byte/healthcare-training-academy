/**
 * File upload service. Order of operations: size → content sniff → type allowlist →
 * active-PDF check → malware scan → RLS-checked metadata insert (the parent record
 * and permission are verified by the database) → write to private storage. If the
 * storage write fails, the transaction rolls back so no orphaned metadata remains.
 */
import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { files } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { dbErrorMessage } from "@/lib/forms";
import type { ServiceResult } from "@/lib/tenancy/service";
import { KIND_MIME, PURPOSES, maxBytes, pdfLooksActive, safeFilename, sniff, type Purpose } from "./validate";
import { scan } from "./scan";
import { storage } from "./storage";

export interface FileCtx {
  tenantId: string;
  userId: string;
}

export async function uploadFile(tx: Tx, ctx: FileCtx, input: { purpose: Purpose; entityId: string; filename: string; data: Buffer }): Promise<ServiceResult<{ id: string; filename: string }>> {
  const def = PURPOSES[input.purpose];
  if (!def) return { ok: false, error: "Unknown upload type." };
  if (!input.data.length) return { ok: false, error: "The file is empty." };
  if (input.data.length > maxBytes(input.purpose)) return { ok: false, error: `Files must be ${Math.round(maxBytes(input.purpose) / 1048576)} MB or smaller.` };
  const kind = sniff(input.data);
  if (!kind || !def.kinds.includes(kind)) return { ok: false, error: `Unsupported file type. Allowed for ${def.label}: ${def.kinds.map((k) => k.toUpperCase()).join(", ")}.` };
  if (kind === "pdf" && pdfLooksActive(input.data)) return { ok: false, error: "This PDF contains scripts or embedded files and cannot be accepted. Print it to a new PDF and try again." };
  const s = await scan(input.data);
  if (s.status === "INFECTED") {
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "file.rejected_malware", entityType: input.purpose.toLowerCase(), entityId: input.entityId, after: { signature: s.signature } });
    return { ok: false, error: "The file failed the malware scan and was not stored." };
  }
  if (s.status === "ERROR" || (s.status === "NOT_SCANNED" && process.env.UPLOAD_REQUIRE_SCAN === "1")) return { ok: false, error: "Uploads are temporarily unavailable (malware scanner not reachable). Please try again later." };

  const id = randomUUID();
  const filename = safeFilename(input.filename, kind);
  const key = `${ctx.tenantId}/${input.purpose.toLowerCase()}/${id}`;
  const sha256 = createHash("sha256").update(input.data).digest("hex");
  try {
    await tx.transaction(async (sp) => {
      await sp.insert(files).values({ id, tenantId: ctx.tenantId, purpose: input.purpose, entityId: input.entityId, filename, contentType: KIND_MIME[kind], sizeBytes: input.data.length, sha256, storageKey: key, scanStatus: s.status === "CLEAN" ? "CLEAN" : "NOT_SCANNED", uploadedById: ctx.userId });
    });
  } catch (e) {
    return { ok: false, error: /security/.test(dbErrorMessage(e)) ? "You are not authorized to attach files to this record." : "Could not save the file." };
  }
  await storage().put(key, input.data, KIND_MIME[kind]);
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "file.uploaded", entityType: input.purpose.toLowerCase(), entityId: input.entityId, after: { fileId: id, filename, bytes: input.data.length, sha256, scan: s.status } });
  return { ok: true, data: { id, filename } };
}

export async function listFiles(tx: Tx, purpose: Purpose, entityId: string) {
  return tx.select().from(files).where(and(eq(files.purpose, purpose), eq(files.entityId, entityId), isNull(files.deletedAt))).orderBy(desc(files.createdAt));
}

export async function removeFile(tx: Tx, ctx: FileCtx, id: string): Promise<ServiceResult<null>> {
  const [f] = await tx.select({ purpose: files.purpose, entityId: files.entityId }).from(files).where(and(eq(files.id, id), isNull(files.deletedAt)));
  if (!f) return { ok: false, error: "File not found or not authorized." };
  try {
    // No RETURNING: the removed row is no longer visible under the read policy.
    const r = await tx.transaction((sp) => sp.update(files).set({ deletedAt: new Date(), deletedById: ctx.userId }).where(eq(files.id, id)));
    if (!r.rowCount) return { ok: false, error: "File not found or not authorized." };
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "file.removed", entityType: f.purpose.toLowerCase(), entityId: f.entityId, after: { fileId: id } });
    // Bytes are retained for the records-retention period; purge per retention policy.
    return { ok: true, data: null };
  } catch (e) {
    const m = dbErrorMessage(e);
    return { ok: false, error: /signed evaluation/.test(m) ? "Evidence on a signed evaluation cannot be removed." : "File not found or not authorized." };
  }
}

/** Metadata visible to the caller (RLS), for the download route. */
export async function getFile(tx: Tx, id: string) {
  const [f] = await tx.select().from(files).where(and(eq(files.id, id), isNull(files.deletedAt)));
  return f ?? null;
}
