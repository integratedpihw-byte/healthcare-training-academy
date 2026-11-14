/**
 * Report exporters: CSV (RFC 4180, formula-injection safe), Excel (exceljs) and PDF
 * (pdf-lib, landscape tables). All run on the server; nothing is sent to the browser
 * except the finished file.
 */
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export interface ReportColumn {
  key: string;
  label: string;
  /** Relative width weight for PDF layout. */
  width?: number;
}
export type Cell = string | number | null;
export interface ReportResult {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Record<string, Cell>[];
  notes?: string[];
}

/** Neutralize spreadsheet formula injection (=, +, -, @, tab, CR at the start). */
export function safeCell(v: Cell): Cell {
  if (typeof v !== "string") return v;
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

export function toCsv(r: ReportResult): string {
  const esc = (v: Cell) => {
    const s = v == null ? "" : String(safeCell(v));
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [r.columns.map((c) => esc(c.label)).join(",")];
  for (const row of r.rows) lines.push(r.columns.map((c) => esc(row[c.key] ?? null)).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export async function toXlsx(r: ReportResult, generatedAt: Date, org: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Complete Healthcare Training Academy";
  wb.created = generatedAt;
  const ws = wb.addWorksheet(r.title.slice(0, 31).replace(/[\\/?*[\]:]/g, " "));
  ws.addRow([r.title]).font = { bold: true, size: 14 };
  ws.addRow([`${org} — generated ${generatedAt.toISOString().replace("T", " ").slice(0, 16)} UTC`]);
  if (r.subtitle) ws.addRow([r.subtitle]);
  ws.addRow([]);
  const header = ws.addRow(r.columns.map((c) => c.label));
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B2545" } }));
  for (const row of r.rows) ws.addRow(r.columns.map((c) => safeCell(row[c.key] ?? null)));
  r.columns.forEach((c, i) => (ws.getColumn(i + 1).width = Math.min(60, Math.max(12, (c.width ?? 1) * 16))));
  ws.views = [{ state: "frozen", ySplit: header.number }];
  if (r.notes?.length) {
    ws.addRow([]);
    for (const n of r.notes) ws.addRow([n]).font = { italic: true, color: { argb: "FF475569" } };
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const NAVY = rgb(11 / 255, 37 / 255, 69 / 255);
const SLATE = rgb(71 / 255, 85 / 255, 105 / 255);

function fit(text: string, font: PDFFont, size: number, max: number): string {
  // pdf-lib standard fonts are WinAnsi: replace characters it cannot encode.
  let t = text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
  if (font.widthOfTextAtSize(t, size) <= max) return t;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`.replace("…", "..."), size) > max) t = t.slice(0, -1);
  return `${t}...`;
}

export async function toPdf(r: ReportResult, generatedAt: Date, org: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(r.title);
  pdf.setCreator("Complete Healthcare Training Academy");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 792, H = 612, M = 36, size = 7.5, rowH = 12;
  const total = r.columns.reduce((s, c) => s + (c.width ?? 1), 0);
  const widths = r.columns.map((c) => ((c.width ?? 1) / total) * (W - 2 * M));
  let page = pdf.addPage([W, H]);
  let y = H - M;
  let pageNo = 1;
  const header = () => {
    page.drawText(fit(r.title, bold, 14, W - 2 * M), { x: M, y: y - 14, size: 14, font: bold, color: NAVY });
    y -= 30;
    page.drawText(fit(`${org} · generated ${generatedAt.toISOString().replace("T", " ").slice(0, 16)} UTC${r.subtitle ? ` · ${r.subtitle}` : ""}`, font, 8, W - 2 * M), { x: M, y, size: 8, font, color: SLATE });
    y -= 18;
    page.drawRectangle({ x: M, y: y - 3, width: W - 2 * M, height: rowH, color: NAVY });
    let x = M;
    r.columns.forEach((c, i) => {
      page.drawText(fit(c.label, bold, size, widths[i] - 4), { x: x + 2, y, size, font: bold, color: rgb(1, 1, 1) });
      x += widths[i];
    });
    y -= rowH;
  };
  const footer = () => page.drawText(`Page ${pageNo} · Confidential workforce training record — contains no patient information`, { x: M, y: 18, size: 7, font, color: SLATE });
  header();
  r.rows.forEach((row, idx) => {
    if (y < M + 20) {
      footer();
      page = pdf.addPage([W, H]);
      pageNo++;
      y = H - M;
      header();
    }
    if (idx % 2 === 1) page.drawRectangle({ x: M, y: y - 3, width: W - 2 * M, height: rowH, color: rgb(0.96, 0.97, 0.98) });
    let x = M;
    r.columns.forEach((c, i) => {
      const v = row[c.key];
      page.drawText(fit(v == null ? "" : String(v), font, size, widths[i] - 4), { x: x + 2, y, size, font, color: NAVY });
      x += widths[i];
    });
    y -= rowH;
  });
  if (!r.rows.length) {
    page.drawText("No records match the selected criteria.", { x: M, y: y - 4, size: 9, font, color: SLATE });
    y -= 20;
  }
  for (const n of r.notes ?? []) {
    if (y < M + 20) {
      footer();
      page = pdf.addPage([W, H]);
      pageNo++;
      y = H - M;
    }
    y -= 12;
    page.drawText(fit(n, font, 7.5, W - 2 * M), { x: M, y, size: 7.5, font, color: SLATE });
  }
  footer();
  return pdf.save();
}
