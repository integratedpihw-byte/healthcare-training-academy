import { pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";

// Column helpers. The database uses snake_case (configured via `casing`).
export const pk = () => uuid().primaryKey().defaultRandom();
export const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
export const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
export const tstz = () => timestamp({ withTimezone: true });

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const tenantStatus = pgEnum("tenant_status", [
  "PENDING_APPROVAL",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "CLOSED",
]);
export const tenantType = pgEnum("tenant_type", ["ORGANIZATION", "INDIVIDUAL"]);

export const FACILITY_TYPES = [
  "HOSPITAL",
  "MEDICAL_PRACTICE",
  "CLINIC",
  "ASSISTED_LIVING_FACILITY",
  "GROUP_HOME",
  "ADULT_DAY_CARE",
  "HOME_HEALTH_AGENCY",
  "SKILLED_NURSING_FACILITY",
  "BEHAVIORAL_HEALTH",
  "COMMUNITY_HEALTH_CENTER",
  "HIV_AIDS_ORGANIZATION",
  "PHARMACY",
  "LABORATORY",
  "STAFFING_AGENCY",
  "OTHER",
] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];
export const facilityType = pgEnum("facility_type", FACILITY_TYPES);

export const userStatus = pgEnum("user_status", ["ACTIVE", "INVITED", "DISABLED"]);
export const membershipStatus = pgEnum("membership_status", ["ACTIVE", "INVITED", "SUSPENDED"]);
export const employmentStatus = pgEnum("employment_status", [
  "ACTIVE",
  "ON_LEAVE",
  "TERMINATED",
  "PRN",
  "CONTRACTOR",
]);
export const licenseKind = pgEnum("license_kind", [
  "STATE_PROFESSIONAL_LICENSE",
  "THIRD_PARTY_CERTIFICATION",
  "FACILITY_LICENSE",
]);
export const verificationStatus = pgEnum("verification_status", [
  "UNVERIFIED",
  "VERIFIED",
  "EXPIRED",
  "REJECTED",
]);
export const courseDepartment = pgEnum("course_department", [
  "MANDATORY_COMPLIANCE",
  "CLINICAL_PATIENT_CARE",
  "HIV_INFECTIOUS_DISEASE",
  "LABORATORY_PHLEBOTOMY",
  "MEDICATION_MANAGEMENT",
  "SPECIALIZED_EDUCATION",
  "FACILITY_PROGRAM",
  "EMERGENCY_MANAGEMENT",
  "PUBLIC_HEALTH",
  "CASE_MANAGEMENT",
]);
/** Draft → Review → Clinical Approval → Compliance Approval → Published → Archived */
export const contentStatus = pgEnum("content_status", [
  "DRAFT",
  "IN_REVIEW",
  "CLINICAL_APPROVED",
  "COMPLIANCE_APPROVED",
  "PUBLISHED",
  "ARCHIVED",
]);
export const lessonType = pgEnum("lesson_type", [
  "TEXT",
  "PRESENTATION",
  "VIDEO",
  "ILLUSTRATION",
  "INTERACTIVE",
  "CASE_STUDY",
  "KNOWLEDGE_CHECK",
  "DOWNLOAD",
]);
export const requirementSource = pgEnum("requirement_source", [
  "FEDERAL_REGULATION",
  "STATE_REGULATION",
  "ACCREDITATION",
  "ORGANIZATIONAL_POLICY",
]);
export const assignmentStatus = pgEnum("assignment_status", [
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
  "WAIVED",
  "CANCELLED",
]);
export const enrollmentStatus = pgEnum("enrollment_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "AWAITING_ASSESSMENT",
  "COMPLETED",
  "FAILED",
  "WITHDRAWN",
]);
export const progressStatus = pgEnum("progress_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export const questionType = pgEnum("question_type", [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MULTIPLE_SELECT",
  "MATCHING",
  "FILL_IN_BLANK",
  "SCENARIO",
  "IMAGE_IDENTIFICATION",
  "CASE_STUDY",
  "PRACTICAL",
]);
export const gradingStatus = pgEnum("grading_status", [
  "IN_PROGRESS",
  "AUTO_GRADED",
  "PENDING_INSTRUCTOR",
  "GRADED",
]);
export const competencyResult = pgEnum("competency_result", ["PASS", "FAIL", "NEEDS_REMEDIATION"]);
export const competencyAssessmentStatus = pgEnum("competency_assessment_status", [
  "DRAFT",
  "SIGNED",
  "VOIDED",
]);
export const certificateKind = pgEnum("certificate_kind", [
  "COURSE_COMPLETION",
  "CONTINUING_EDUCATION",
  "COMPETENCY_VERIFICATION",
]);
export const certificateStatus = pgEnum("certificate_status", [
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
  "SUPERSEDED",
]);
export const jurisdiction = pgEnum("jurisdiction", ["FEDERAL", "FL"]);
/** Regulatory categories required by spec §11. */
export const REGULATORY_CATEGORIES = [
  "AHCA",
  "FL_DOH",
  "FL_BON",
  "FL_BOP",
  "FL_DCF",
  "CMS",
  "HRSA",
  "OSHA",
  "HHS_OCR",
  "CDC",
  "HIPAA",
  "MEDICARE_MEDICAID",
  "PROGRAM_340B",
] as const;
export const regulatoryCategory = pgEnum("regulatory_category", REGULATORY_CATEGORIES);
/** What kind of obligation a rule creates (not every rule is a training mandate). */
export const RULE_KINDS = [
  "TRAINING_MANDATE",
  "CONTINUING_EDUCATION",
  "COMPETENCY_ASSESSMENT",
  "PROGRAM_REQUIREMENT",
  "GUIDANCE",
  "NO_TRAINING_MANDATE_IDENTIFIED",
] as const;
export const ruleKind = pgEnum("rule_kind", RULE_KINDS);
export const ruleDecision = pgEnum("rule_decision", ["APPLICABLE", "NOT_APPLICABLE", "UNDER_REVIEW"]);
export const ruleComplianceStatus = pgEnum("rule_compliance_status", [
  "VERIFIED",
  "NEEDS_REVIEW",
  "SUPERSEDED",
]);
export const notificationChannel = pgEnum("notification_channel", ["IN_APP", "EMAIL", "SMS"]);
export const assignmentSource = pgEnum("assignment_source", ["MANUAL", "ONBOARDING", "RENEWAL", "BULK"]);
export const emailStatus = pgEnum("email_status", ["PENDING", "SENT", "FAILED"]);
export const sessionDelivery = pgEnum("session_delivery", ["IN_PERSON", "LIVE_VIRTUAL"]);
export const sessionStatus = pgEnum("session_status", ["SCHEDULED", "COMPLETED", "CANCELLED"]);
export const attendanceStatus = pgEnum("attendance_status", [
  "REGISTERED",
  "PRESENT",
  "ABSENT",
  "EXCUSED",
]);
export const planCode = pgEnum("plan_code", [
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
  "INDIVIDUAL_LEARNER",
]);
export const billingCycle = pgEnum("billing_cycle", ["MONTHLY", "ANNUAL", "CUSTOM"]);
export const pricingModel = pgEnum("pricing_model", ["PER_EMPLOYEE", "PER_FACILITY", "FLAT", "CUSTOM"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
]);
export const invoiceStatus = pgEnum("invoice_status", ["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTIBLE"]);
export const paymentStatus = pgEnum("payment_status", ["SUCCEEDED", "PENDING", "FAILED", "REFUNDED"]);
export const approvalStage = pgEnum("approval_stage", [
  "REVIEW",
  "CLINICAL_APPROVAL",
  "COMPLIANCE_APPROVAL",
  "PUBLISH",
]);
export const approvalDecision = pgEnum("approval_decision", [
  "APPROVED",
  "CHANGES_REQUESTED",
  "REJECTED",
]);

export const filePurpose = pgEnum("file_purpose", ["LICENSE_DOCUMENT", "COMPETENCY_EVIDENCE", "LESSON_MEDIA"]);
export const fileScanStatus = pgEnum("file_scan_status", ["CLEAN", "NOT_SCANNED"]);
