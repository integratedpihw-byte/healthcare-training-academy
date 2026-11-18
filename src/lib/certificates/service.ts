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
import { certificateVerifications, certificates, courseVersions, courses, employees, enrollments, organizations, tenants, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { sha256 } from "@/lib/auth/crypto";
import { notify } from "@/lib/notify/notifications";
import { rateLimit } from "@/lib/auth/rate-limit";

export const ACADEMY_NAME = "Complete Healthcare Innovative Training Academy";
export const CERTIFICATE_DISCLAIMER =
  "This certificate documents completion of an internal training course. It is not a state license, professional certification, or accredited continuing education credit.";
/** Disclaimer per certificate type; CE certificates name their real approval instead. */
export function disclaimerFor(kind: string): string {
  switch (kind) {
    case "CONTINUING_EDUCATION":
      return "Continuing education credit is granted only under the approval shown on this certificate.";
    case "COMPETENCY_VERIFICATION":
      return "This certificate records a skills evaluation signed by the named evaluator. It is not a state license or professional certification.";
    case "INSTRUCTOR":
      return "This certificate records that the academy authorized the holder to teach the named course. It is not a teaching license or a third-party instructor certification.";
    default:
      return CERTIFICATE_DISCLAIMER;
  }
}

/** Typed signatory for certificates (never an image of a signature). */
export function academySignatory(): { name: string | null; title: string | null } {
  return { name: process.env.ACADEMY_SIGNATORY_NAME?.trim() || null, title: process.env.ACADEMY_SIGNATORY_TITLE?.trim() || null };
}

/** Initials-only display for the public verification page ("Maria L. Gomez" → "M. L. G."). */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(" ");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function randomCode(length: number) {
  const bytes = randomBytes(length);
  let s = "";
  for (let i = 0; i < length; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

export function newCertificateNumber(date = new Date()) {
  return `CHITA-${date.getUTCFullYear()}-${randomCode(8)}`;
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

    const [org] = await tx
      .select({ name: organizations.displayName, signatoryName: organizations.certificateSignatoryName, signatoryTitle: organizations.certificateSignatoryTitle })
      .from(organizations)
      .where(eq(organizations.tenantId, row.e.tenantId))
      .limit(1);
    const [ver] = await tx.select({ notice: courseVersions.credentialNotice, renewal: courseVersions.renewalRequirements }).from(courseVersions).where(eq(courseVersions.id, row.e.courseVersionId));
    // Instructor: the instructor of a class for this course the learner attended, if any.
    const [ins] = (
      await tx.execute<{ name: string }>(sql`
        select u.first_name || ' ' || u.last_name as name
          from attendance a
          join training_sessions s on s.id = a.session_id
          join instructors i on i.id = s.instructor_id
          join users u on u.id = i.user_id
         where a.user_id = ${row.e.userId}::uuid and s.course_id = ${row.course.id}::uuid and s.tenant_id = ${row.e.tenantId}::uuid
           and a.status = 'PRESENT'
         order by s.starts_at desc limit 1`)
    ).rows;
    const [tenant] = await tx.select({ name: tenants.name, type: tenants.type }).from(tenants).where(eq(tenants.id, row.e.tenantId));
    const [emp] = await tx.select({ id: employees.id }).from(employees).where(and(eq(employees.tenantId, row.e.tenantId), eq(employees.userId, row.e.userId))).limit(1);
    const completedOn = row.e.completedAt.toISOString().slice(0, 10);
    // Approval-backed claims are re-checked at issue time against the approvals register.
    const [approval] = (
      await tx.execute<{ kind: string; approving_body: string; approval_number: string }>(sql`
        select kind, approving_body, approval_number from program_approvals
         where course_id = ${row.course.id}::uuid and status = 'ACTIVE' and effective_on <= current_date and (expires_on is null or expires_on >= current_date)
         order by case kind when 'CE_PROVIDER_APPROVAL' then 0 when 'ACCREDITATION' then 1 else 2 end, created_at desc limit 1`)
    ).rows;
    const needsApproval = row.course.programClassification === "STATE_APPROVED_PROGRAM" || row.course.programClassification === "CONTINUING_EDUCATION";
    const classification = needsApproval && !approval ? "STATE_REGULATED_TRAINING" : row.course.programClassification;
    const ceApproval = row.course.certificateType === "CONTINUING_EDUCATION" && approval && ["CE_PROVIDER_APPROVAL", "ACCREDITATION"].includes(approval.kind) ? approval : null;

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
        // CE certificates are issued only by the accreditation workflow; a course set to CE
        // without a recorded accreditation falls back to a completion certificate.
        kind: ceApproval ? "CONTINUING_EDUCATION" : row.course.certificateType === "CONTINUING_EDUCATION" || row.course.certificateType === "INSTRUCTOR" || row.course.certificateType === "COMPETENCY_VERIFICATION" ? "COURSE_COMPLETION" : row.course.certificateType,
        accreditation: ceApproval ? { provider: ceApproval.approving_body, body: ceApproval.approving_body, approvalNumber: ceApproval.approval_number } : null,
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
        programClassification: classification,
        programNotice: ver?.notice ?? null,
        renewalRequirements: ver?.renewal ?? null,
        instructorName: ins?.name ?? null,
        signatoryName: tenant?.type === "INDIVIDUAL" ? academySignatory().name : (org?.signatoryName ?? null),
        signatoryTitle: tenant?.type === "INDIVIDUAL" ? academySignatory().title : (org?.signatoryTitle ?? null),
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

/**
 * Certificate of Competency: issued when an authorized evaluator signs a PASS skills
 * evaluation for an employee with a user account. Theory completion never issues one.
 */
export async function issueForCompetency(sys: Db, assessmentId: string): Promise<{ id: string; created: boolean } | null> {
  return sys.transaction(async (tx) => {
    const [existing] = await tx.select({ id: certificates.id }).from(certificates).where(eq(certificates.competencyAssessmentId, assessmentId));
    if (existing) return { id: existing.id, created: false };
    const r = (
      await tx.execute<{ tenant_id: string; status: string; result: string; user_id: string | null; employee_id: string; first: string; last: string; competency: string; code: string; assessed_on: string; next_due: string | null; signer: string | null; creds: string | null; tenant_type: string; org: string | null; sig_name: string | null; sig_title: string | null; tenant_name: string }>(sql`
        select a.tenant_id, a.status::text, a.result::text, e.user_id, a.employee_id, e.first_name first, e.last_name last,
               k.name competency, k.code, a.assessed_on::text, a.next_assessment_due::text next_due, a.signer_name signer, a.signer_credentials creds,
               t.type::text tenant_type, o.display_name org, o.certificate_signatory_name sig_name, o.certificate_signatory_title sig_title, t.name tenant_name
          from competency_assessments a
          join employees e on e.id = a.employee_id
          join competencies k on k.id = a.competency_id
          join tenants t on t.id = a.tenant_id
          left join organizations o on o.tenant_id = a.tenant_id
         where a.id = ${assessmentId}::uuid`)
    ).rows[0];
    if (!r) throw new Error("Assessment not found");
    if (r.status !== "SIGNED" || r.result !== "PASS" || !r.user_id) return null;
    const superseded = await tx
      .update(certificates)
      .set({ status: "SUPERSEDED" })
      .where(and(eq(certificates.tenantId, r.tenant_id), eq(certificates.userId, r.user_id), eq(certificates.kind, "COMPETENCY_VERIFICATION"), eq(certificates.courseCode, r.code), inArray(certificates.status, ["ACTIVE", "EXPIRED"])))
      .returning({ id: certificates.id });
    const [cert] = await tx
      .insert(certificates)
      .values({
        tenantId: r.tenant_id,
        userId: r.user_id,
        employeeId: r.employee_id,
        kind: "COMPETENCY_VERIFICATION",
        certificateNumber: newCertificateNumber(),
        verificationCode: randomCode(10),
        recipientName: `${r.first} ${r.last}`,
        courseTitle: r.competency,
        courseCode: r.code,
        trainingHours: "0.00",
        issuingAuthority: `${ACADEMY_NAME} on behalf of ${r.org ?? r.tenant_name}`,
        completedOn: r.assessed_on,
        expiresOn: r.next_due,
        supersedesId: superseded[0]?.id ?? null,
        programNotice: "Skills observed and signed by the named evaluator. Valid only for the tasks listed in the evaluation.",
        instructorName: r.signer ? `${r.signer}${r.creds ? `, ${r.creds}` : ""} (evaluator)` : null,
        signatoryName: r.sig_name,
        signatoryTitle: r.sig_title,
        competencyAssessmentId: assessmentId,
      })
      .returning({ id: certificates.id, number: certificates.certificateNumber });
    await writeAudit(tx, { tenantId: r.tenant_id, actorUserId: null, action: "certificate.issued", entityType: "certificate", entityId: cert.id, after: { number: cert.number, kind: "COMPETENCY_VERIFICATION", competencyAssessmentId: assessmentId } });
    await notify(tx, { tenantId: r.tenant_id, userId: r.user_id, type: "certificate.available", title: "Your Certificate of Competency is ready", body: `Your ${r.competency} skills evaluation was signed. Download the certificate from the Certificates page.`, link: `/certificates/${cert.id}`, dedupeKey: `cert:${cert.id}` });
    return { id: cert.id, created: true };
  });
}

/** Daily repair: issues any missing Certificate of Competency for signed PASS evaluations. */
export async function ensureCompetencyCertificates(sys: Db): Promise<number> {
  const rows = await sys.execute<{ id: string }>(sql`
    select a.id from competency_assessments a join employees e on e.id = a.employee_id
     where a.status = 'SIGNED' and a.result = 'PASS' and e.user_id is not null
       and not exists (select 1 from certificates c where c.competency_assessment_id = a.id)`);
  for (const r of rows.rows) await issueForCompetency(sys, r.id);
  const voided = await sys.execute<{ id: string; voided_by_id: string | null; void_reason: string | null }>(sql`
    select a.id, a.voided_by_id, a.void_reason from competency_assessments a
     where a.status = 'VOIDED' and exists (select 1 from certificates c where c.competency_assessment_id = a.id and c.status <> 'REVOKED')`);
  for (const v of voided.rows) if (v.voided_by_id) await revokeForVoidedCompetency(sys, v.id, v.voided_by_id, v.void_reason ?? "evaluation voided");
  return rows.rows.length;
}

/** Revokes the competency certificate when its evaluation is voided. */
export async function revokeForVoidedCompetency(sys: Db, assessmentId: string, actorUserId: string, reason: string) {
  const rows = await sys
    .update(certificates)
    .set({ status: "REVOKED", revokedAt: new Date(), revokedById: actorUserId, revocationReason: `Skills evaluation voided: ${reason}` })
    .where(and(eq(certificates.competencyAssessmentId, assessmentId), sql`${certificates.status} <> 'REVOKED'`))
    .returning({ id: certificates.id, tenantId: certificates.tenantId });
  for (const r of rows) await writeAudit(sys, { tenantId: r.tenantId, actorUserId, action: "certificate.revoked", entityType: "certificate", entityId: r.id, after: { reason: "competency voided" } });
  return rows.length;
}

/**
 * Instructor Certificate: records that the organization authorized an instructor to
 * teach a course they are assigned to. Not a teaching license.
 */
export async function issueInstructorCertificate(sys: Db, ctx: { tenantId: string; userId: string }, input: { instructorId: string; courseId: string; hours: number; note?: string }) {
  if (!(input.hours >= 0 && input.hours <= 500)) return { ok: false as const, error: "Enter instructor training hours between 0 and 500." };
  const r = (
    await sys.execute<{ user_id: string; first: string; last: string; title: string; code: string; tenant_name: string; org: string | null; sig_name: string | null; sig_title: string | null }>(sql`
      select i.user_id, u.first_name first, u.last_name last, c.title, c.code, t.name tenant_name, o.display_name org, o.certificate_signatory_name sig_name, o.certificate_signatory_title sig_title
        from instructor_courses ic
        join instructors i on i.id = ic.instructor_id
        join users u on u.id = i.user_id
        join courses c on c.id = ic.course_id
        join tenants t on t.id = ic.tenant_id
        left join organizations o on o.tenant_id = ic.tenant_id
       where ic.tenant_id = ${ctx.tenantId}::uuid and ic.instructor_id = ${input.instructorId}::uuid and ic.course_id = ${input.courseId}::uuid and i.is_active`)
  ).rows[0];
  if (!r) return { ok: false as const, error: "Assign this instructor to the course before issuing an instructor certificate." };
  const today = new Date().toISOString().slice(0, 10);
  const [cert] = await sys
    .insert(certificates)
    .values({
      tenantId: ctx.tenantId,
      userId: r.user_id,
      courseId: input.courseId,
      kind: "INSTRUCTOR",
      certificateNumber: newCertificateNumber(),
      verificationCode: randomCode(10),
      recipientName: `${r.first} ${r.last}`,
      courseTitle: r.title,
      courseCode: r.code,
      trainingHours: input.hours.toFixed(2),
      issuingAuthority: `${ACADEMY_NAME} on behalf of ${r.org ?? r.tenant_name}`,
      completedOn: today,
      programNotice: input.note?.trim() || "Authorized to teach this course for the issuing organization.",
      signatoryName: r.sig_name,
      signatoryTitle: r.sig_title,
      issuedById: ctx.userId,
    })
    .returning({ id: certificates.id, number: certificates.certificateNumber });
  await writeAudit(sys, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "certificate.issued", entityType: "certificate", entityId: cert.id, after: { number: cert.number, kind: "INSTRUCTOR", instructorId: input.instructorId, courseId: input.courseId } });
  await notify(sys, { tenantId: ctx.tenantId, userId: r.user_id, type: "certificate.available", title: "Instructor certificate issued", body: `You are authorized to teach ${r.title}.`, link: `/certificates/${cert.id}`, dedupeKey: `cert:${cert.id}` });
  return { ok: true as const, data: { id: cert.id } };
}

/**
 * Correction: issues a replacement certificate with the corrected name (identity fields
 * are immutable) and marks the original SUPERSEDED with the reason recorded on both.
 */
export async function correctCertificate(sys: Db, tx: Tx, ctx: { tenantId: string; userId: string }, id: string, input: { recipientName: string; reason: string }) {
  const name = input.recipientName.trim().replace(/\s+/g, " ");
  const reason = input.reason.trim();
  if (name.length < 2 || name.length > 120) return { ok: false as const, error: "Enter the corrected full legal name." };
  if (reason.length < 10) return { ok: false as const, error: "Explain the correction (at least 10 characters)." };
  // Read through the tenant transaction: RLS proves the certificate belongs to this organization.
  const [c] = await tx.select().from(certificates).where(eq(certificates.id, id));
  if (!c) return { ok: false as const, error: "Certificate not found." };
  if (c.status === "REVOKED" || c.status === "SUPERSEDED") return { ok: false as const, error: "Only an active or expired certificate can be corrected." };
  if (name === c.recipientName) return { ok: false as const, error: "The corrected name is the same as the current name." };
  const created = await sys.transaction(async (t) => {
    await t.update(certificates).set({ status: "SUPERSEDED" }).where(eq(certificates.id, c.id));
    const { id: _id, certificateNumber: _n, verificationCode: _v, issuedAt: _i, status: _s, revokedAt: _ra, revokedById: _rb, revocationReason: _rr, supersedesId: _sp, correctionReason: _cr, issuedById: _ib, ...rest } = c;
    const [n] = await t
      .insert(certificates)
      .values({ ...rest, recipientName: name, certificateNumber: newCertificateNumber(), verificationCode: randomCode(10), supersedesId: c.id, correctionReason: reason, issuedById: ctx.userId })
      .returning({ id: certificates.id, number: certificates.certificateNumber });
    await writeAudit(t, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "certificate.corrected", entityType: "certificate", entityId: n.id, before: { id: c.id, number: c.certificateNumber, recipientName: c.recipientName }, after: { number: n.number, recipientName: name, reason } });
    return n;
  });
  await notify(sys, { tenantId: ctx.tenantId, userId: c.userId, type: "certificate.available", title: "A corrected certificate was issued", body: `Your certificate for ${c.courseTitle} was reissued with a correction. The previous certificate number is no longer current.`, link: `/certificates/${created.id}`, dedupeKey: `cert:${created.id}` });
  return { ok: true as const, data: { id: created.id } };
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
    nameMasked: boolean;
    programClassification: string | null;
    programNotice: string | null;
    instructorName: string | null;
    renewalRequirements: string | null;
    correctionReason: string | null;
  };
}

export async function verifyCertificate(sys: Db, code: string, meta: { ip?: string | null; userAgent?: string | null }): Promise<VerificationResult> {
  const lim = await rateLimit(sys, `verify:${meta.ip ?? "unknown"}`, 60, 15 * 60);
  if (!lim.allowed) return { found: false, rateLimited: true };
  const clean = code.trim().toUpperCase();
  // Accept the 10-character verification code or the printed certificate number.
  const byCode = /^[A-Z2-9]{10}$/.test(clean);
  const byNumber = /^CHITA-\d{4}-[A-Z2-9]{8}$/.test(clean);
  if (!byCode && !byNumber) return { found: false };
  const [c] = await sys.select().from(certificates).where(byCode ? eq(certificates.verificationCode, clean) : eq(certificates.certificateNumber, clean));
  if (!c) return { found: false };
  const [org] = await sys.select({ display: organizations.certificateNameDisplay }).from(organizations).where(eq(organizations.tenantId, c.tenantId)).limit(1);
  const masked = org?.display === "INITIALS";
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
      recipientName: masked ? initialsOf(c.recipientName) : c.recipientName,
      courseTitle: c.courseTitle,
      courseCode: c.courseCode,
      completedOn: c.completedOn,
      expiresOn: c.expiresOn,
      trainingHours: c.trainingHours,
      issuingAuthority: c.issuingAuthority,
      kind: c.kind,
      status: effectiveStatus(c),
      revokedAt: c.revokedAt,
      nameMasked: masked,
      programClassification: c.programClassification,
      programNotice: c.programNotice,
      instructorName: c.instructorName,
      renewalRequirements: c.renewalRequirements,
      correctionReason: c.correctionReason,
    },
  };
}
