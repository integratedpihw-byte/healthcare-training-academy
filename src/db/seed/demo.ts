/**
 * DEMO DATA — for development, QA and sales demonstrations only.
 * Every demo tenant name ends with "(DEMO)", uses a slug starting with "demo-",
 * and every demo email uses the reserved ".example" domain. Never run in production.
 */
import { eq } from "drizzle-orm";
import type { Db } from "../client";
import {
  departments,
  employeeFacilities,
  employees,
  facilities,
  membershipRoles,
  memberships,
  notificationPreferences,
  organizations,
  subscriptions,
  tenants,
  users,
  type FacilityType,
} from "../schema";
import { hashPassword } from "@/lib/auth/password";
import { systemRoleId } from "@/lib/tenancy/service";
import { writeAudit } from "@/lib/audit";
import type { SystemRoleKey } from "@/lib/rbac/catalog";

export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo-Academy#2026";

interface DemoTenant {
  slug: string;
  name: string;
  status: "ACTIVE" | "PENDING_APPROVAL";
  plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  facilities: { key: string; name: string; type: FacilityType; city: string; license?: string }[];
  departments: { name: string; facility: string }[];
  users: { email: string; first: string; last: string; role: SystemRoleKey; facility?: string }[];
  employees: {
    no: string;
    first: string;
    last: string;
    title: string;
    position: string;
    facility: string;
    dept?: string;
    clinical: boolean;
    bbp: boolean;
    hired: string;
    userEmail?: string;
    alsoAt?: string;
  }[];
}

const TENANTS: DemoTenant[] = [
  {
    slug: "demo-sunshine",
    name: "Sunshine Care Group (DEMO)",
    status: "ACTIVE",
    plan: "ENTERPRISE",
    facilities: [
      { key: "alf", name: "Sunshine Assisted Living – Tampa (DEMO)", type: "ASSISTED_LIVING_FACILITY", city: "Tampa", license: "DEMO-ALF-0001" },
      { key: "clinic", name: "Sunshine Community Clinic – St. Petersburg (DEMO)", type: "CLINIC", city: "St. Petersburg" },
    ],
    departments: [
      { name: "Resident Care", facility: "alf" },
      { name: "Medication Services", facility: "alf" },
      { name: "Nursing", facility: "clinic" },
      { name: "Laboratory", facility: "clinic" },
      { name: "Front Office", facility: "clinic" },
    ],
    users: [
      { email: "orgadmin@sunshine.example", first: "Olivia", last: "Grant", role: "org_admin" },
      { email: "director@sunshine.example", first: "Marcus", last: "Bell", role: "training_director" },
      { email: "facadmin@sunshine.example", first: "Priya", last: "Shah", role: "facility_admin", facility: "alf" },
      { email: "instructor@sunshine.example", first: "Daniel", last: "Ortiz", role: "instructor" },
      { email: "supervisor@sunshine.example", first: "Grace", last: "Kim", role: "supervisor" },
      { email: "learner@sunshine.example", first: "Jordan", last: "Lee", role: "learner" },
    ],
    employees: [
      { no: "SCG-1001", first: "Jordan", last: "Lee", title: "Resident Care Aide", position: "CAREGIVER", facility: "alf", dept: "Resident Care", clinical: true, bbp: true, hired: "2025-03-10", userEmail: "learner@sunshine.example" },
      { no: "SCG-1002", first: "Grace", last: "Kim", title: "Resident Care Supervisor", position: "SUPERVISOR", facility: "alf", dept: "Resident Care", clinical: true, bbp: true, hired: "2021-06-01", userEmail: "supervisor@sunshine.example" },
      { no: "SCG-1003", first: "Ana", last: "Morales", title: "Medication Technician", position: "MED_TECH", facility: "alf", dept: "Medication Services", clinical: true, bbp: true, hired: "2024-01-15" },
      { no: "SCG-1004", first: "Samuel", last: "Brooks", title: "Dietary Aide", position: "DIETARY", facility: "alf", clinical: false, bbp: false, hired: "2025-09-02" },
      { no: "SCG-2001", first: "Leah", last: "Nguyen", title: "Registered Nurse", position: "RN", facility: "clinic", dept: "Nursing", clinical: true, bbp: true, hired: "2022-11-07", alsoAt: "alf" },
      { no: "SCG-2002", first: "Chris", last: "Patel", title: "Medical Assistant", position: "MEDICAL_ASSISTANT", facility: "clinic", dept: "Nursing", clinical: true, bbp: true, hired: "2026-08-18" },
      { no: "SCG-2003", first: "Tanya", last: "Reed", title: "Phlebotomist", position: "PHLEBOTOMIST", facility: "clinic", dept: "Laboratory", clinical: true, bbp: true, hired: "2023-04-24" },
      { no: "SCG-2004", first: "Kevin", last: "Walsh", title: "Patient Registration Specialist", position: "FRONT_OFFICE", facility: "clinic", dept: "Front Office", clinical: false, bbp: false, hired: "2026-10-05" },
    ],
  },
  {
    slug: "demo-gulfcoast",
    name: "Gulf Coast Home Health (DEMO)",
    status: "ACTIVE",
    plan: "STARTER",
    facilities: [{ key: "hha", name: "Gulf Coast Home Health – Sarasota (DEMO)", type: "HOME_HEALTH_AGENCY", city: "Sarasota", license: "DEMO-HHA-0042" }],
    departments: [{ name: "Field Clinicians", facility: "hha" }],
    users: [{ email: "orgadmin@gulfcoast.example", first: "Henry", last: "Alvarez", role: "org_admin" }],
    employees: [
      { no: "GC-001", first: "Maria", last: "Santos", title: "Home Health Aide", position: "HOME_HEALTH_AIDE", facility: "hha", dept: "Field Clinicians", clinical: true, bbp: true, hired: "2024-05-20" },
      { no: "GC-002", first: "Paul", last: "Fischer", title: "Licensed Practical Nurse", position: "LPN", facility: "hha", dept: "Field Clinicians", clinical: true, bbp: true, hired: "2023-02-13" },
      { no: "GC-003", first: "Irene", last: "Clark", title: "Scheduler", position: "ADMIN_STAFF", facility: "hha", clinical: false, bbp: false, hired: "2025-12-01" },
    ],
  },
  {
    slug: "demo-bayview",
    name: "Bayview Group Home (DEMO)",
    status: "PENDING_APPROVAL",
    plan: "STARTER",
    facilities: [{ key: "gh", name: "Bayview Group Home – Clearwater (DEMO)", type: "GROUP_HOME", city: "Clearwater" }],
    departments: [],
    users: [{ email: "admin@bayview.example", first: "Rita", last: "Owens", role: "org_admin" }],
    employees: [],
  },
];

export async function seedDemo(db: Db): Promise<{ created: string[]; skipped: string[] }> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const created: string[] = [];
  const skipped: string[] = [];

  // Platform super administrator
  const [admin] = await db
    .insert(users)
    .values({ email: "superadmin@chta-platform.example", firstName: "Platform", lastName: "Administrator", passwordHash, isPlatformAdmin: true, emailVerifiedAt: new Date() })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  const [adminRow] = admin ? [admin] : await db.select({ id: users.id }).from(users).where(eq(users.email, "superadmin@chta-platform.example"));

  const roleIds = new Map<SystemRoleKey, string>();
  for (const k of ["org_admin", "training_director", "facility_admin", "instructor", "supervisor", "learner"] as SystemRoleKey[]) {
    roleIds.set(k, await systemRoleId(db, k));
  }

  for (const t of TENANTS) {
    const [exists] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, t.slug));
    if (exists) {
      skipped.push(t.name);
      continue;
    }
    await db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          slug: t.slug,
          name: t.name,
          status: t.status,
          approvedAt: t.status === "ACTIVE" ? new Date() : null,
          approvedById: t.status === "ACTIVE" ? adminRow.id : null,
        })
        .returning({ id: tenants.id });
      const [org] = await tx
        .insert(organizations)
        .values({ tenantId: tenant.id, legalName: t.name.replace(" (DEMO)", " LLC (DEMO)"), displayName: t.name, state: "FL", mfaPolicy: "OFF" })
        .returning({ id: organizations.id });
      const fac = new Map<string, string>();
      for (const f of t.facilities) {
        const [row] = await tx
          .insert(facilities)
          .values({ tenantId: tenant.id, organizationId: org.id, name: f.name, facilityType: f.type, city: f.city, state: "FL", licenseNumber: f.license ?? null })
          .returning({ id: facilities.id });
        fac.set(f.key, row.id);
      }
      const dept = new Map<string, string>();
      for (const d of t.departments) {
        const [row] = await tx
          .insert(departments)
          .values({ tenantId: tenant.id, organizationId: org.id, facilityId: fac.get(d.facility)!, name: d.name })
          .returning({ id: departments.id });
        dept.set(d.name, row.id);
      }
      const userIds = new Map<string, string>();
      for (const u of t.users) {
        const [row] = await tx
          .insert(users)
          .values({ email: u.email, firstName: u.first, lastName: u.last, passwordHash, emailVerifiedAt: new Date() })
          .onConflictDoUpdate({ target: users.email, set: { firstName: u.first } })
          .returning({ id: users.id });
        userIds.set(u.email, row.id);
        const [m] = await tx.insert(memberships).values({ tenantId: tenant.id, userId: row.id }).returning({ id: memberships.id });
        await tx.insert(membershipRoles).values({
          tenantId: tenant.id,
          membershipId: m.id,
          roleId: roleIds.get(u.role)!,
          facilityId: u.facility ? fac.get(u.facility)! : null,
        });
      }
      const empIds = new Map<string, string>();
      for (const e of t.employees) {
        const [row] = await tx
          .insert(employees)
          .values({
            tenantId: tenant.id,
            organizationId: org.id,
            userId: e.userEmail ? userIds.get(e.userEmail) ?? null : null,
            employeeNumber: e.no,
            firstName: e.first,
            lastName: e.last,
            email: e.userEmail ?? `${e.first}.${e.last}@${t.slug.replace("demo-", "")}.example`.toLowerCase(),
            jobTitle: e.title,
            positionCode: e.position,
            clinicalExposure: e.clinical,
            bloodborneExposure: e.bbp,
            hireDate: e.hired,
            primaryFacilityId: fac.get(e.facility)!,
            departmentId: e.dept ? dept.get(e.dept) ?? null : null,
          })
          .returning({ id: employees.id });
        empIds.set(e.no, row.id);
        await tx.insert(employeeFacilities).values({ tenantId: tenant.id, employeeId: row.id, facilityId: fac.get(e.facility)! });
        if (e.alsoAt) await tx.insert(employeeFacilities).values({ tenantId: tenant.id, employeeId: row.id, facilityId: fac.get(e.alsoAt)! });
      }
      // Supervisor relationships
      if (t.slug === "demo-sunshine") {
        const sup = empIds.get("SCG-1002")!;
        for (const no of ["SCG-1001", "SCG-1003", "SCG-1004"]) {
          await tx.update(employees).set({ supervisorId: sup }).where(eq(employees.id, empIds.get(no)!));
        }
      }
      await tx.insert(subscriptions).values({
        tenantId: tenant.id,
        plan: t.plan,
        status: t.status === "ACTIVE" ? "ACTIVE" : "TRIALING",
        seats: t.plan === "STARTER" ? 25 : 150,
        trialEndsAt: t.status === "ACTIVE" ? null : new Date(Date.now() + 14 * 86_400_000),
      });
      await tx.insert(notificationPreferences).values({ tenantId: tenant.id });
      await writeAudit(tx, { tenantId: tenant.id, actorUserId: adminRow.id, action: "demo.seeded", entityType: "tenant", entityId: tenant.id, after: { demo: true } });
    });
    created.push(t.name);
  }
  return { created, skipped };
}
