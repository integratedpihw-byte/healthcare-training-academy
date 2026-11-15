import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, isNull, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant } from "@/db/client";
import {
  auditLogs,
  certificates,
  competencies,
  competencyAssessments,
  courseCategories,
  courses,
  courseVersions,
  enrollments,
  membershipRoles,
  memberships,
  subscriptions,
  tenants,
  users,
} from "@/db/schema";
import { decideTenant, registerOrganization, revokeMemberRole, saveFacility, systemRoleId } from "@/lib/tenancy/service";
import { deleteCustomRole, saveCustomRole } from "@/lib/rbac/service";
import { loadAccess } from "@/lib/rbac/access";
import { verifyAuditChain } from "@/lib/audit-verify";
import { consoleOutbox } from "@/lib/notify/email";
import { PW, addMember, createTenant, expectPgError, platformAdmin, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
const admin = (t: TenantFixture) => <R>(fn: Parameters<typeof withTenant<R>>[1]) => withTenant({ tenantId: t.tenantId, userId: t.adminUserId }, fn);

beforeAll(async () => {
  T = await createTenant("life");
});
afterAll(() => closePools());

describe("organization registration and approval", () => {
  it("creates a pending tenant with org, facility, admin membership, trial subscription and audit entry", async () => {
    const r = await registerOrganization(systemDb(), {
      organizationName: "Harbor Clinic",
      facilityName: "Harbor Clinic Main",
      facilityType: "CLINIC",
      adminFirstName: "Hal",
      adminLastName: "Harbor",
      adminEmail: "hal@harbor-reg.example",
      password: PW,
      plan: "PROFESSIONAL",
      acceptTerms: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [t] = await systemDb().select().from(tenants).where(eq(tenants.id, r.data.tenantId));
    expect(t.status).toBe("PENDING_APPROVAL");
    const [sub] = await systemDb().select().from(subscriptions).where(eq(subscriptions.tenantId, t.id));
    expect(sub.status).toBe("TRIALING");
    expect(sub.trialEndsAt!.getTime()).toBeGreaterThan(Date.now() + 13 * 86_400_000);
    const access = await withTenant({ tenantId: t.id, userId: r.data.userId }, (tx) => loadAccess(tx, t.id, r.data.userId));
    expect(access?.roles.map((x) => x.key)).toEqual(["org_admin"]);
    const audit = await systemDb().select().from(auditLogs).where(eq(auditLogs.tenantId, t.id));
    expect(audit.map((a) => a.action)).toContain("tenant.registered");
  });

  it("validates input and refuses duplicate emails and weak passwords", async () => {
    const bad = await registerOrganization(systemDb(), { organizationName: "x", acceptTerms: false });
    expect(bad.ok).toBe(false);
    const weak = await registerOrganization(systemDb(), {
      organizationName: "Weak Org", facilityName: "Weak Fac", facilityType: "CLINIC", adminFirstName: "W", adminLastName: "K",
      adminEmail: "weak@reg.example", password: "password", acceptTerms: true,
    });
    expect(weak.ok).toBe(false);
    const dup = await registerOrganization(systemDb(), {
      organizationName: "Dup Org", facilityName: "Dup Fac", facilityType: "CLINIC", adminFirstName: "D", adminLastName: "P",
      adminEmail: T.adminEmail, password: PW, acceptTerms: true,
    });
    expect(dup.ok).toBe(false);
  });

  it("only platform administrators can approve, and only valid transitions are allowed", async () => {
    const p = await createTenant("appr", { approve: false });
    const pa = await platformAdmin();
    expect((await decideTenant(systemDb(), { userId: p.adminUserId, isPlatformAdmin: false }, p.tenantId, "approve")).ok).toBe(false);
    expect((await decideTenant(systemDb(), { userId: pa.id, isPlatformAdmin: true }, p.tenantId, "suspend", "x")).ok).toBe(false);
    expect((await decideTenant(systemDb(), { userId: pa.id, isPlatformAdmin: true }, p.tenantId, "reject")).ok).toBe(false); // reason required
    expect((await decideTenant(systemDb(), { userId: pa.id, isPlatformAdmin: true }, p.tenantId, "approve")).ok).toBe(true);
    expect((await decideTenant(systemDb(), { userId: pa.id, isPlatformAdmin: true }, p.tenantId, "approve")).ok).toBe(false);
    expect((await decideTenant(systemDb(), { userId: pa.id, isPlatformAdmin: true }, p.tenantId, "suspend", "Unpaid")).ok).toBe(true);
    expect((await decideTenant(systemDb(), { userId: pa.id, isPlatformAdmin: true }, p.tenantId, "reactivate")).ok).toBe(true);
  });

  it("emails platform administrators about a new registration, and the organization's administrator about each decision", async () => {
    const pa = await platformAdmin();
    const [paUser] = await systemDb().select({ email: users.email }).from(users).where(eq(users.id, pa.id));
    const adminEmail = `owner-${Date.now()}@clinic.example`;
    let from = consoleOutbox.length;
    const reg = await registerOrganization(systemDb(), {
      organizationName: "Harbor Family Clinic", facilityName: "Harbor Main", facilityType: "CLINIC", adminFirstName: "Dana", adminLastName: "Whitfield",
      adminEmail, password: "Quiet-Harbor#2026", state: "FL", plan: "STARTER", acceptTerms: true,
    });
    if (!reg.ok) throw new Error(reg.error);
    const notice = consoleOutbox.slice(from).find((m) => m.to === paUser.email && m.subject.includes("New organization awaiting review: Harbor Family Clinic"));
    expect(notice?.text).toContain("/platform/tenants");
    expect(consoleOutbox.slice(from).some((m) => m.to === adminEmail && m.subject.includes("awaiting review"))).toBe(false);

    const actor = { userId: pa.id, isPlatformAdmin: true };
    from = consoleOutbox.length;
    expect((await decideTenant(systemDb(), actor, reg.data.tenantId, "approve")).ok).toBe(true);
    const approved = consoleOutbox.slice(from).filter((m) => m.subject.includes("Harbor Family Clinic has been approved"));
    expect(approved.map((m) => m.to)).toEqual([adminEmail]); // only this organization's administrator
    expect(approved[0].text).toContain("/login");

    from = consoleOutbox.length;
    expect((await decideTenant(systemDb(), actor, reg.data.tenantId, "suspend", "Payment overdue")).ok).toBe(true);
    const suspended = consoleOutbox.slice(from).find((m) => m.to === adminEmail);
    expect(suspended?.subject).toContain("has been suspended");
    expect(suspended?.text).toContain("Reason: Payment overdue");

    // A refused decision sends nothing.
    from = consoleOutbox.length;
    expect((await decideTenant(systemDb(), actor, reg.data.tenantId, "approve")).ok).toBe(false);
    expect(consoleOutbox.length).toBe(from);
  });
});

describe("organization administration", () => {
  it("creates and edits facilities with validation and auditing", async () => {
    const r = await admin(T)((tx) => saveFacility(tx, { tenantId: T.tenantId, userId: T.adminUserId }, { name: "Second Site", facilityType: "ADULT_DAY_CARE", state: "fl" }));
    expect(r.ok).toBe(true);
    const bad = await admin(T)((tx) => saveFacility(tx, { tenantId: T.tenantId, userId: T.adminUserId }, { name: "", facilityType: "NOPE", state: "Florida" }));
    expect(bad.ok).toBe(false);
  });

  it("invites a user: creates identity, membership with role, and a set-password email", async () => {
    consoleOutbox.length = 0;
    const m = await addMember(T, "facility_admin", T.facilityId);
    expect(consoleOutbox.some((e) => e.to === m.email)).toBe(true);
    const access = await withTenant({ tenantId: T.tenantId, userId: m.userId }, (tx) => loadAccess(tx, T.tenantId, m.userId));
    expect(access?.roles[0]).toMatchObject({ key: "facility_admin", facilityId: T.facilityId });
    expect(access?.grants.get("employees.manage")).toEqual(new Set([T.facilityId]));
  });

  it("never removes the last organization administrator", async () => {
    const orgAdmin = await systemRoleId(systemDb(), "org_admin");
    const [mr] = await systemDb()
      .select({ id: membershipRoles.id })
      .from(membershipRoles)
      .innerJoin(memberships, eq(memberships.id, membershipRoles.membershipId))
      .where(and(eq(memberships.userId, T.adminUserId), eq(membershipRoles.roleId, orgAdmin)));
    const r = await admin(T)((tx) => revokeMemberRole(tx, { tenantId: T.tenantId, userId: T.adminUserId }, mr.id));
    expect(r.ok).toBe(false);
  });

  it("custom roles: created within the tenant, invisible to other tenants, and no privilege escalation", async () => {
    const other = await createTenant("roles-other");
    const access = (await admin(T)((tx) => loadAccess(tx, T.tenantId, T.adminUserId)))!;
    const ok = await admin(T)((tx) => saveCustomRole(tx, { tenantId: T.tenantId, userId: T.adminUserId, access }, { name: "Staffing Coordinator", permissions: ["employees.view", "reports.view"] }));
    expect(ok.ok).toBe(true);
    const esc = await admin(T)((tx) => saveCustomRole(tx, { tenantId: T.tenantId, userId: T.adminUserId, access }, { name: "Clinical Boss", permissions: ["courses.approve.clinical"] }));
    expect(esc.ok).toBe(false);
    const visible = await withTenant({ tenantId: other.tenantId, userId: other.adminUserId }, (tx) => tx.execute(sql`select count(*)::int n from roles where key = 'custom_staffing_coordinator'`));
    expect((visible.rows[0] as { n: number }).n).toBe(0);
    if (ok.ok) expect((await admin(T)((tx) => deleteCustomRole(tx, { tenantId: T.tenantId, userId: T.adminUserId }, ok.data.id))).ok).toBe(true);
  });
});

describe("immutable audit trail", () => {
  it("blocks UPDATE, DELETE and TRUNCATE for every role, including platform services", async () => {
    expect((await expectPgError(systemDb().update(auditLogs).set({ action: "tampered" }))).message).toMatch(/append-only/);
    expect((await expectPgError(systemDb().delete(auditLogs))).message).toMatch(/append-only/);
    expect((await expectPgError(systemDb().execute(sql`truncate audit_logs`))).message).toMatch(/append-only|permission denied/);
  });

  it("hash chain verifies end-to-end for a tenant", async () => {
    const report = await admin(T)((tx) => verifyAuditChain(tx));
    expect(report.entries).toBeGreaterThan(3);
    expect(report.valid).toBe(true);
  });
});

describe("certificate and competency integrity guards", () => {
  async function courseFixture() {
    const db = systemDb();
    const [cat] = await db.select().from(courseCategories).where(isNull(courseCategories.tenantId)).limit(1);
    const [c] = await db.insert(courses).values({ code: `TST-${Date.now()}`, title: "Test Course", categoryId: cat.id, status: "PUBLISHED" }).returning();
    const [v] = await db.insert(courseVersions).values({ courseId: c.id, versionNumber: 1, description: "d", targetAudience: "all", status: "DRAFT" }).returning();
    const [e] = await db.insert(enrollments).values({ tenantId: T.tenantId, userId: T.adminUserId, courseId: c.id, courseVersionId: v.id }).returning();
    return { course: c, enrollment: e };
  }
  const cert = (enrollmentId: string, courseId: string, extra: Partial<typeof certificates.$inferInsert> = {}) => ({
    tenantId: T.tenantId, userId: T.adminUserId, courseId, enrollmentId, kind: "COURSE_COMPLETION" as const,
    certificateNumber: `C-${Math.random()}`, verificationCode: `V-${Math.random()}`, recipientName: "Ada Admin", courseTitle: "Test Course",
    trainingHours: "1.00", issuingAuthority: "CHITA", completedOn: "2026-11-01", expiresOn: "2027-11-01", ...extra,
  });

  it("refuses a certificate until the enrollment is COMPLETED (mandatory assessment passed)", async () => {
    const { course, enrollment } = await courseFixture();
    expect((await expectPgError(systemDb().insert(certificates).values(cert(enrollment.id, course.id)))).message).toMatch(/not COMPLETED/);
    await systemDb().update(enrollments).set({ status: "COMPLETED", completedAt: new Date() }).where(eq(enrollments.id, enrollment.id));
    const [c] = await systemDb().insert(certificates).values(cert(enrollment.id, course.id)).returning();
    expect(c.status).toBe("ACTIVE");

    // Expiration can never be extended; identity is immutable; revocation is permanent; no deletes.
    expect((await expectPgError(systemDb().update(certificates).set({ expiresOn: "2030-01-01" }).where(eq(certificates.id, c.id)))).message).toMatch(/cannot be extended/);
    expect((await expectPgError(systemDb().update(certificates).set({ recipientName: "Someone Else" }).where(eq(certificates.id, c.id)))).message).toMatch(/immutable/);
    await systemDb().update(certificates).set({ status: "REVOKED", revokedAt: new Date(), revocationReason: "Issued in error" }).where(eq(certificates.id, c.id));
    expect((await expectPgError(systemDb().update(certificates).set({ status: "ACTIVE" }).where(eq(certificates.id, c.id)))).message).toMatch(/reinstated/);
    expect((await expectPgError(systemDb().delete(certificates).where(eq(certificates.id, c.id)))).message).toMatch(/cannot be deleted/);
  });

  it("refuses continuing-education certificates without a recorded accreditation", async () => {
    const { course, enrollment } = await courseFixture();
    await systemDb().update(enrollments).set({ status: "COMPLETED" }).where(eq(enrollments.id, enrollment.id));
    expect((await expectPgError(systemDb().insert(certificates).values(cert(enrollment.id, course.id, { kind: "CONTINUING_EDUCATION" })))).message).toMatch(/accreditation/);
  });

  it("tenants cannot issue certificates directly (platform services only)", async () => {
    const { course, enrollment } = await courseFixture();
    await systemDb().update(enrollments).set({ status: "COMPLETED" }).where(eq(enrollments.id, enrollment.id));
    const err = await expectPgError(admin(T)((tx) => tx.insert(certificates).values(cert(enrollment.id, course.id))));
    expect(err.code).toBe("42501");
  });

  it("signed competency assessments are frozen and may only be voided", async () => {
    const [comp] = await systemDb().insert(competencies).values({ code: `HH-${Date.now()}`, name: "Hand hygiene" }).returning();
    const [a] = await admin(T)((tx) =>
      tx.insert(competencyAssessments).values({ tenantId: T.tenantId, employeeId: T.employeeId, facilityId: T.facilityId, competencyId: comp.id, evaluatorUserId: T.adminUserId, assessedOn: "2026-11-10", result: "PASS", status: "SIGNED", signedAt: new Date(), signatureHash: "test-hash", signerName: "Ada Admin" }).returning(),
    );
    expect((await expectPgError(admin(T)((tx) => tx.update(competencyAssessments).set({ result: "FAIL" }).where(eq(competencyAssessments.id, a.id))))).message).toMatch(/immutable/);
    expect((await expectPgError(admin(T)((tx) => tx.delete(competencyAssessments).where(eq(competencyAssessments.id, a.id))))).message).toMatch(/cannot be deleted/);
    expect((await expectPgError(admin(T)((tx) => tx.update(competencyAssessments).set({ status: "VOIDED" }).where(eq(competencyAssessments.id, a.id))))).message).toMatch(/requires a reason/);
    const [v] = await admin(T)((tx) => tx.update(competencyAssessments).set({ status: "VOIDED", voidReason: "Recorded in error", voidedById: T.adminUserId }).where(eq(competencyAssessments.id, a.id)).returning());
    expect(v.status).toBe("VOIDED");
  });

  it("a learner cannot record competency evaluations", async () => {
    const l = await addMember(T, "learner");
    const [comp] = await systemDb().insert(competencies).values({ code: `VS-${Date.now()}`, name: "Vital signs" }).returning();
    const err = await expectPgError(
      withTenant({ tenantId: T.tenantId, userId: l.userId }, (tx) =>
        tx.insert(competencyAssessments).values({ tenantId: T.tenantId, employeeId: T.employeeId, facilityId: T.facilityId, competencyId: comp.id, evaluatorUserId: l.userId, assessedOn: "2026-11-10", result: "PASS" }),
      ),
    );
    expect(err.code).toBe("42501");
  });
});

describe("platform console queries", () => {
  it("reports per-tenant facility, employee, member counts and plan", async () => {
    const { listTenants, platformOverview } = await import("@/lib/platform/queries");
    const rows = await listTenants(systemDb());
    const mine = rows.find((r) => r.id === T.tenantId)!;
    expect(mine.facilities).toBeGreaterThanOrEqual(1);
    expect(mine.employees).toBeGreaterThanOrEqual(1);
    expect(mine.members).toBeGreaterThanOrEqual(1);
    expect(mine.plan).toBe("STARTER");
    const o = await platformOverview(systemDb());
    expect(o.organizations).toBeGreaterThan(0);
  });

  it("facility-scoped dashboard counts only employees in scope", async () => {
    const { adminDashboard } = await import("@/lib/dashboard/queries");
    const all = await admin(T)((tx) => adminDashboard(tx, null, true));
    const none = await admin(T)((tx) => adminDashboard(tx, [], false));
    const one = await admin(T)((tx) => adminDashboard(tx, [T.facilityId], false));
    expect(all.employees).toBeGreaterThanOrEqual(1);
    expect(none.employees).toBe(0);
    expect(one.employees).toBe(1);
    expect(one.byFacility.find((f) => f.id === T.facilityId)?.employees).toBe(1);
  });
});
