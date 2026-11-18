/**
 * Server-side certificate PDF (US Letter, landscape) generated on demand from the
 * immutable certificate record, with a verification QR code and URL.
 */
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { CERTIFICATE_SEAL_PNG_BASE64 } from "./logo-data";
import { ACADEMY_NAME, disclaimerFor, effectiveStatus, verificationUrl, type EffectiveStatus } from "./service";
import { CERT_TITLE, PROGRAM_LABEL } from "./labels";

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
  programClassification?: string | null;
  programNotice?: string | null;
  instructorName?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  renewalRequirements?: string | null;
  accreditation?: unknown;
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

  centered(page, CERT_TITLE[c.kind] ?? "Certificate of Course Completion", H - 160, serif, 32, NAVY);
  centered(page, "This certifies that", H - 194, serifItalic, 15, SLATE);
  centered(page, c.recipientName, H - 236, serif, 34, NAVY);
  page.drawLine({ start: { x: W / 2 - 220, y: H - 246 }, end: { x: W / 2 + 220, y: H - 246 }, thickness: 1, color: TEAL });
  const phrase =
    c.kind === "COMPETENCY_VERIFICATION" ? "has demonstrated competency in" : c.kind === "INSTRUCTOR" ? "is authorized as an instructor for" : "has successfully completed the course";
  centered(page, phrase, H - 272, serifItalic, 15, SLATE);
  centered(page, c.courseTitle, H - 304, serif, 22, NAVY);
  const hoursText = c.kind === "COMPETENCY_VERIFICATION" ? null : `${Number(c.trainingHours).toFixed(2)} ${c.kind === "INSTRUCTOR" ? "instructor training" : "training"} hours`;
  centered(page, [c.courseCode ? `ID ${c.courseCode}` : null, hoursText].filter(Boolean).join("   •   "), H - 326, sans, 11, SLATE);
  if (c.programClassification && PROGRAM_LABEL[c.programClassification]) centered(page, `Program type: ${PROGRAM_LABEL[c.programClassification].label}`, H - 342, sans, 9, TEAL);

  // Details
  const left = 70;
  let y = 206;
  const detail = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x: left, y, size: 8, font: sansBold, color: SLATE });
    page.drawText(value.length > 44 ? `${value.slice(0, 43)}…` : value, { x: left, y: y - 13, size: 10.5, font: sans, color: NAVY });
    y -= 29;
  };
  detail(c.kind === "COMPETENCY_VERIFICATION" ? "Evaluation date" : c.kind === "INSTRUCTOR" ? "Authorization date" : "Completion date", fmt(c.completedOn));
  detail("Certificate number", c.certificateNumber);
  detail(c.expiresOn ? "Valid through" : "Expiration", c.expiresOn ? fmt(c.expiresOn) : "No expiration set");
  if (c.instructorName) detail(c.kind === "COMPETENCY_VERIFICATION" ? "Evaluator" : "Instructor", c.instructorName);

  // Authorized signature (typed name of the organization's signatory) and issuing authority
  const ix = 300;
  if (c.signatoryName) {
    page.drawText(c.signatoryName, { x: ix, y: 178, size: 17, font: serifItalic, color: NAVY });
    page.drawLine({ start: { x: ix, y: 172 }, end: { x: ix + 230, y: 172 }, thickness: 0.8, color: SLATE });
    page.drawText(`${c.signatoryName}${c.signatoryTitle ? `, ${c.signatoryTitle}` : ""}`.slice(0, 60), { x: ix, y: 161, size: 8.5, font: sansBold, color: NAVY });
    page.drawText("AUTHORIZED SIGNATURE", { x: ix, y: 151, size: 7, font: sansBold, color: SLATE });
  } else {
    page.drawText("ISSUING AUTHORITY", { x: ix, y: 180, size: 8, font: sansBold, color: SLATE });
    page.drawLine({ start: { x: ix, y: 172 }, end: { x: ix + 230, y: 172 }, thickness: 0.8, color: SLATE });
  }
  wrap(c.issuingAuthority, sans, 9, 230).forEach((l, i) => page.drawText(l, { x: ix, y: 138 - i * 11, size: 9, font: sans, color: NAVY }));
  page.drawText(`Issued ${fmt(c.issuedAt)}`, { x: ix, y: 108, size: 8, font: sans, color: SLATE });

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

  // Program notice, renewal requirements and disclaimer
  const acc = c.accreditation as { provider?: string; approvalNumber?: string; body?: string } | null | undefined;
  const fine = [
    acc?.approvalNumber ? `Approved by ${acc.body ?? acc.provider}, approval no. ${acc.approvalNumber}.` : null,
    c.programNotice,
    c.renewalRequirements ? `Renewal: ${c.renewalRequirements}` : null,
    disclaimerFor(c.kind),
  ].filter(Boolean).join(" ");
  const lines = wrap(fine, sans, 7, 500).slice(0, 6);
  lines.forEach((l, i) => page.drawText(l, { x: left, y: 40 + (lines.length - 1 - i) * 8.5, size: 7, font: sans, color: SLATE }));

  // Status overlay for non-active certificates (the PDF always reflects current status)
  const status = effectiveStatus({ status: c.status, expiresOn: c.expiresOn });
  if (status !== "ACTIVE") {
    page.drawText(status, { x: 170, y: 250, size: 110, font: sansBold, color: RED, opacity: 0.18, rotate: degrees(20) });
  }
  return pdf.save();
}
