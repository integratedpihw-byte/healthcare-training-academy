/**
 * Permission catalog and system role templates.
 *
 * Permissions are data (table `permissions`); roles map to permissions through
 * `role_permissions`. System role templates (tenant_id NULL) are seeded from this
 * file; tenants may create custom roles from the same permission set. Platform
 * Super Administrator is a user-level flag (users.is_platform_admin), not a tenant role.
 */

export const PERMISSIONS = {
  // Organization
  "org.settings.manage": { category: "Organization", description: "Edit organization profile and settings" },
  "org.facilities.manage": { category: "Organization", description: "Create and edit facilities and departments" },
  "org.users.manage": { category: "Organization", description: "Invite users and assign roles" },
  "org.roles.manage": { category: "Organization", description: "Create and edit custom roles" },
  // Workforce
  "employees.view": { category: "Workforce", description: "View employee profiles" },
  "employees.manage": { category: "Workforce", description: "Create, edit and deactivate employees" },
  "team.view": { category: "Workforce", description: "View profiles and training records of direct reports" },
  // Training management
  "training.view_all": { category: "Training", description: "View training records of all employees in scope" },
  "training.assign": { category: "Training", description: "Assign courses and set due dates" },
  "training.requirements.manage": { category: "Training", description: "Manage training requirements and pathways" },
  "training.schedule.manage": { category: "Training", description: "Schedule instructor-led and live sessions" },
  "training.records.approve": { category: "Training", description: "Approve employee training records" },
  // Course content
  "courses.view": { category: "Courses", description: "Browse the course catalog" },
  "courses.author": { category: "Courses", description: "Create and edit draft courses and lessons" },
  "courses.review": { category: "Courses", description: "Perform editorial review of course drafts" },
  "courses.approve.clinical": { category: "Courses", description: "Grant clinical approval (qualified clinician)" },
  "courses.approve.compliance": { category: "Courses", description: "Grant compliance approval" },
  "courses.publish": { category: "Courses", description: "Publish and archive organization courses" },
  // Assessment
  "assessments.grade": { category: "Assessment", description: "Grade examinations requiring instructor review" },
  "assessments.review": { category: "Assessment", description: "Review assessment results and analytics" },
  // Competency
  "competency.view": { category: "Competency", description: "View competency records" },
  "competency.evaluate": { category: "Competency", description: "Record practical skills evaluations" },
  "competency.sign": { category: "Competency", description: "Electronically sign competency assessments" },
  // Certificates
  "certificates.view_all": { category: "Certificates", description: "View certificates for employees in scope" },
  "certificates.revoke": { category: "Certificates", description: "Revoke and correct certificates (with reason)" },
  "certificates.issue": { category: "Certificates", description: "Issue instructor certificates" },
  // Compliance
  "compliance.view": { category: "Compliance", description: "View compliance status and regulatory requirements" },
  "compliance.manage": { category: "Compliance", description: "Manage organization compliance rules and reviews" },
  // Reports
  "reports.view": { category: "Reports", description: "View reports and analytics" },
  "reports.export": { category: "Reports", description: "Export reports (PDF, Excel, CSV)" },
  // Instructors
  "instructors.manage": { category: "Instructors", description: "Manage instructor profiles and assignments" },
  // Communication
  "notifications.announce": { category: "Communication", description: "Send announcements to staff" },
  // Billing
  "billing.view": { category: "Billing", description: "View subscription, invoices and payments" },
  "billing.manage": { category: "Billing", description: "Change plan and payment methods" },
  "integrations.manage": { category: "Integrations", description: "Create and revoke API keys for integrations" },
  // Audit
  "audit.view": { category: "Audit", description: "View the organization audit trail" },
  // Self-service learning (every learner)
  "learning.self": { category: "Learning", description: "Access assigned courses, take exams, view own records" },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[];

export type SystemRoleKey =
  | "org_admin"
  | "training_director"
  | "facility_admin"
  | "instructor"
  | "supervisor"
  | "clinical_reviewer"
  | "learner"
  | "academy_director"
  | "compliance_officer"
  | "course_administrator"
  | "certificate_verifier";

export const SYSTEM_ROLES: Record<
  SystemRoleKey,
  { name: string; description: string; facilityScoped: boolean; permissions: PermissionKey[] }
> = {
  org_admin: {
    name: "Organization Administrator",
    description: "Full administration of the organization's training program",
    facilityScoped: false,
    permissions: ALL_PERMISSIONS.filter((p) => p !== "courses.approve.clinical"),
  },
  training_director: {
    name: "Training Director",
    description: "Develops training programs, manages instructors and assignments",
    facilityScoped: false,
    permissions: [
      "employees.view",
      "training.view_all",
      "training.assign",
      "training.requirements.manage",
      "training.schedule.manage",
      "training.records.approve",
      "courses.view",
      "courses.author",
      "courses.review",
      "courses.approve.compliance",
      "courses.publish",
      "assessments.grade",
      "assessments.review",
      "competency.view",
      "certificates.view_all",
      "certificates.issue",
      "compliance.view",
      "compliance.manage",
      "reports.view",
      "reports.export",
      "instructors.manage",
      "notifications.announce",
      "learning.self",
    ],
  },
  facility_admin: {
    name: "Facility Administrator",
    description: "Manages employees and training within assigned facilities",
    facilityScoped: true,
    permissions: [
      "employees.view",
      "employees.manage",
      "training.view_all",
      "training.assign",
      "training.records.approve",
      "courses.view",
      "competency.view",
      "competency.evaluate",
      "competency.sign",
      "certificates.view_all",
      "compliance.view",
      "reports.view",
      "reports.export",
      "notifications.announce",
      "learning.self",
    ],
  },
  instructor: {
    name: "Instructor",
    description: "Creates lessons, conducts classes, grades exams, evaluates skills",
    facilityScoped: false,
    permissions: [
      "courses.view",
      "courses.author",
      "training.schedule.manage",
      "assessments.grade",
      "assessments.review",
      "competency.view",
      "competency.evaluate",
      "competency.sign",
      "reports.view",
      "learning.self",
    ],
  },
  supervisor: {
    name: "Supervisor",
    description: "Monitors assigned employees and verifies practical competencies",
    facilityScoped: false,
    // Least privilege: supervisors see their direct reports only (team.view is
    // enforced in the database through employees.supervisor_id).
    permissions: [
      "team.view",
      "training.records.approve",
      "courses.view",
      "competency.evaluate",
      "competency.sign",
      "reports.view",
      "learning.self",
    ],
  },
  clinical_reviewer: {
    name: "Clinical Content Reviewer",
    description: "Qualified, licensed clinician who grants clinical approval of course content",
    facilityScoped: false,
    permissions: ["courses.view", "courses.review", "courses.approve.clinical", "learning.self"],
  },
  academy_director: {
    name: "Academy Director",
    description: "Leads the training academy: programs, instructors, certificates, revenue and reports",
    facilityScoped: false,
    permissions: ALL_PERMISSIONS.filter((p) => p !== "courses.approve.clinical" && p !== "integrations.manage" && p !== "org.roles.manage"),
  },
  compliance_officer: {
    name: "Compliance Officer",
    description: "Oversees regulatory requirements, compliance approval of courses, certificates and audit trails",
    facilityScoped: false,
    permissions: [
      "employees.view",
      "training.view_all",
      "courses.view",
      "courses.review",
      "courses.approve.compliance",
      "competency.view",
      "certificates.view_all",
      "certificates.revoke",
      "compliance.view",
      "compliance.manage",
      "reports.view",
      "reports.export",
      "audit.view",
      "learning.self",
    ],
  },
  course_administrator: {
    name: "Course Administrator",
    description: "Builds and publishes courses, examinations and schedules; assigns training",
    facilityScoped: false,
    permissions: [
      "courses.view",
      "courses.author",
      "courses.review",
      "courses.publish",
      "training.view_all",
      "training.assign",
      "training.requirements.manage",
      "training.schedule.manage",
      "assessments.review",
      "instructors.manage",
      "certificates.view_all",
      "certificates.issue",
      "reports.view",
      "learning.self",
    ],
  },
  certificate_verifier: {
    name: "Certificate Verification User",
    description: "Read-only access to staff certificates and their verification history",
    facilityScoped: false,
    permissions: ["employees.view", "certificates.view_all", "learning.self"],
  },
  learner: {
    name: "Healthcare Employee / Student",
    description: "Completes assigned training and views personal records",
    facilityScoped: false,
    permissions: ["courses.view", "learning.self"],
  },
};
