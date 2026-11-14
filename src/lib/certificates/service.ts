/**
 * Certificate engine (spec §10).
 *
 * - Issued ONLY by platform services after an enrollment is COMPLETED (the database
 *   additionally refuses a course certificate for an incomplete enrollment and
 *   refuses continuing-education certificates without a recorded accreditation).
 * - Identity fields are immutable; expiration can never be extended; revocation is
 *   permanent (database triggers). Renewal = completing the course again, which
 *   issues a new certificate and marks the previous one SUPERSEDED.
 * - Every certificate states that it is an internal course-completion record and
 *   not a license, professional certification or accredited CE credit.
 */
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { Db, Tx } from "@/db/client";
import { certificateVerifications, certificates, courses, employees, enrollments, organizations, tenants, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { sha256 } from "@/lib/auth/crypto";
import { notify } from "@/lib/notify/notifications";
import { rateLimit } from "@/lib/auth/rate-limit";

export const ACADEMY_NAME = "Complete Healthcare Innovative Training Academy";
export const CERTIFICATE_DISCLAIMER =
  "This certificate documents completion of an internal training course. It is not a state license, professional certification, or accredited continuing education credit.";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function randomCode(length: number) {
  const bytes = randomBytes(length);
  let s = "";
  for (let i = 0; i < length; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

export function newCertificateNumber(date = new Date()) {
  return `CHTA-${date.getUTCFullYear()}-${randomCode(8)}`;
}

export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function verificationUrl(code: string) {
  return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/verify/${code}`;
}

export type EffectiveStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUPERSEDED";
export function effectiveStatus(c: { status: EffectiveStatus; expiresOn: string | null }, today = new Date().toISOString().slice(0, 10)): EffectiveStatus {
  if (c.status === "ACTIVE" && c.expiresOn && c.expiresOn < today) return "EXPIRED";
  return c.status;
}

/**
 * Idempotently issues the course-completion certificate for a COMPLETED enrollment.
 * Returns null when the course is not certificate-eligible.
 */
export async function issueForEnrollment(sys: Db, enrollmentId: string): Promise<{ id: string; created: boolean } | null> {
  return sys.transaction(async (tx) => {
    const [existing] = await tx.select({ id: certificates.id }).from(certificates).where(eq(certificates.enrollmentId, enrollmentId));
    if (existing) return { id: existing.id, created: false };
    const [row] = await tx
      .select({ e: enrollments, course: courses, user: { id: users.id, firstName: users.firstName, lastName: users.lastName } })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .innerJoin(users, eq(users.id, enrollments.userId))
      .where(eq(enrollments.id, enrollmentId));
    if (!row) throw new Error("Enrollment not found");
    if (row.e.status !== "COMPLETED" || !row.e.completedAt) throw new Error("Enrollment is not completed");
    if (!row.course.certificateEligible) return null;

    const [org] = await tx.select({ name: organizations.displayName }).from(organizations).where(eq(organizations.tenantId, row.e.tenantId)).limit(1);
    const [tenant] = await tx.select({ name: tenants.name, type: tenants.type }).from(tenants).where(eq(tenants.id, row.e.tenantId));
    const [emp] = await tx.select({ id: employees.id }).from(employees).where(and(eq(employees.tenantId, row.e.tenantId), eq(employees.userId, row.e.userId))).limit(1);
    const completedOn = row.e.completedAt.toISOString().slice(0, 10);

    // Renewal: the newest completion supersedes earlier active certificates for this course.
    const superseded = await tx
      .update(certificates)
      .set({ status: "SUPERSEDED" })
      .where(and(eq(certificates.tenantId, row.e.tenantId), eq(certificates.userId, row.e.userId), eq(certificates.courseId, row.course.id), inArray(certificates.status, ["ACTIVE", "EXPIRED"])))
      .returning({ id: certificates.id });

    const [cert] = await tx
      .insert(certificates)
      .values({
        tenantId: row.e.tenantId,
        userId: row.e.userId,
        employeeId: emp?.id ?? null,
        courseId: row.course.id,
        enrollmentId,
        kind: "COURSE_COMPLETION",
        certificateNumber: newCertificateNumber(),
        verificationCode: randomCode(10),
        recipientName: `${row.user.firstName} ${row.user.lastName}`,
        courseTitle: row.course.title,
        courseCode: row.course.code,
        trainingHours: (Math.round((row.course.estimatedMinutes / 60) * 100) / 100).toFixed(2),
        issuingAuthority: tenant?.type === "INDIVIDUAL" ? ACADEMY_NAME : `${ACADEMY_NAME} on behalf of ${org?.name ?? tenant?.name ?? "the organization"}`,
        completedOn,
        expiresOn: row.course.renewalMonths ? addMonths(completedOn, row.course.renewalMonths) : null,
        supersedesId: superseded[0]?.id ?? null,
      })
      .returning({ id: certificates.id, number: certificates.certificateNumber });

    await writeAudit(tx, {
      tenantId: row.e.tenantId,
      actorUserId: null,
      action: "certificate.issued",
      entityType: "certificate",
      entityId: cert.id,
      after: { number: cert.number, enrollmentId, courseId: row.course.id, userId: row.e.userId, superseded: superseded.map((s) => s.id) },
    });
    await notify(tx, {
      tenantId: row.e.tenantId,
      userId: row.e.userId,
      type: "certificate.available",
      title: "Your certificate is ready",
      body: `You completed ${row.course.title}. Download your certificate from the Certificates page.`,
      link: `/certificates/${cert.id}`,
      dedupeKey: `cert:${cert.id}`,
    });
    return { id: cert.id, created: true };
  });
}

/** Repairs any completed, certificate-eligible enrollment that lacks a certificate (idempotent). */
export async function ensureCertificates(sys: Db, tenantId: string, userId?: string) {
  const rows = await sys
    .select({ id: enrollments.id })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(
      and(
        eq(enrollments.tenantId, tenantId),
        userId ? eq(enrollments.userId, userId) : undefined,
        eq(enrollments.status, "COMPLETED"),
        eq(courses.certificateEligible, true),
        sql`not exists (select 1 from certificates c where c.enrollment_id = ${enrollments.id})`,
      ),
    );
  for (const r of rows) await issueForEnrollment(sys, r.id);
  return rows.length;
}

// ---------------------------------------------------------------------------
// Queries (tenant tx, RLS)
// ---------------------------------------------------------------------------

export async function listCertificates(tx: Tx, opts: { userId?: string; status?: string; q?: string } = {}) {
  return tx
    .select({
      id: certificates.id,
      number: certificates.certificateNumber,
      kind: certificates.kind,
      recipientName: certificates.recipientName,
      userId: certificates.userId,
      courseTitle: certificates.courseTitle,
      courseCode: certificates.courseCode,
      completedOn: certificates.completedOn,
      expiresOn: certificates.expiresOn,
      status: certificates.status,
      issuedAt: certificates.issuedAt,
      trainingHours: certificates.trainingHours,
    })
    .from(certificates)
    .where(
      and(
        opts.userId ? eq(certificates.userId, opts.userId) : undefined,
        opts.status === "EXPIRED"
          ? sql`(${certificates.status} = 'EXPIRED' or (${certificates.status} = 'ACTIVE' and ${certificates.expiresOn} < current_date))`
          : opts.status === "ACTIVE"
            ? sql`${certificates.status} = 'ACTIVE' and (${certificates.expiresOn} is null or ${certificates.expiresOn} >= current_date)`
            : opts.status
              ? sql`${certificates.status}::text = ${opts.status}`
              : undefined,
        opts.q ? sql`(${certificates.recipientName} ilike ${"%" + opts.q + "%"} or ${certificates.courseTitle} ilike ${"%" + opts.q + "%"} or ${certificates.certificateNumber} ilike ${"%" + opts.q + "%"})` : undefined,
      ),
    )
    .orderBy(desc(certificates.issuedAt))
    .limit(500);
}

export async function getCertificate(tx: Tx | Db, id: string) {
  const [c] = await tx.select().from(certificates).where(eq(certificates.id, id));
  return c ?? null;
}

export async function revokeCertificate(tx: Tx, ctx: { tenantId: string; userId: string }, id: string, reason: string) {
  const r = reason.trim();
  if (r.length < 10) return { ok: false as const, error: "Explain the reason for revocation (at least 10 characters)." };
  const [c] = await tx.select().from(certificates).where(eq(certificates.id, id));
  if (!c) return { ok: false as const, error: "Certificate not found." };
  if (c.status === "REVOKED") return { ok: false as const, error: "This certificate is already revoked." };
  const updated = await tx
    .update(certificates)
    .set({ status: "REVOKED", revokedAt: new Date(), revokedById: ctx.userId, revocationReason: r })
    .where(eq(certificates.id, id))
    .returning({ id: certificates.id });
  if (!updated.length) return { ok: false as const, error: "You do not have permission to revoke certificates." };
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "certificate.revoked", entityType: "certificate", entityId: id, before: { status: c.status }, after: { status: "REVOKED", reason: r } });
  return { ok: true as const, data: { userId: c.userId, courseTitle: c.courseTitle } };
}

/** Scheduled job: marks ACTIVE certificates past their expiration date as EXPIRED. */
export async function expireDueCertificates(sys: Db): Promise<number> {
  const rows = await sys
    .update(certificates)
    .set({ status: "EXPIRED" })
    .where(and(eq(certificates.status, "ACTIVE"), lt(certificates.expiresOn, sql`current_date`)))
    .returning({ id: certificates.id, tenantId: certificates.tenantId, userId: certificates.userId, courseTitle: certificates.courseTitle });
  for (const r of rows) {
    await writeAudit(sys, { tenantId: r.tenantId, actorUserId: null, action: "certificate.expired", entityType: "certificate", entityId: r.id });
    await notify(sys, { tenantId: r.tenantId, userId: r.userId, type: "certificate.expired", title: "A certificate has expired", body: `Your certificate for ${r.courseTitle} has expired. Retake the course to renew it.`, link: `/certificates/${r.id}`, dedupeKey: `cert-expired:${r.id}` });
  }
  return rows.length;
}

// ---------------------------------------------------------------------------
// Public verification (system client; rate-limited; minimal disclosure)
// ---------------------------------------------------------------------------

export interface VerificationResult {
  found: boolean;
  rateLimited?: boolean;
  certificate?: {
    number: string;
    recipientName: string;
    courseTitle: string;
    courseCode: string | null;
    completedOn: string;
    expiresOn: string | null;
    trainingHours: string;
    issuingAuthority: string;
    kind: string;
    status: EffectiveStatus;
    revokedAt: Date | null;
  };
}

export async function verifyCertificate(sys: Db, code: string, meta: { ip?: string | null; userAgent?: string | null }): Promise<VerificationResult> {
  const lim = await rateLimit(sys, `verify:${meta.ip ?? "unknown"}`, 60, 15 * 60);
  if (!lim.allowed) return { found: false, rateLimited: true };
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z2-9]{10}$/.test(clean)) return { found: false };
  const [c] = await sys.select().from(certificates).where(eq(certificates.verificationCode, clean));
  if (!c) return { found: false };
  await sys.insert(certificateVerifications).values({
    tenantId: c.tenantId,
    certificateId: c.id,
    ipHash: meta.ip ? sha256(`${meta.ip}:${process.env.ENCRYPTION_KEY ?? ""}`).slice(0, 32) : null,
    userAgent: meta.userAgent?.slice(0, 200) ?? null,
  });
  return {
    found: true,
    certificate: {
      number: c.certificateNumber,
      recipientName: c.recipientName,
      courseTitle: c.courseTitle,
      courseCode: c.courseCode,
      completedOn: c.completedOn,
      expiresOn: c.expiresOn,
      trainingHours: c.trainingHours,
      issuingAuthority: c.issuingAuthority,
      kind: c.kind,
      status: effectiveStatus(c),
      revokedAt: c.revokedAt,
    },
  };
}
