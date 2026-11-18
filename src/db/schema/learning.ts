// Course content, regulatory engine, LMS, assessment, competency, certificates.
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  unique,
  uuid,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  sessionStatus,
  regulatoryCategory,
  ruleKind,
  ruleDecision,
  assignmentSource,
  approvalDecision,
  approvalStage,
  assignmentStatus,
  attendanceStatus,
  certificateKind,
  certificateStatus,
  programClassification,
  competencyAssessmentStatus,
  competencyResult,
  contentStatus,
  courseDepartment,
  createdAt,
  enrollmentStatus,
  facilityType,
  gradingStatus,
  jurisdiction,
  lessonType,
  pk,
  progressStatus,
  questionType,
  requirementSource,
  ruleComplianceStatus,
  sessionDelivery,
  tstz,
  updatedAt,
} from "./_shared";
import {
  employees,
  facilities,
  globalTenantIdColumn as globalTenantId,
  instructors,
  tenantIdColumn as tenantId,
  users,
} from "./core";

// ---------------------------------------------------------------------------
// Course content (tenant_id NULL = master library content)
// ---------------------------------------------------------------------------

export const courseCategories = pgTable(
  "course_categories",
  {
    id: pk(),
    tenantId: globalTenantId(),
    name: text().notNull(),
    slug: text().notNull(),
    department: courseDepartment().notNull(),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [index().on(t.tenantId), unique().on(t.tenantId, t.slug).nullsNotDistinct()],
);

export const courses = pgTable(
  "courses",
  {
    id: pk(),
    tenantId: globalTenantId(),
    /** Course identification number, e.g. CHITA-MC-001. */
    code: text().notNull(),
    title: text().notNull(),
    categoryId: uuid()
      .notNull()
      .references(() => courseCategories.id),
    status: contentStatus().notNull().default("DRAFT"),
    currentVersionId: uuid().references((): AnyPgColumn => courseVersions.id, {
      onDelete: "set null",
    }),
    isRequiredByDefault: boolean().notNull().default(false),
    certificateEligible: boolean().notNull().default(true),
    passingScore: integer().notNull().default(80),
    /** NULL = no renewal. Never inferred: set only from verified rules or org policy. */
    renewalMonths: integer(),
    estimatedMinutes: integer().notNull().default(60),
    /** Program type shown in the catalog and on certificates (brief §6). */
    programClassification: programClassification().notNull().default("GENERAL_EDUCATION"),
    /** Certificate type issued on completion. */
    certificateType: certificateKind("certificate_type").notNull().default("COURSE_COMPLETION"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.tenantId),
    index().on(t.categoryId),
    unique().on(t.tenantId, t.code).nullsNotDistinct(),
  ],
);

export const courseVersions = pgTable(
  "course_versions",
  {
    id: pk(),
    tenantId: globalTenantId(),
    courseId: uuid()
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    versionNumber: integer().notNull(),
    status: contentStatus().notNull().default("DRAFT"),
    description: text().notNull(),
    targetAudience: text().notNull(),
    prerequisites: text().array().notNull().default([]),
    /** [{agency, citation, title, url}] */
    regulatoryReferences: jsonb().notNull().default([]),
    /** [{title, publisher, url, publishedOn, accessedOn}] */
    sourceReferences: jsonb().notNull().default([]),
    completionCriteria: text(),
    authorUserId: uuid(),
    authorName: text(),
    reviewerUserId: uuid(),
    reviewerName: text(),
    clinicalReviewRequired: boolean().notNull().default(false),
    /** Plain statement of what this course is and is not (e.g. "educational; does not by itself meet …"). */
    credentialNotice: text(),
    /** Renewal / continuing education requirements, where a program establishes them. */
    renewalRequirements: text(),
    /** Instructor notes and resources (Markdown), shown to instructors and course authors only. */
    instructorResources: text(),
    publishedAt: tstz(),
    revisedAt: tstz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.courseId, t.versionNumber)],
);

export const learningObjectives = pgTable(
  "learning_objectives",
  {
    id: pk(),
    tenantId: globalTenantId(),
    courseVersionId: uuid()
      .notNull()
      .references(() => courseVersions.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull(),
    text: text().notNull(),
  },
  (t) => [index().on(t.tenantId), index().on(t.courseVersionId)],
);

export const modules = pgTable(
  "modules",
  {
    id: pk(),
    tenantId: globalTenantId(),
    courseVersionId: uuid()
      .notNull()
      .references(() => courseVersions.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull(),
    title: text().notNull(),
    summary: text(),
  },
  (t) => [index().on(t.tenantId), index().on(t.courseVersionId)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: pk(),
    tenantId: globalTenantId(),
    moduleId: uuid()
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull(),
    title: text().notNull(),
    type: lessonType().notNull().default("TEXT"),
    /** Markdown body. */
    body: text().notNull().default(""),
    mediaUrl: text(),
    mediaMeta: jsonb(),
    durationMinutes: integer().notNull().default(5),
    isRequired: boolean().notNull().default(true),
  },
  (t) => [index().on(t.tenantId), index().on(t.moduleId)],
);

export const courseApprovals = pgTable(
  "course_approvals",
  {
    id: pk(),
    tenantId: globalTenantId(),
    courseVersionId: uuid()
      .notNull()
      .references(() => courseVersions.id, { onDelete: "cascade" }),
    stage: approvalStage().notNull(),
    decision: approvalDecision().notNull(),
    reviewerUserId: uuid().notNull(),
    reviewerCredentials: text(),
    comments: text(),
    decidedAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), index().on(t.courseVersionId)],
);

export const courseReviews = pgTable(
  "course_reviews",
  {
    id: pk(),
    tenantId: tenantId(),
    courseId: uuid()
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid().notNull(),
    rating: integer().notNull(),
    comment: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.tenantId, t.courseId, t.userId)],
);

// ---------------------------------------------------------------------------
// Regulatory compliance engine (platform-global reference data)
// ---------------------------------------------------------------------------

export const regulatorySources = pgTable("regulatory_sources", {
  id: pk(),
  agency: text().notNull(),
  category: regulatoryCategory().notNull(),
  jurisdiction: jurisdiction().notNull(),
  /** STATUTE | REGULATION | GUIDANCE | PROGRAM_MANUAL */
  sourceKind: text().notNull().default("REGULATION"),
  title: text().notNull(),
  url: text().notNull(),
  /** Official publisher (e.g. eCFR, leg.state.fl.us) vs. a secondary copy. */
  isOfficial: boolean().notNull().default(true),
  publicationDate: date(),
  lastVerifiedAt: tstz(),
  notes: text(),
  createdAt: createdAt(),
});

/**
 * Regulatory requirement (spec §11). A rule never asserts a training frequency unless
 * frequency_verified = true (CHECK). Unverified items are surfaced for review.
 * Every change creates an immutable row in regulatory_rule_versions (trigger).
 */
export const regulatoryRules = pgTable(
  "regulatory_rules",
  {
    id: pk(),
    sourceId: uuid()
      .notNull()
      .references(() => regulatorySources.id),
    agency: text().notNull(),
    category: regulatoryCategory().notNull(),
    kind: ruleKind().notNull().default("TRAINING_MANDATE"),
    jurisdiction: jurisdiction().notNull(),
    citation: text().notNull(),
    title: text().notNull(),
    /** The training requirement in plain language. */
    requirementText: text().notNull(),
    /** Applicable employee role(s), described as in the source. */
    audienceText: text(),
    facilityTypes: facilityType().array().notNull().default([]),
    /** Facility license types (facilities.license_type); empty = any. */
    facilityLicenseTypes: text().array().notNull().default([]),
    positionCodes: text().array().notNull().default([]),
    /** Job-duty tags (employees.job_duties); empty = any. */
    jobDuties: text().array().notNull().default([]),
    requiresClinicalExposure: boolean().notNull().default(false),
    requiresBloodborneExposure: boolean().notNull().default(false),
    frequencyMonths: integer(),
    frequencyVerified: boolean().notNull().default(false),
    /** Frequency and initial timing exactly as the source states them. */
    frequencyText: text(),
    initialTimingText: text(),
    initialDueDaysFromHire: integer(),
    effectiveDate: date(),
    lastVerifiedAt: tstz(),
    /** What was checked, against which copy, and anything still open. */
    verificationNote: text(),
    /** Pending rulemaking or legislation that may change the rule. */
    pendingChangeNote: text(),
    reviewerName: text(),
    reviewerUserId: uuid(),
    complianceStatus: ruleComplianceStatus().notNull().default("NEEDS_REVIEW"),
    /** Library course codes that may help satisfy the rule (not a legal determination). */
    suggestedCourseCodes: text().array().notNull().default([]),
    isActive: boolean().notNull().default(true),
    version: integer().notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.citation, t.title),
    check("regulatory_rules_frequency_ck", sql`frequency_months is null or frequency_verified`),
    check("regulatory_rules_verified_ck", sql`compliance_status <> 'VERIFIED' or last_verified_at is not null`),
  ],
);

/** Immutable history of every rule change (written by trigger). */
export const regulatoryRuleVersions = pgTable(
  "regulatory_rule_versions",
  {
    id: pk(),
    ruleId: uuid()
      .notNull()
      .references(() => regulatoryRules.id),
    version: integer().notNull(),
    snapshot: jsonb().notNull(),
    changeSummary: text().notNull(),
    changedById: uuid(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.ruleId, t.version)],
);

/**
 * An organization's documented applicability decision for a rule (insert-only
 * history; the latest row per tenant/rule/facility is current). A decision made on
 * an older rule version is flagged for re-review.
 */
export const tenantRuleDecisions = pgTable(
  "tenant_rule_decisions",
  {
    id: pk(),
    tenantId: tenantId(),
    ruleId: uuid()
      .notNull()
      .references(() => regulatoryRules.id),
    /** NULL = organization-wide decision. */
    facilityId: uuid(),
    decision: ruleDecision().notNull(),
    rationale: text().notNull(),
    ruleVersion: integer().notNull(),
    decidedById: uuid().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId, t.ruleId, t.createdAt), check("tenant_rule_decisions_rationale_ck", sql`length(trim(rationale)) >= 10`)],
);

/** Daily facility compliance snapshot for trend reporting. */
export const complianceSnapshots = pgTable(
  "compliance_snapshots",
  {
    id: pk(),
    tenantId: tenantId(),
    facilityId: uuid(),
    snapshotDate: date().notNull(),
    applicable: integer().notNull(),
    satisfied: integer().notNull(),
    overdue: integer().notNull(),
    gaps: integer().notNull(),
    needsReview: integer().notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.tenantId, t.facilityId, t.snapshotDate).nullsNotDistinct(), index().on(t.tenantId, t.snapshotDate)],
);

/** Maps a rule (or org policy) to a course. tenant_id NULL = platform default mapping. */
export const trainingRequirements = pgTable(
  "training_requirements",
  {
    id: pk(),
    tenantId: globalTenantId(),
    /** Exactly one of course_id / competency_id is set (CHECK constraint). */
    courseId: uuid().references(() => courses.id, { onDelete: "cascade" }),
    competencyId: uuid().references((): AnyPgColumn => competencies.id, { onDelete: "cascade" }),
    title: text(),
    regulatoryRuleId: uuid().references(() => regulatoryRules.id),
    source: requirementSource().notNull(),
    /** Empty array = applies to every facility type. */
    facilityTypes: facilityType().array().notNull().default([]),
    /** Empty array = applies to every position. */
    positionCodes: text().array().notNull().default([]),
    /** Facility license-type tags; empty = any. */
    facilityLicenseTypes: text().array().notNull().default([]),
    /** Job-duty tags (employees.job_duties); empty = any. */
    jobDuties: text().array().notNull().default([]),
    requiresClinicalExposure: boolean().notNull().default(false),
    requiresBloodborneExposure: boolean().notNull().default(false),
    frequencyMonths: integer(),
    dueWithinDaysOfHire: integer(),
    /** Overrides the organization's reminder schedule (days before due/expiry). */
    reminderLeadDays: integer().array(),
    needsAdminReview: boolean().notNull().default(false),
    isActive: boolean().notNull().default(true),
    notes: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.tenantId),
    index().on(t.courseId),
    check("training_requirements_target_ck", sql`num_nonnulls(course_id, competency_id) = 1`),
    // A requirement labelled as regulation must cite the platform rule it implements.
    check("training_requirements_regulation_ck", sql`source not in ('FEDERAL_REGULATION', 'STATE_REGULATION') or regulatory_rule_id is not null`),
  ],
);

// ---------------------------------------------------------------------------
// Learning management
// ---------------------------------------------------------------------------

export const trainingAssignments = pgTable(
  "training_assignments",
  {
    id: pk(),
    tenantId: tenantId(),
    employeeId: uuid()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => courses.id),
    requirementId: uuid().references(() => trainingRequirements.id),
    assignedById: uuid(),
    source: assignmentSource().notNull().default("MANUAL"),
    reason: text(),
    dueDate: date(),
    status: assignmentStatus().notNull().default("ASSIGNED"),
    completedAt: tstz(),
    /** Certificate whose upcoming expiry created this renewal assignment. */
    renewsCertificateId: uuid(),
    /** Reason for waive/cancel/due-date correction (required by the service). */
    statusReason: text(),
    closedById: uuid(),
    closedAt: tstz(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.tenantId),
    index().on(t.tenantId, t.status, t.dueDate),
    index().on(t.employeeId),
    // One open assignment per employee and course.
    uniqueIndex("training_assignments_open_uq")
      .on(t.employeeId, t.courseId)
      .where(sql`status in ('ASSIGNED', 'IN_PROGRESS', 'OVERDUE')`),
  ],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => courses.id),
    /** Learners stay pinned to the version they enrolled in. */
    courseVersionId: uuid()
      .notNull()
      .references(() => courseVersions.id),
    assignmentId: uuid().references(() => trainingAssignments.id, { onDelete: "set null" }),
    status: enrollmentStatus().notNull().default("NOT_STARTED"),
    progressPct: integer().notNull().default(0),
    lastLessonId: uuid(),
    /** Additional exam attempts authorized by an administrator (retake workflow). */
    extraAttempts: integer().notNull().default(0),
    startedAt: tstz(),
    completedAt: tstz(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.tenantId), index().on(t.tenantId, t.userId)],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: pk(),
    tenantId: tenantId(),
    enrollmentId: uuid()
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    lessonId: uuid()
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    status: progressStatus().notNull().default("NOT_STARTED"),
    secondsSpent: integer().notNull().default(0),
    videoPositionS: integer().notNull().default(0),
    bookmarked: boolean().notNull().default(false),
    completedAt: tstz(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.enrollmentId, t.lessonId)],
);

export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: pk(),
    tenantId: tenantId(),
    courseId: uuid().references(() => courses.id, { onDelete: "set null" }),
    instructorId: uuid().references(() => instructors.id, { onDelete: "set null" }),
    facilityId: uuid().references(() => facilities.id, { onDelete: "set null" }),
    title: text().notNull(),
    delivery: sessionDelivery().notNull(),
    location: text(),
    meetingUrl: text(),
    startsAt: tstz().notNull(),
    endsAt: tstz().notNull(),
    capacity: integer(),
    description: text(),
    status: sessionStatus().notNull().default("SCHEDULED"),
    cancelledReason: text(),
    createdById: uuid(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.tenantId, t.startsAt), check("training_sessions_time_ck", sql`ends_at > starts_at`)],
);

/** Courses an instructor is assigned to teach (spec §17). */
export const instructorCourses = pgTable(
  "instructor_courses",
  {
    id: pk(),
    tenantId: tenantId(),
    instructorId: uuid()
      .notNull()
      .references(() => instructors.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    assignedById: uuid(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.instructorId, t.courseId), index().on(t.tenantId)],
);

export const attendance = pgTable(
  "attendance",
  {
    id: pk(),
    tenantId: tenantId(),
    sessionId: uuid()
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: attendanceStatus().notNull().default("REGISTERED"),
    checkedInAt: tstz(),
    recordedById: uuid(),
    notes: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.sessionId, t.userId)],
);

// ---------------------------------------------------------------------------
// Examination & assessment
// ---------------------------------------------------------------------------

export const questionBanks = pgTable(
  "question_banks",
  {
    id: pk(),
    tenantId: globalTenantId(),
    courseId: uuid().references(() => courses.id, { onDelete: "set null" }),
    name: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId)],
);

export const questions = pgTable(
  "questions",
  {
    id: pk(),
    tenantId: globalTenantId(),
    bankId: uuid()
      .notNull()
      .references(() => questionBanks.id, { onDelete: "cascade" }),
    type: questionType().notNull(),
    prompt: text().notNull(),
    /** [{id, text}] or matching pairs, depending on type. */
    options: jsonb().notNull().default([]),
    correctAnswer: jsonb().notNull(),
    explanation: text().notNull(),
    imageUrl: text(),
    points: integer().notNull().default(1),
    difficulty: integer().notNull().default(2),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), index().on(t.bankId)],
);

export const examinations = pgTable(
  "examinations",
  {
    id: pk(),
    tenantId: globalTenantId(),
    courseVersionId: uuid()
      .notNull()
      .references(() => courseVersions.id, { onDelete: "cascade" }),
    questionBankId: uuid()
      .notNull()
      .references(() => questionBanks.id),
    title: text().notNull(),
    isFinal: boolean().notNull().default(true),
    isMandatory: boolean().notNull().default(true),
    passingScore: integer().notNull().default(80),
    questionCount: integer().notNull().default(15),
    randomize: boolean().notNull().default(true),
    maxAttempts: integer().notNull().default(3),
    timeLimitMinutes: integer(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId)],
);

export const examinationAttempts = pgTable(
  "examination_attempts",
  {
    id: pk(),
    tenantId: tenantId(),
    examinationId: uuid()
      .notNull()
      .references(() => examinations.id),
    enrollmentId: uuid()
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    userId: uuid().notNull(),
    attemptNumber: integer().notNull(),
    questionIds: uuid().array().notNull(),
    startedAt: createdAt(),
    /** Set when the exam has a time limit; answers saved before expiry are graded. */
    expiresAt: tstz(),
    submittedAt: tstz(),
    scorePct: integer(),
    passed: boolean(),
    gradingStatus: gradingStatus().notNull().default("IN_PROGRESS"),
    gradedById: uuid(),
    gradedAt: tstz(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.enrollmentId, t.examinationId, t.attemptNumber)],
);

export const examinationAnswers = pgTable(
  "examination_answers",
  {
    id: pk(),
    tenantId: tenantId(),
    attemptId: uuid()
      .notNull()
      .references(() => examinationAttempts.id, { onDelete: "cascade" }),
    questionId: uuid()
      .notNull()
      .references(() => questions.id),
    response: jsonb().notNull(),
    isCorrect: boolean(),
    pointsAwarded: numeric({ precision: 6, scale: 2 }),
    instructorComment: text(),
    gradedById: uuid(),
    savedAt: tstz().notNull().defaultNow(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.attemptId, t.questionId)],
);

// ---------------------------------------------------------------------------
// Competency & skills validation
// ---------------------------------------------------------------------------

export const competencies = pgTable(
  "competencies",
  {
    id: pk(),
    tenantId: globalTenantId(),
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    /** [{id, text, critical:boolean}] */
    criteria: jsonb().notNull().default([]),
    renewalMonths: integer(),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), unique().on(t.tenantId, t.code).nullsNotDistinct()],
);

/**
 * Theoretical course completion NEVER creates a competency record.
 * Records are created and electronically signed only by an authorized evaluator.
 */
export const competencyAssessments = pgTable(
  "competency_assessments",
  {
    id: pk(),
    tenantId: tenantId(),
    employeeId: uuid()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    facilityId: uuid()
      .notNull()
      .references(() => facilities.id),
    competencyId: uuid()
      .notNull()
      .references(() => competencies.id),
    evaluatorUserId: uuid().notNull(),
    assessedOn: date().notNull(),
    criteriaResults: jsonb().notNull().default([]),
    result: competencyResult().notNull(),
    remediationRequired: text(),
    evaluatorComments: text(),
    evidenceUrls: text().array().notNull().default([]),
    nextAssessmentDue: date(),
    status: competencyAssessmentStatus().notNull().default("DRAFT"),
    signedAt: tstz(),
    signatureHash: text(),
    signerName: text(),
    signerCredentials: text(),
    voidedAt: tstz(),
    voidedById: uuid(),
    voidReason: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.tenantId), index().on(t.tenantId, t.nextAssessmentDue)],
);

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export const certificates = pgTable(
  "certificates",
  {
    id: pk(),
    tenantId: tenantId(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    employeeId: uuid().references(() => employees.id, { onDelete: "set null" }),
    courseId: uuid().references(() => courses.id),
    enrollmentId: uuid().references(() => enrollments.id),
    kind: certificateKind().notNull(),
    certificateNumber: text().notNull().unique(),
    verificationCode: text().notNull().unique(),
    recipientName: text().notNull(),
    courseTitle: text().notNull(),
    courseCode: text(),
    trainingHours: numeric({ precision: 5, scale: 2 }).notNull(),
    issuingAuthority: text().notNull(),
    issuedAt: createdAt(),
    completedOn: date().notNull(),
    expiresOn: date(),
    status: certificateStatus().notNull().default("ACTIVE"),
    /** Populated ONLY when a real CE approval exists ({provider, approvalNumber, body}). */
    accreditation: jsonb(),
    revokedAt: tstz(),
    revokedById: uuid(),
    revocationReason: text(),
    supersedesId: uuid(),
    programClassification: programClassification(),
    /** Copied from the course version at issue: what the certificate does and does not represent. */
    programNotice: text(),
    instructorName: text(),
    signatoryName: text(),
    signatoryTitle: text(),
    renewalRequirements: text(),
    /** Set on a replacement certificate issued to correct an error in the one it supersedes. */
    correctionReason: text(),
    issuedById: uuid(),
    /** Certificate of Competency: the signed skills evaluation it documents. */
    competencyAssessmentId: uuid(),
  },
  (t) => [index().on(t.tenantId), index().on(t.tenantId, t.expiresOn), index().on(t.userId)],
);

export const certificateVerifications = pgTable(
  "certificate_verifications",
  {
    id: pk(),
    tenantId: tenantId(),
    certificateId: uuid()
      .notNull()
      .references(() => certificates.id, { onDelete: "cascade" }),
    verifiedAt: createdAt(),
    ipHash: text(),
    userAgent: text(),
  },
  (t) => [index().on(t.tenantId)],
);

/**
 * Register of real approvals and accreditations (state program approvals, CE provider
 * approvals, DOEA curriculum approvals …). Platform-owned; read-only to tenants.
 * A course may be classified STATE_APPROVED_PROGRAM or CONTINUING_EDUCATION only while
 * an ACTIVE, unexpired approval exists here.
 */
export const programApprovals = pgTable(
  "program_approvals",
  {
    id: pk(),
    courseId: uuid()
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    approvingBody: text().notNull(),
    approvalNumber: text().notNull(),
    scope: text(),
    effectiveOn: date().notNull(),
    expiresOn: date(),
    status: text().notNull().default("ACTIVE"),
    sourceUrl: text(),
    verifiedOn: date().notNull(),
    verifiedById: uuid(),
    notes: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index().on(t.courseId),
    check("program_approvals_kind", sql`${t.kind} in ('STATE_PROGRAM_APPROVAL','CE_PROVIDER_APPROVAL','CURRICULUM_APPROVAL','ACCREDITATION','PARTNER_AUTHORIZATION')`),
    check("program_approvals_status", sql`${t.status} in ('ACTIVE','EXPIRED','WITHDRAWN')`),
  ],
);
