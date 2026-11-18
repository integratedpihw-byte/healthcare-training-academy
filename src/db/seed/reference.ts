/**
 * Reference data required in EVERY environment (idempotent):
 * permissions, system role templates and their permissions, course categories.
 */
import { and, eq, isNull, notInArray } from "drizzle-orm";
import type { Db } from "../client";
import { competencies, courseCategories, permissions, rolePermissions, roles } from "../schema";
import { COMPETENCY_TEMPLATES } from "@/content/competencies";
import { PERMISSIONS, SYSTEM_ROLES, type SystemRoleKey } from "@/lib/rbac/catalog";

export const COURSE_CATEGORIES = [
  { slug: "mandatory-compliance", name: "Mandatory Healthcare Compliance", department: "MANDATORY_COMPLIANCE" },
  { slug: "clinical-patient-care", name: "Clinical Patient Care", department: "CLINICAL_PATIENT_CARE" },
  { slug: "hiv-infectious-disease", name: "HIV/AIDS, PrEP & Infectious Disease", department: "HIV_INFECTIOUS_DISEASE" },
  { slug: "laboratory-phlebotomy", name: "Laboratory & Phlebotomy", department: "LABORATORY_PHLEBOTOMY" },
  { slug: "medication-management", name: "Medication Management", department: "MEDICATION_MANAGEMENT" },
  { slug: "specialized-education", name: "Specialized Healthcare Education", department: "SPECIALIZED_EDUCATION" },
  { slug: "facility-programs", name: "Facility-Specific Training Programs", department: "FACILITY_PROGRAM" },
  { slug: "emergency-management", name: "Emergency Management & Response", department: "EMERGENCY_MANAGEMENT" },
  { slug: "public-health-practice", name: "Public Health Practice", department: "PUBLIC_HEALTH" },
  { slug: "case-management", name: "Case Management & Care Coordination", department: "CASE_MANAGEMENT" },
] as const;

export async function seedReference(db: Db) {
  await db.transaction(async (tx) => {
    // Permissions
    for (const [key, p] of Object.entries(PERMISSIONS)) {
      await tx
        .insert(permissions)
        .values({ key, description: p.description, category: p.category })
        .onConflictDoUpdate({ target: permissions.key, set: { description: p.description, category: p.category } });
    }
    const permRows = await tx.select().from(permissions);
    const permId = new Map(permRows.map((p) => [p.key, p.id]));

    // System roles (tenant_id NULL) — permissions are re-synced to the catalog.
    for (const [key, def] of Object.entries(SYSTEM_ROLES) as [SystemRoleKey, (typeof SYSTEM_ROLES)[SystemRoleKey]][]) {
      let [role] = await tx.select().from(roles).where(and(isNull(roles.tenantId), eq(roles.key, key)));
      if (!role) {
        [role] = await tx.insert(roles).values({ key, name: def.name, description: def.description, isSystem: true }).returning();
      } else {
        await tx.update(roles).set({ name: def.name, description: def.description, isSystem: true }).where(eq(roles.id, role.id));
      }
      const ids = def.permissions.map((p) => permId.get(p)!);
      await tx.delete(rolePermissions).where(and(eq(rolePermissions.roleId, role.id), notInArray(rolePermissions.permissionId, ids)));
      for (const pid of ids) {
        await tx.insert(rolePermissions).values({ roleId: role.id, permissionId: pid, tenantId: null }).onConflictDoNothing();
      }
    }

    // Course categories (global)
    for (const [i, c] of COURSE_CATEGORIES.entries()) {
      const [existing] = await tx
        .select({ id: courseCategories.id })
        .from(courseCategories)
        .where(and(isNull(courseCategories.tenantId), eq(courseCategories.slug, c.slug)));
      if (existing) {
        await tx.update(courseCategories).set({ name: c.name, department: c.department, sortOrder: i }).where(eq(courseCategories.id, existing.id));
      } else {
        await tx.insert(courseCategories).values({ ...c, sortOrder: i });
      }
    }

    // Competency checklist templates (global). Existing templates are left untouched:
    // signed assessments reference their criteria, so edits create new codes instead.
    for (const t of COMPETENCY_TEMPLATES) {
      await tx
        .insert(competencies)
        .values({ code: t.code, name: t.name, description: t.description, criteria: t.criteria })
        .onConflictDoNothing();
    }
  });
}
