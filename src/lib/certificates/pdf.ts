/**
 * Server-side certificate PDF (US Letter, landscape) generated on demand from the
 * immutable certificate record, with a verification QR code and URL.
 */
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { CERTIFICATE_SEAL_PNG_BASE64 } from "./logo-data";
import { ACADEMY_NAME, CERTIFICATE_DISCLAIMER, effectiveStatus, verificationUrl, type EffectiveStatus } from "./service";

const NAVY = rgb(11 / 255, 37 / 255, 69 / 255);
const TEAL = rgb(19 / 255, 163 / 255, 176 / 255);
const SLATE = rgb(71 / 255, 85 / 255, 105 / 255);
const RED = rgb(185 / 255, 28 / 255, 28 / 255);

export interface CertificatePdfData {
  certificateNumber: string;
  verificationCode: string;
  recipientName: string;
  courseTitle: string;
  courseCode: string | null;
  completedOn: string;
  expiresOn: string | null;
  trainingHours: string;
  issuingAuthority: string;
  issuedAt: Date;
  status: EffectiveStatus;
  kind: string;
}

function fmt(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(`${iso}T12:00:00Z`) : iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = NAVY, maxWidth = 640) {
  let s = size;
  while (font.widthOfTextAtSize(text, s) > maxWidth && s > 9) s -= 0.5;
  const w = font.widthOfTextAtSize(text, s);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size: s, font, color });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderCertificatePdf(c: CertificatePdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate ${c.certificateNumber}`);
  pdf.setAuthor(ACADEMY_NAME);
  pdf.setSubject(`${c.courseTitle} — ${c.recipientName}`);
  pdf.setCreator(ACADEMY_NAME);
  const page = pdf.addPage([792, 612]);
  const W = page.getWidth();
  const H = page.getHeight();
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Border
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: NAVY, borderWidth: 3 });
  page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: TEAL, borderWidth: 1 });

  // Round CHITA badge, with the full registered name beneath it
  const badge = await pdf.embedPng(Buffer.from(CERTIFICATE_SEAL_PNG_BASE64, "base64"));
  page.drawImage(badge, { x: (W - 78) / 2, y: H - 36 - 78, width: 78, height: 78 });
  centered(page, ACADEMY_NAME.toUpperCase(), H - 126, sansBold, 9, NAVY);

  const title = c.kind === "CONTINUING_EDUCATION" ? "Certificate of Continuing Education" : "Certificate of Course Completion";
  centered(page, title, H - 160, serif, 34, NAVY);
  centered(page, "This certifies that", H - 196, serifItalic, 15, SLATE);
  centered(page, c.recipientName, H - 240, serif, 36, NAVY);
  page.drawLine({ start: { x: W / 2 - 220, y: H - 250 }, end: { x: W / 2 + 220, y: H - 250 }, thickness: 1, color: TEAL });
  centered(page, "has successfully completed the course", H - 278, serifItalic, 15, SLATE);
  centered(page, c.courseTitle, H - 312, serif, 22, NAVY);
  centered(page, [c.courseCode ? `Course ID ${c.courseCode}` : null, `${Number(c.trainingHours).toFixed(2)} training hours`].filter(Boolean).join("   •   "), H - 336, sans, 11, SLATE);

  // Details
  const left = 70;
  let y = 178;
  const detail = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x: left, y, size: 8, font: sansBold, color: SLATE });
    page.drawText(value, { x: left, y: y - 13, size: 11, font: sans, color: NAVY });
    y -= 34;
  };
  detail("Completion date", fmt(c.completedOn));
  detail("Certificate number", c.certificateNumber);
  detail(c.expiresOn ? "Valid through" : "Expiration", c.expiresOn ? fmt(c.expiresOn) : "No expiration set for this course");

  // Issuing authority (center-right)
  const ix = 300;
  page.drawLine({ start: { x: ix, y: 152 }, end: { x: ix + 230, y: 152 }, thickness: 0.8, color: SLATE });
  wrap(c.issuingAuthority, sans, 9, 230).forEach((l, i) => page.drawText(l, { x: ix, y: 140 - i * 11, size: 9, font: sans, color: NAVY }));
  page.drawText("ISSUING AUTHORITY", { x: ix, y: 160, size: 8, font: sansBold, color: SLATE });
  page.drawText(`Issued ${fmt(c.issuedAt)}`, { x: ix, y: 104, size: 8, font: sans, color: SLATE });

  // QR + verification
  const url = verificationUrl(c.verificationCode);
  const png = await QRCode.toBuffer(url, { margin: 1, width: 240, errorCorrectionLevel: "M" });
  const qr = await pdf.embedPng(png);
  page.drawImage(qr, { x: W - 70 - 96, y: 92, width: 96, height: 96 });
  const vText = "Verify this certificate";
  page.drawText(vText, { x: W - 70 - 96, y: 80, size: 8, font: sansBold, color: NAVY });
  // Right-aligned under the QR code and shrunk if needed, so long addresses stay inside the border.
  const shown = url.replace(/^https?:\/\//, "");
  let us = 7;
  while (us > 5 && sans.widthOfTextAtSize(shown, us) > 250) us -= 0.25;
  page.drawText(shown, { x: W - 70 - sans.widthOfTextAtSize(shown, us), y: 68, size: us, font: sans, color: SLATE });
  page.drawText(`Code: ${c.verificationCode}`, { x: W - 70 - 96, y: 58, size: 8, font: sans, color: SLATE });

  // Disclaimer
  wrap(CERTIFICATE_DISCLAIMER, sans, 7.5, 470).forEach((l, i) => page.drawText(l, { x: left, y: 52 - i * 9, size: 7.5, font: sans, color: SLATE }));

  // Status overlay for non-active certificates (the PDF always reflects current status)
  const status = effectiveStatus({ status: c.status, expiresOn: c.expiresOn });
  if (status !== "ACTIVE") {
    page.drawText(status, { x: 170, y: 250, size: 110, font: sansBold, color: RED, opacity: 0.18, rotate: degrees(20) });
  }
  return pdf.save();
}
