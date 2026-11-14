/**
 * Upload validation by content, not by the client's claimed type or extension.
 * Only formats needed by the product are accepted; everything else is refused.
 */
export type Kind = "pdf" | "png" | "jpeg" | "webp" | "mp4";

export const KIND_MIME: Record<Kind, string> = { pdf: "application/pdf", png: "image/png", jpeg: "image/jpeg", webp: "image/webp", mp4: "video/mp4" };

export const PURPOSES = {
  LICENSE_DOCUMENT: { kinds: ["pdf", "png", "jpeg", "webp"] as Kind[], label: "license or certification document" },
  COMPETENCY_EVIDENCE: { kinds: ["pdf", "png", "jpeg", "webp"] as Kind[], label: "competency evidence" },
  LESSON_MEDIA: { kinds: ["pdf", "png", "jpeg", "webp", "mp4"] as Kind[], label: "lesson media" },
} as const;
export type Purpose = keyof typeof PURPOSES;

export function sniff(buf: Buffer): Kind | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  if (buf.length >= 12 && buf.subarray(4, 8).toString("latin1") === "ftyp") return "mp4";
  return null;
}

/** Strip paths and control characters; keep a readable, header-safe name. */
export function safeFilename(name: string, kind: Kind): string {
  const base = (name.split(/[\\/]/).pop() ?? "file").normalize("NFKC").replace(/[\u0000-\u001f\u007f"<>:|?*;]/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || "file";
  const ext = kind === "jpeg" ? "jpg" : kind;
  return /\.[a-z0-9]{2,4}$/i.test(base) ? base.replace(/\.[a-z0-9]{2,4}$/i, `.${ext}`) : `${base}.${ext}`;
}

export function maxBytes(purpose: Purpose): number {
  const mb = Number(process.env[purpose === "LESSON_MEDIA" ? "UPLOAD_MAX_MEDIA_MB" : "UPLOAD_MAX_MB"] ?? (purpose === "LESSON_MEDIA" ? 50 : 10));
  return Math.max(1, mb) * 1024 * 1024;
}

/** PDFs that can run code or auto-act when opened are refused (defense in depth). */
export function pdfLooksActive(buf: Buffer): boolean {
  const s = buf.toString("latin1");
  return /\/JavaScript|\/JS\s*[(<]|\/Launch|\/EmbeddedFile|\/OpenAction\s*<<[^>]*\/S\s*\/JavaScript/.test(s);
}
