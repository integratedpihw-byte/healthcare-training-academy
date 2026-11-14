import type { PermissionKey } from "./rbac/catalog";
import type { Feature } from "./billing/plans";

/**
 * Main navigation (spec section 22). Each module declares the development phase
 * that delivers it. Modules are shown only once delivered, so users never land
 * on a placeholder ("coming soon") screen.
 */
export const CURRENT_PHASE = 6;

export interface NavItem {
  key: string;
  label: string;
  href: string;
  phase: number;
  /** Any of these permissions grants visibility. Empty = every tenant member. */
  anyOf: PermissionKey[];
  /** Plan feature required (spec §19). */
  feature?: Feature;
}

export const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", phase: 1, anyOf: [] },
  { key: "catalog", label: "Course Catalog", href: "/catalog", phase: 2, anyOf: ["courses.view"] },
  { key: "learning", label: "My Learning", href: "/learning", phase: 2, anyOf: ["learning.self"] },
  { key: "training", label: "Training Management", href: "/training", phase: 4, anyOf: ["training.assign", "training.view_all", "training.requirements.manage"] },
  { key: "employees", label: "Employee Management", href: "/employees", phase: 4, anyOf: ["employees.view", "employees.manage", "team.view"] },
  { key: "competency", label: "Competency Management", href: "/competency", phase: 3, anyOf: ["competency.view", "competency.evaluate"], feature: "competency" },
  { key: "certificates", label: "Certificates", href: "/certificates", phase: 3, anyOf: [] },
  { key: "compliance", label: "Compliance Center", href: "/compliance", phase: 5, anyOf: ["compliance.view", "compliance.manage"], feature: "compliance" },
  { key: "instructor", label: "Instructor Portal", href: "/instructor", phase: 3, anyOf: ["assessments.grade", "assessments.review", "training.assign", "training.schedule.manage", "instructors.manage"] },
  { key: "reports", label: "Reports and Analytics", href: "/reports", phase: 5, anyOf: ["reports.view"] },
  { key: "notifications", label: "Notifications", href: "/notifications", phase: 1, anyOf: [] },
  { key: "billing", label: "Billing", href: "/billing", phase: 1, anyOf: ["billing.view"] },
  { key: "admin", label: "Administration", href: "/admin", phase: 1, anyOf: ["org.settings.manage", "org.facilities.manage", "org.users.manage", "org.roles.manage", "audit.view", "integrations.manage"] },
  { key: "settings", label: "Settings", href: "/settings", phase: 1, anyOf: [] },
];

export function visibleNav(can: (p: PermissionKey) => boolean, has: (f: Feature) => boolean = () => true): NavItem[] {
  return NAV.filter((n) => n.phase <= CURRENT_PHASE && (n.anyOf.length === 0 || n.anyOf.some(can)) && (!n.feature || has(n.feature)));
}
