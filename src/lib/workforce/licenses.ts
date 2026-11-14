/**
 * External professional licenses and third-party certifications held by employees.
 * The academy never issues these; it records them and tracks their expiration.
 * Verification is a separate, attributable act (verifier + source), and a changed
 * expiration date resets verification (database trigger).
 */
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { employees, licenses } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { ServiceResult } from "@/lib/tenancy/service";
import type { Ctx } from "./employees";

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const optIso = iso.optional().or(z.literal("")).transform((v) => v || null);

export const LICENSE_KINDS = ["STATE_PROFESSIONAL_LICENSE", "THIRD_PARTY_CERTIFICATION"] as const;
export const LICENSE_KIND_LABELS: Record<string, string> = {
  STATE_PROFESSIONAL_LICENSE: "State professional license",
  THIRD_PARTY_CERTIFICATION: "Third-party certification",
  FACILITY_LICENSE: "Facility license",
};

export const licenseSchema = z
  .object({
    kind: z.enum(LICENSE_KINDS),
    name: z.string().trim().min(2, "Required").max(150),
    licenseNumber: z.string().trim().min(1, "Required").max(60),
    issuingAuthority: z.string().trim().min(2, "Required").max(150),
    state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Two-letter state code").optional().or(z.literal("")).transform((v) => v || null),
    issuedOn: optIso,
    expiresOn: optIso,
    notes: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => v || null),
  })
  .superRefine((v, c) => {
    if (v.issuedOn && v.expiresOn && v.expiresOn < v.issuedOn) c.addIssue({ code: "custom", path: ["expiresOn"], message: "Cannot precede the issue date" });
    if (v.kind === "STATE_PROFESSIONAL_LICENSE" && !v.state) c.addIssue({ code: "custom", path: ["state"], message: "Required for state licenses" });
  });

const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });

export async function saveLicense(tx: Tx, ctx: Ctx, employeeId: string, raw: unknown, licenseId?: string): Promise<ServiceResult<{ id: string }>> {
  const p = licenseSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const [e] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, employeeId));
  if (!e) return err("Employee not found.");
  try {
    if (licenseId) {
      const [before] = await tx.select().from(licenses).where(eq(licenses.id, licenseId));
      if (!before || before.employeeId !== employeeId) return err("License not found.");
      const r = await tx.update(licenses).set(p.data).where(eq(licenses.id, licenseId)).returning({ id: licenses.id, status: licenses.verificationStatus });
      if (!r.length) return err("You are not authorized to edit this employee's licenses.");
      await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "license.updated", entityType: "license", entityId: licenseId, before: { expiresOn: before.expiresOn, status: before.verificationStatus }, after: { expiresOn: p.data.expiresOn, status: r[0].status } });
      return { ok: true, data: { id: licenseId } };
    }
    const [row] = await tx.insert(licenses).values({ ...p.data, tenantId: ctx.tenantId, employeeId }).returning({ id: licenses.id });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "license.added", entityType: "license", entityId: row.id, after: { employeeId, kind: p.data.kind, name: p.data.name, expiresOn: p.data.expiresOn } });
    return { ok: true, data: { id: row.id } };
  } catch {
    return err("You are not authorized to manage this employee's licenses.");
  }
}

export async function verifyLicense(tx: Tx, ctx: Ctx, licenseId: string, decision: "VERIFIED" | "REJECTED", source: string): Promise<ServiceResult<null>> {
  const s = source.trim();
  if (s.length < 3) return err("Describe how the license was verified (e.g. state licensing board online lookup).");
  const [l] = await tx.select().from(licenses).where(eq(licenses.id, licenseId));
  if (!l) return err("License not found.");
  const today = new Date().toISOString().slice(0, 10);
  if (decision === "VERIFIED" && l.expiresOn && l.expiresOn < today) return err("An expired license cannot be marked verified. Record the renewed license details first.");
  const r = await tx
    .update(licenses)
    .set({ verificationStatus: decision, verifiedAt: new Date(), verifiedById: ctx.userId, verificationSource: s })
    .where(eq(licenses.id, licenseId))
    .returning({ id: licenses.id });
  if (!r.length) return err("You are not authorized to verify this license.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: decision === "VERIFIED" ? "license.verified" : "license.rejected", entityType: "license", entityId: licenseId, before: { status: l.verificationStatus }, after: { status: decision, source: s } });
  return { ok: true, data: null };
}

export async function deleteLicense(tx: Tx, ctx: Ctx, licenseId: string): Promise<ServiceResult<null>> {
  const [l] = await tx.select().from(licenses).where(eq(licenses.id, licenseId));
  if (!l) return err("License not found.");
  const r = await tx.delete(licenses).where(eq(licenses.id, licenseId)).returning({ id: licenses.id });
  if (!r.length) return err("You are not authorized to remove this license.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "license.removed", entityType: "license", entityId: licenseId, before: { employeeId: l.employeeId, name: l.name, licenseNumber: l.licenseNumber, expiresOn: l.expiresOn } });
  return { ok: true, data: null };
}

export async function listLicenses(tx: Tx, employeeId: string) {
  return tx.select().from(licenses).where(eq(licenses.employeeId, employeeId)).orderBy(asc(licenses.expiresOn));
}
