/**
 * Subscription plans and entitlements (spec §19).
 *
 * List prices are configuration, not law: set them here (or override per tenant with
 * custom enterprise terms in the platform console). Stripe Price IDs come from the
 * environment so the same build works in test and live mode.
 */

export type PlanCode = "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | "INDIVIDUAL_LEARNER";
export type Feature =
  | "competency"
  | "compliance"
  | "customCourses"
  | "advancedRoles"
  | "apiIntegrations"
  | "analytics"
  | "aiAssistant"
  | "instructorLed"
  | "multiDepartment";

export interface PlanDef {
  code: PlanCode;
  name: string;
  audience: string;
  highlights: string[];
  /** Monthly list price in cents per unit (employee or facility); annual = 10× monthly. */
  monthlyCents: number;
  unit: "employee" | "facility" | "learner";
  /** null = unlimited */
  maxFacilities: number | null;
  defaultSeats: number;
  features: Feature[];
}

export const PLANS: Record<PlanCode, PlanDef> = {
  STARTER: {
    code: "STARTER",
    name: "Starter",
    audience: "Small healthcare practices",
    highlights: ["Up to 25 employees", "Standard training catalog", "Basic reporting", "Training assignments and reminders"],
    monthlyCents: 600,
    unit: "employee",
    maxFacilities: 1,
    defaultSeats: 25,
    features: [],
  },
  PROFESSIONAL: {
    code: "PROFESSIONAL",
    name: "Professional",
    audience: "Growing organizations with several departments",
    highlights: ["Multiple departments", "Expanded training library", "Competency management", "Compliance dashboards", "AI education assistant", "Instructor-led classes"],
    monthlyCents: 900,
    unit: "employee",
    maxFacilities: 3,
    defaultSeats: 150,
    features: ["competency", "compliance", "multiDepartment", "aiAssistant", "instructorLed"],
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    name: "Enterprise",
    audience: "Multi-facility organizations",
    highlights: ["Unlimited facilities", "Advanced reporting and organization-wide analytics", "Custom courses", "Advanced role permissions", "API integrations"],
    monthlyCents: 15000,
    unit: "facility",
    maxFacilities: null,
    defaultSeats: 1000,
    features: ["competency", "compliance", "customCourses", "advancedRoles", "apiIntegrations", "analytics", "aiAssistant", "instructorLed", "multiDepartment"],
  },
  INDIVIDUAL_LEARNER: {
    code: "INDIVIDUAL_LEARNER",
    name: "Individual Learner",
    audience: "Healthcare workers training on their own",
    highlights: ["Personal course enrollment", "Individual training history", "Certificate access"],
    monthlyCents: 1500,
    unit: "learner",
    maxFacilities: 0,
    defaultSeats: 1,
    features: ["aiAssistant"],
  },
};

export const FEATURE_LABELS: Record<Feature, string> = {
  competency: "Competency management",
  compliance: "Compliance Center",
  customCourses: "Custom courses",
  advancedRoles: "Custom roles and permissions",
  apiIntegrations: "API integrations",
  analytics: "Organization-wide analytics",
  aiAssistant: "AI education assistant",
  instructorLed: "Instructor-led classes",
  multiDepartment: "Multiple departments",
};

export const TRIAL_DAYS = 14;

export interface SubscriptionLike {
  plan: PlanCode;
  status: string;
  seats: number;
  facilityLimit: number | null;
}

export interface Entitlements {
  plan: PlanDef;
  status: string;
  features: Set<Feature>;
  seats: number;
  maxFacilities: number | null;
  /** Canceled or incomplete subscriptions keep read access but cannot add staff/content. */
  restricted: boolean;
}

export function entitlementsFor(sub: SubscriptionLike | null): Entitlements {
  const plan = PLANS[sub?.plan ?? "STARTER"];
  const restricted = !sub || ["CANCELED", "INCOMPLETE"].includes(sub.status);
  return {
    plan,
    status: sub?.status ?? "NONE",
    features: new Set(restricted ? [] : plan.features),
    seats: sub?.seats ?? plan.defaultSeats,
    maxFacilities: sub?.facilityLimit ?? plan.maxFacilities,
    restricted,
  };
}

export function hasFeature(e: Entitlements, f: Feature) {
  return e.features.has(f);
}

/** Price for a quantity on a cycle; annual billing is 10× monthly (two months free). */
export function quote(plan: PlanCode, cycle: "MONTHLY" | "ANNUAL", quantity: number) {
  const p = PLANS[plan];
  const unitCents = cycle === "ANNUAL" ? p.monthlyCents * 10 : p.monthlyCents;
  return { unitCents, totalCents: unitCents * Math.max(1, quantity), unit: p.unit };
}

/** Stripe Price IDs per plan and cycle (environment configuration). */
export function stripePriceId(plan: PlanCode, cycle: "MONTHLY" | "ANNUAL"): string | undefined {
  return process.env[`STRIPE_PRICE_${plan}_${cycle}`];
}

export function usd(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
