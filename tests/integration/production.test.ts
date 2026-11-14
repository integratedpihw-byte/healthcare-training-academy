/**
 * Phase 7 — production readiness: file uploads (validation, RLS-by-parent, immutability,
 * evidence locking), optional SMS for critical alerts, and a database-wide tenant
 * isolation sweep covering every tenant-scoped table.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import { auditLogs, competencies, employees, files, notificationPreferences, smsOutbox, userNotificationSettings } from "@/db/schema";
import { loadAccess } from "@/lib/rbac/access";
import { saveLicense } from "@/lib/workforce/licenses";
import { saveDraft, signAssessment } from "@/lib/competency/service";
import { getFile, listFiles, removeFile, uploadFile } from "@/lib/files/service";
import { pdfLooksActive, safeFilename, sniff } from "@/lib/files/validate";
import { notify } from "@/lib/notify/notifications";
import { deliverPendingSms, normalizePhone } from "@/lib/notify/sms";
import { saveUserSettings } from "@/lib/workforce/communication";
import { RESOURCES } from "@/lib/integrations/api";
import { addMember, createTenant, expectPgError, PW, setPassword, type TenantFixture } from "../support/fixtures";

let T: TenantFixture;
let T2: TenantFixture;
let learner: { userId: string };
let supervisor: { userId: string };
let licenseId: string;

const as = (t: TenantFixture, userId: string) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: t.tenantId, userId }, fn);
const ctxFor = async (userId: string, t = T) => ({ tenantId: t.tenantId, userId, access: (await as(t, userId)((tx) => loadAccess(tx, t.tenantId, userId)))! });

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF");
const EVIL_PDF = Buffer.from("%PDF-1.4\n1 0 obj << /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >> endobj\n%%EOF");
const HTML = Buffer.from("<html><script>alert(1)</script></html>");

beforeAll(async () => {
  T = await createTenant("prod");
  T2 = await createTenant("prod2");
  learner = await addMember(T, "learner");
  supervisor = await addMember(T, "supervisor");
  await setPassword(supervisor.userId);
  const sys = systemDb();
  const [supEmp] = await sys.insert(employees).values({ tenantId: T.tenantId, organizationId: T.orgId, userId: supervisor.userId, employeeNumber: "SUP-P", firstName: "Sue", lastName: "Visor", jobTitle: "Supervisor", positionCode: "SUPERVISOR", hireDate: "2024-01-01", primaryFacilityId: T.facilityId }).returning();
  await sys.update(employees).set({ userId: learner.userId, supervisorId: supEmp.id }).where(eq(employees.id, T.employeeId));
  const admin = await ctxFor(T.adminUserId);
  const l = await as(T, T.adminUserId)((tx) => saveLicense(tx, admin, T.employeeId, { kind: "THIRD_PARTY_CERTIFICATION", name: "BLS Provider", licenseNumber: "BLS-1", issuingAuthority: "Test Heart Org", state: "", issuedOn: "2026-01-01", expiresOn: "2028-01-01", notes: "" }));
  if (!l.ok) throw new Error(l.error);
  licenseId = l.data.id;
});
afterAll(() => closePools());

describe("upload validation (pure)", () => {
  it("identifies files by content and refuses active PDFs", () => {
    expect(sniff(PNG)).toBe("png");
    expect(sniff(PDF)).toBe("pdf");
    expect(sniff(HTML)).toBeNull();
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("jpeg");
    expect(pdfLooksActive(EVIL_PDF)).toBe(true);
    expect(pdfLooksActive(PDF)).toBe(false);
    expect(safeFilename('../../etc/pa"ss<wd>.exe', "pdf")).toBe("passwd.pdf");
    expect(safeFilename("scan.png", "jpeg")).toBe("scan.jpg");
  });
});

describe("file uploads", () => {
  let fileId: string;

  it("lets managers attach license documents and refuses unsafe or unauthorized uploads", async () => {
    const admin = { tenantId: T.tenantId, userId: T.adminUserId };
    const ok = await as(T, T.adminUserId)((tx) => uploadFile(tx, admin, { purpose: "LICENSE_DOCUMENT", entityId: licenseId, filename: "bls card.png", data: PNG }));
    if (!ok.ok) throw new Error(ok.error);
    fileId = ok.data.id;
    expect((await as(T, T.adminUserId)((tx) => uploadFile(tx, admin, { purpose: "LICENSE_DOCUMENT", entityId: licenseId, filename: "x.html", data: HTML }))).ok).toBe(false);
    expect((await as(T, T.adminUserId)((tx) => uploadFile(tx, admin, { purpose: "LICENSE_DOCUMENT", entityId: licenseId, filename: "x.pdf", data: EVIL_PDF }))).ok).toBe(false);
    expect((await as(T, T.adminUserId)((tx) => uploadFile(tx, admin, { purpose: "LICENSE_DOCUMENT", entityId: licenseId, filename: "big.png", data: Buffer.concat([PNG, Buffer.alloc(11 * 1024 * 1024)]) }))).ok).toBe(false);
    expect((await as(T, T.adminUserId)((tx) => uploadFile(tx, admin, { purpose: "LICENSE_DOCUMENT", entityId: licenseId, filename: "v.mp4", data: Buffer.from("0000ftypisom0000") }))).ok).toBe(false);
    // A learner cannot attach documents, even to their own license.
    expect((await as(T, learner.userId)((tx) => uploadFile(tx, { tenantId: T.tenantId, userId: learner.userId }, { purpose: "LICENSE_DOCUMENT", entityId: licenseId, filename: "a.png", data: PNG }))).ok).toBe(false);
    // Another tenant cannot attach to this license.
    expect((await as(T2, T2.adminUserId)((tx) => uploadFile(tx, { tenantId: T2.tenantId, userId: T2.adminUserId }, { purpose: "LICENSE_DOCUMENT", entityId: licenseId, filename: "a.png", data: PNG }))).ok).toBe(false);
    const audit = await systemDb().select().from(auditLogs).where(and(eq(auditLogs.tenantId, T.tenantId), eq(auditLogs.action, "file.uploaded")));
    expect(audit).toHaveLength(1);
  });

  it("follows the parent record's visibility and keeps files immutable", async () => {
    expect(await as(T, T.adminUserId)((tx) => getFile(tx, fileId))).not.toBeNull();
    expect(await as(T, learner.userId)((tx) => getFile(tx, fileId))).not.toBeNull(); // the employee's own license
    expect(await as(T2, T2.adminUserId)((tx) => getFile(tx, fileId))).toBeNull();
    const other = await addMember(T, "learner");
    expect(await as(T, other.userId)((tx) => getFile(tx, fileId))).toBeNull();
    const e = await expectPgError(as(T, T.adminUserId)((tx) => tx.update(files).set({ filename: "renamed.png" }).where(eq(files.id, fileId))));
    expect(e.message).toMatch(/immutable/);
    const del = await expectPgError(as(T, T.adminUserId)((tx) => tx.delete(files).where(eq(files.id, fileId))));
    expect(del.message).toMatch(/permission denied/);
    expect((await as(T, learner.userId)((tx) => removeFile(tx, { tenantId: T.tenantId, userId: learner.userId }, fileId))).ok).toBe(false);
    expect((await as(T, T.adminUserId)((tx) => removeFile(tx, { tenantId: T.tenantId, userId: T.adminUserId }, fileId))).ok).toBe(true);
    expect(await as(T, T.adminUserId)((tx) => listFiles(tx, "LICENSE_DOCUMENT", licenseId))).toHaveLength(0);
  });

  it("locks competency evidence once the evaluation is signed", async () => {
    const [hh] = await systemDb().select().from(competencies).where(eq(competencies.code, "COMP-HH"));
    const ctx = await ctxFor(supervisor.userId);
    const d = await as(T, supervisor.userId)((tx) => saveDraft(tx, ctx, { employeeId: T.employeeId, facilityId: T.facilityId, competencyId: hh.id, assessedOn: "2026-11-10", criteriaResults: (hh.criteria as { id: string }[]).map((x) => ({ id: x.id, outcome: "MET" })), evidenceUrls: [] }));
    if (!d.ok) throw new Error(d.error);
    const sup = { tenantId: T.tenantId, userId: supervisor.userId };
    const up = await as(T, supervisor.userId)((tx) => uploadFile(tx, sup, { purpose: "COMPETENCY_EVIDENCE", entityId: d.data.id, filename: "checklist.pdf", data: PDF }));
    if (!up.ok) throw new Error(up.error);
    // Only the evaluator may attach evidence.
    expect((await as(T, T.adminUserId)((tx) => uploadFile(tx, { tenantId: T.tenantId, userId: T.adminUserId }, { purpose: "COMPETENCY_EVIDENCE", entityId: d.data.id, filename: "x.pdf", data: PDF }))).ok).toBe(false);
    const s = await as(T, supervisor.userId)((tx) => signAssessment(tx, systemDb(), ctx, d.data.id, { password: PW, credentials: "", attest: true }));
    if (!s.ok) throw new Error(s.error);
    expect((await as(T, supervisor.userId)((tx) => uploadFile(tx, sup, { purpose: "COMPETENCY_EVIDENCE", entityId: d.data.id, filename: "late.pdf", data: PDF }))).ok).toBe(false);
    const rm = await as(T, supervisor.userId)((tx) => removeFile(tx, sup, up.data.id));
    expect(rm.ok).toBe(false);
    // The evaluated employee can see the evidence on their own signed record.
    expect(await as(T, learner.userId)((tx) => listFiles(tx, "COMPETENCY_EVIDENCE", d.data.id))).toHaveLength(1);
  });
});

describe("optional SMS alerts", () => {
  it("normalizes phone numbers", () => {
    expect(normalizePhone("(813) 555-0142")).toBe("+18135550142");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("555-0142")).toBeNull();
  });

  it("queues SMS only for critical alerts, when the organization allows it and the user opted in", async () => {
    const sys = systemDb();
    const me = { tenantId: T.tenantId, userId: learner.userId };
    expect((await as(T, learner.userId)((tx) => saveUserSettings(tx, me, { emailAssignments: true, emailResults: true, emailAnnouncements: true, smsOptIn: true, smsPhone: "" }))).ok).toBe(false);
    expect((await as(T, learner.userId)((tx) => saveUserSettings(tx, me, { emailAssignments: true, emailResults: true, emailAnnouncements: true, smsOptIn: true, smsPhone: "(813) 555-0142" }))).ok).toBe(true);
    const [s] = await sys.select().from(userNotificationSettings).where(eq(userNotificationSettings.userId, learner.userId));
    expect(s).toMatchObject({ smsOptIn: true, smsPhone: "+18135550142" });
    expect(s.smsConsentAt).not.toBeNull();
    // Organization has not enabled SMS yet → nothing queued.
    await notify(sys, { tenantId: T.tenantId, userId: learner.userId, type: "license.expiring", title: "Your BLS card expires in 30 days", body: "Renew it.", link: "/learning", dedupeKey: `sms1:${Date.now()}` });
    expect(await sys.select().from(smsOutbox).where(eq(smsOutbox.userId, learner.userId))).toHaveLength(0);
    await sys.insert(notificationPreferences).values({ tenantId: T.tenantId, smsEnabled: true }).onConflictDoUpdate({ target: notificationPreferences.tenantId, set: { smsEnabled: true } });
    await notify(sys, { tenantId: T.tenantId, userId: learner.userId, type: "license.expiring", title: "Your BLS card expires in 29 days", body: "Renew it.", link: "/learning", dedupeKey: `sms2:${Date.now()}` });
    await notify(sys, { tenantId: T.tenantId, userId: learner.userId, type: "assignment.new", title: "New course assigned", body: "x", link: "/learning", dedupeKey: `sms3:${Date.now()}` });
    const q = await sys.select().from(smsOutbox).where(eq(smsOutbox.userId, learner.userId));
    expect(q).toHaveLength(1);
    expect(q[0].body).toMatch(/BLS card/);
    // The application role can never read the SMS queue.
    const e = await expectPgError(as(T, T.adminUserId)((tx) => tx.select().from(smsOutbox)));
    expect(e.message).toMatch(/permission denied/);
    const r = await deliverPendingSms(sys);
    expect(r.sent).toBeGreaterThanOrEqual(1);
    // Opting out stops future texts.
    await as(T, learner.userId)((tx) => saveUserSettings(tx, me, { emailAssignments: true, emailResults: true, emailAnnouncements: true, smsOptIn: false, smsPhone: "" }));
    await notify(sys, { tenantId: T.tenantId, userId: learner.userId, type: "license.expiring", title: "Expires in 28 days", body: "x", link: "/learning", dedupeKey: `sms4:${Date.now()}` });
    expect(await sys.select().from(smsOutbox).where(eq(smsOutbox.userId, learner.userId))).toHaveLength(1);
  });
});

describe("integration API resource queries", () => {
  it("every v1 resource query runs under RLS and returns only this tenant's rows", async () => {
    for (const [name, r] of Object.entries(RESOURCES)) {
      const rows = await as(T, T.adminUserId)((tx) => r.handler(tx, { limit: 50, offset: 0, updatedSince: "2000-01-01T00:00:00Z" }));
      expect(Array.isArray(rows), name).toBe(true);
      const other = await as(T2, T2.adminUserId)((tx) => r.handler(tx, { limit: 500, offset: 0, updatedSince: null }));
      const ids = new Set(rows.map((x) => String(x.id ?? x.employeeId)));
      expect(other.some((x) => ids.has(String(x.id ?? x.employeeId))), name).toBe(false);
    }
  });
});

describe("database-wide tenant isolation sweep", () => {
  it("forces row-level security on every tenant-scoped table and the app role cannot bypass it", async () => {
    const sys = systemDb();
    const tables = (await sys.execute<{ table_name: string; forced: boolean; enabled: boolean }>(sql`
      select c.table_name, cl.relforcerowsecurity forced, cl.relrowsecurity enabled
        from information_schema.columns c join pg_class cl on cl.relname = c.table_name and cl.relnamespace = 'public'::regnamespace
       where c.table_schema = 'public' and c.column_name = 'tenant_id' and cl.relkind = 'r'`)).rows;
    expect(tables.length).toBeGreaterThan(40);
    expect(tables.filter((t) => !t.forced || !t.enabled).map((t) => t.table_name)).toEqual([]);
    const [role] = (await sys.execute<{ rolbypassrls: boolean; rolsuper: boolean }>(sql`select rolbypassrls, rolsuper from pg_roles where rolname = 'chta_app'`)).rows;
    expect(role).toEqual({ rolbypassrls: false, rolsuper: false });
  });

  it("returns no other-tenant rows from any readable tenant table", async () => {
    const sys = systemDb();
    const tables = (await sys.execute<{ table_name: string }>(sql`
      select cl.relname table_name from pg_class cl join pg_attribute a on a.attrelid = cl.oid and a.attname = 'tenant_id' and not a.attisdropped
       where cl.relnamespace = 'public'::regnamespace and cl.relkind = 'r' and has_table_privilege('chta_app', cl.oid, 'SELECT')`)).rows;
    const leaks: string[] = [];
    for (const { table_name } of tables) {
      const n = await as(T2, T2.adminUserId)((tx) => tx.execute<{ n: number }>(sql`select count(*)::int n from ${sql.identifier(table_name)} where tenant_id = ${T.tenantId}::uuid`));
      if (n.rows[0].n > 0) leaks.push(table_name);
    }
    expect(leaks).toEqual([]);
    // And the same queries do see T's rows from T's own admin (the sweep is meaningful).
    const own = await as(T, T.adminUserId)((tx) => tx.execute<{ n: number }>(sql`select count(*)::int n from employees where tenant_id = ${T.tenantId}::uuid`));
    expect(own.rows[0].n).toBeGreaterThan(0);
  });

  it("rejects writes that target another tenant", async () => {
    const e = await expectPgError(as(T2, T2.adminUserId)((tx) => tx.insert(employees).values({ tenantId: T.tenantId, organizationId: T.orgId, employeeNumber: "X-1", firstName: "X", lastName: "Y", jobTitle: "CNA", positionCode: "CNA", hireDate: "2026-01-01" })));
    expect(e.message).toMatch(/row-level security/);
    const upd = await as(T2, T2.adminUserId)((tx) => tx.update(employees).set({ firstName: "Hacked" }).where(eq(employees.tenantId, T.tenantId)).returning({ id: employees.id }));
    expect(upd).toHaveLength(0);
  });
});
