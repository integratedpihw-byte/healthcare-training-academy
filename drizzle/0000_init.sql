CREATE TYPE "public"."approval_decision" AS ENUM('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."approval_stage" AS ENUM('REVIEW', 'CLINICAL_APPROVAL', 'COMPLIANCE_APPROVAL', 'PUBLISH');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'WAIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('REGISTERED', 'PRESENT', 'ABSENT', 'EXCUSED');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('MONTHLY', 'ANNUAL', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."certificate_kind" AS ENUM('COURSE_COMPLETION', 'CONTINUING_EDUCATION', 'COMPETENCY_VERIFICATION');--> statement-breakpoint
CREATE TYPE "public"."certificate_status" AS ENUM('ACTIVE', 'EXPIRED', 'REVOKED', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."competency_assessment_status" AS ENUM('DRAFT', 'SIGNED', 'VOIDED');--> statement-breakpoint
CREATE TYPE "public"."competency_result" AS ENUM('PASS', 'FAIL', 'NEEDS_REMEDIATION');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'IN_REVIEW', 'CLINICAL_APPROVED', 'COMPLIANCE_APPROVED', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."course_department" AS ENUM('MANDATORY_COMPLIANCE', 'CLINICAL_PATIENT_CARE', 'HIV_INFECTIOUS_DISEASE', 'LABORATORY_PHLEBOTOMY', 'MEDICATION_MANAGEMENT', 'SPECIALIZED_EDUCATION', 'FACILITY_PROGRAM');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PRN', 'CONTRACTOR');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'AWAITING_ASSESSMENT', 'COMPLETED', 'FAILED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."facility_type" AS ENUM('HOSPITAL', 'MEDICAL_PRACTICE', 'CLINIC', 'ASSISTED_LIVING_FACILITY', 'GROUP_HOME', 'ADULT_DAY_CARE', 'HOME_HEALTH_AGENCY', 'SKILLED_NURSING_FACILITY', 'BEHAVIORAL_HEALTH', 'COMMUNITY_HEALTH_CENTER', 'HIV_AIDS_ORGANIZATION', 'PHARMACY', 'LABORATORY', 'STAFFING_AGENCY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."grading_status" AS ENUM('IN_PROGRESS', 'AUTO_GRADED', 'PENDING_INSTRUCTOR', 'GRADED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction" AS ENUM('FEDERAL', 'FL');--> statement-breakpoint
CREATE TYPE "public"."lesson_type" AS ENUM('TEXT', 'PRESENTATION', 'VIDEO', 'ILLUSTRATION', 'INTERACTIVE', 'CASE_STUDY', 'KNOWLEDGE_CHECK', 'DOWNLOAD');--> statement-breakpoint
CREATE TYPE "public"."license_kind" AS ENUM('STATE_PROFESSIONAL_LICENSE', 'THIRD_PARTY_CERTIFICATION', 'FACILITY_LICENSE');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('ACTIVE', 'INVITED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'SMS');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('SUCCEEDED', 'PENDING', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."plan_code" AS ENUM('STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'INDIVIDUAL_LEARNER');--> statement-breakpoint
CREATE TYPE "public"."pricing_model" AS ENUM('PER_EMPLOYEE', 'PER_FACILITY', 'FLAT', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECT', 'MATCHING', 'FILL_IN_BLANK', 'SCENARIO', 'IMAGE_IDENTIFICATION', 'CASE_STUDY', 'PRACTICAL');--> statement-breakpoint
CREATE TYPE "public"."requirement_source" AS ENUM('FEDERAL_REGULATION', 'STATE_REGULATION', 'ACCREDITATION', 'ORGANIZATIONAL_POLICY');--> statement-breakpoint
CREATE TYPE "public"."rule_compliance_status" AS ENUM('VERIFIED', 'NEEDS_REVIEW', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."session_delivery" AS ENUM('IN_PERSON', 'LIVE_VIRTUAL');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."tenant_type" AS ENUM('ORGANIZATION', 'INDIVIDUAL');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INVITED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('UNVERIFIED', 'VERIFIED', 'EXPIRED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"facility_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_tenantId_organizationId_facilityId_name_unique" UNIQUE NULLS NOT DISTINCT("tenant_id","organization_id","facility_id","name")
);
--> statement-breakpoint
CREATE TABLE "employee_facilities" (
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"facility_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_facilities_employee_id_facility_id_pk" PRIMARY KEY("employee_id","facility_id")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"employee_number" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"job_title" text NOT NULL,
	"position_code" text NOT NULL,
	"job_duties" text[] DEFAULT '{}' NOT NULL,
	"clinical_exposure" boolean DEFAULT false NOT NULL,
	"bloodborne_exposure" boolean DEFAULT false NOT NULL,
	"employment_status" "employment_status" DEFAULT 'ACTIVE' NOT NULL,
	"hire_date" date NOT NULL,
	"termination_date" date,
	"primary_facility_id" uuid,
	"department_id" uuid,
	"supervisor_id" uuid,
	"training_pathway" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_tenantId_employeeNumber_unique" UNIQUE("tenant_id","employee_number")
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"facility_type" "facility_type" NOT NULL,
	"license_type" text,
	"license_number" text,
	"license_expires" date,
	"address_line1" text,
	"city" text,
	"state" char(2) DEFAULT 'FL' NOT NULL,
	"postal_code" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"user_id" uuid NOT NULL,
	"title" text,
	"bio" text,
	"qualifications" text[] DEFAULT '{}' NOT NULL,
	"credentials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instructors_tenantId_userId_unique" UNIQUE NULLS NOT DISTINCT("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"kind" "license_kind" NOT NULL,
	"name" text NOT NULL,
	"license_number" text NOT NULL,
	"issuing_authority" text NOT NULL,
	"state" char(2),
	"issued_on" date,
	"expires_on" date,
	"verification_status" "verification_status" DEFAULT 'UNVERIFIED' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"facility_id" uuid,
	CONSTRAINT "membership_roles_membershipId_roleId_facilityId_unique" UNIQUE NULLS NOT DISTINCT("membership_id","role_id","facility_id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_tenantId_userId_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"ein" text,
	"phone" text,
	"email" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" char(2) DEFAULT 'FL' NOT NULL,
	"postal_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"tenant_id" uuid,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_tenantId_key_unique" UNIQUE NULLS NOT DISTINCT("tenant_id","key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"active_tenant_id" uuid,
	"mfa_verified" boolean DEFAULT false NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "sessions_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "tenant_type" DEFAULT 'ORGANIZATION' NOT NULL,
	"status" "tenant_status" DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"primary_state" char(2) DEFAULT 'FL' NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_id" uuid,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret_enc" text,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"password_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT 'REGISTERED' NOT NULL,
	"checked_in_at" timestamp with time zone,
	"recorded_by_id" uuid,
	CONSTRAINT "attendance_sessionId_userId_unique" UNIQUE("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "certificate_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"certificate_id" uuid NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_id" uuid,
	"course_id" uuid,
	"enrollment_id" uuid,
	"kind" "certificate_kind" NOT NULL,
	"certificate_number" text NOT NULL,
	"verification_code" text NOT NULL,
	"recipient_name" text NOT NULL,
	"course_title" text NOT NULL,
	"course_code" text,
	"training_hours" numeric(5, 2) NOT NULL,
	"issuing_authority" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_on" date NOT NULL,
	"expires_on" date,
	"status" "certificate_status" DEFAULT 'ACTIVE' NOT NULL,
	"accreditation" jsonb,
	"revoked_at" timestamp with time zone,
	"revoked_by_id" uuid,
	"revocation_reason" text,
	"supersedes_id" uuid,
	CONSTRAINT "certificates_certificateNumber_unique" UNIQUE("certificate_number"),
	CONSTRAINT "certificates_verificationCode_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"renewal_months" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competencies_tenantId_code_unique" UNIQUE NULLS NOT DISTINCT("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "competency_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"facility_id" uuid NOT NULL,
	"competency_id" uuid NOT NULL,
	"evaluator_user_id" uuid NOT NULL,
	"assessed_on" date NOT NULL,
	"criteria_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" "competency_result" NOT NULL,
	"remediation_required" text,
	"evaluator_comments" text,
	"evidence_urls" text[] DEFAULT '{}' NOT NULL,
	"next_assessment_due" date,
	"status" "competency_assessment_status" DEFAULT 'DRAFT' NOT NULL,
	"signed_at" timestamp with time zone,
	"signature_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"course_version_id" uuid NOT NULL,
	"stage" "approval_stage" NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"reviewer_credentials" text,
	"comments" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"department" "course_department" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "course_categories_tenantId_slug_unique" UNIQUE NULLS NOT DISTINCT("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_reviews_tenantId_courseId_userId_unique" UNIQUE("tenant_id","course_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"course_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"description" text NOT NULL,
	"target_audience" text NOT NULL,
	"prerequisites" text[] DEFAULT '{}' NOT NULL,
	"regulatory_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completion_criteria" text,
	"author_user_id" uuid,
	"author_name" text,
	"reviewer_user_id" uuid,
	"reviewer_name" text,
	"clinical_review_required" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"revised_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_versions_courseId_versionNumber_unique" UNIQUE("course_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"category_id" uuid NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"current_version_id" uuid,
	"is_required_by_default" boolean DEFAULT false NOT NULL,
	"certificate_eligible" boolean DEFAULT true NOT NULL,
	"passing_score" integer DEFAULT 80 NOT NULL,
	"renewal_months" integer,
	"estimated_minutes" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_tenantId_code_unique" UNIQUE NULLS NOT DISTINCT("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"course_version_id" uuid NOT NULL,
	"assignment_id" uuid,
	"status" "enrollment_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"progress_pct" integer DEFAULT 0 NOT NULL,
	"last_lesson_id" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "examination_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"response" jsonb NOT NULL,
	"is_correct" boolean,
	"points_awarded" numeric(6, 2),
	"instructor_comment" text,
	CONSTRAINT "examination_answers_attemptId_questionId_unique" UNIQUE("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "examination_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"examination_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"question_ids" uuid[] NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"score_pct" integer,
	"passed" boolean,
	"grading_status" "grading_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"graded_by_id" uuid,
	"graded_at" timestamp with time zone,
	CONSTRAINT "examination_attempts_enrollmentId_examinationId_attemptNumber_unique" UNIQUE("enrollment_id","examination_id","attempt_number")
);
--> statement-breakpoint
CREATE TABLE "examinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"course_version_id" uuid NOT NULL,
	"question_bank_id" uuid NOT NULL,
	"title" text NOT NULL,
	"is_final" boolean DEFAULT true NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"passing_score" integer DEFAULT 80 NOT NULL,
	"question_count" integer DEFAULT 15 NOT NULL,
	"randomize" boolean DEFAULT true NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"time_limit_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"course_version_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"seconds_spent" integer DEFAULT 0 NOT NULL,
	"video_position_s" integer DEFAULT 0 NOT NULL,
	"bookmarked" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_enrollmentId_lessonId_unique" UNIQUE("enrollment_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"module_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"title" text NOT NULL,
	"type" "lesson_type" DEFAULT 'TEXT' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"media_url" text,
	"media_meta" jsonb,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"course_version_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text
);
--> statement-breakpoint
CREATE TABLE "question_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"course_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"bank_id" uuid NOT NULL,
	"type" "question_type" NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_answer" jsonb NOT NULL,
	"explanation" text NOT NULL,
	"image_url" text,
	"points" integer DEFAULT 1 NOT NULL,
	"difficulty" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"agency" text NOT NULL,
	"jurisdiction" "jurisdiction" NOT NULL,
	"citation" text NOT NULL,
	"title" text NOT NULL,
	"requirement_text" text NOT NULL,
	"facility_types" "facility_type"[] DEFAULT '{}' NOT NULL,
	"position_codes" text[] DEFAULT '{}' NOT NULL,
	"requires_clinical_exposure" boolean DEFAULT false NOT NULL,
	"requires_bloodborne_exposure" boolean DEFAULT false NOT NULL,
	"frequency_months" integer,
	"frequency_verified" boolean DEFAULT false NOT NULL,
	"initial_due_days_from_hire" integer,
	"effective_date" date,
	"last_verified_at" timestamp with time zone,
	"reviewer_name" text,
	"compliance_status" "rule_compliance_status" DEFAULT 'NEEDS_REVIEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency" text NOT NULL,
	"jurisdiction" "jurisdiction" NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"publication_date" date,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"requirement_id" uuid,
	"assigned_by_id" uuid,
	"reason" text,
	"due_date" date,
	"status" "assignment_status" DEFAULT 'ASSIGNED' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"course_id" uuid NOT NULL,
	"regulatory_rule_id" uuid,
	"source" "requirement_source" NOT NULL,
	"facility_types" "facility_type"[] DEFAULT '{}' NOT NULL,
	"position_codes" text[] DEFAULT '{}' NOT NULL,
	"requires_clinical_exposure" boolean DEFAULT false NOT NULL,
	"requires_bloodborne_exposure" boolean DEFAULT false NOT NULL,
	"frequency_months" integer,
	"due_within_days_of_hire" integer,
	"needs_admin_review" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"course_id" uuid,
	"instructor_id" uuid,
	"facility_id" uuid,
	"title" text NOT NULL,
	"delivery" "session_delivery" NOT NULL,
	"location" text,
	"meeting_url" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"capacity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"prev_hash" text,
	"hash" text
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"number" text NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"amount_due_cents" integer NOT NULL,
	"amount_paid_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"stripe_invoice_id" text,
	"hosted_url" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_number_unique" UNIQUE("number"),
	CONSTRAINT "invoices_stripeInvoiceId_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"expiry_lead_days" integer[] DEFAULT '{90,60,30,15,7}' NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"escalate_after_days" integer DEFAULT 7 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_tenantId_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"channel" "notification_channel" DEFAULT 'IN_APP' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"dedupe_key" text,
	"read_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_tenantId_dedupeKey_unique" UNIQUE("tenant_id","dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" "payment_status" NOT NULL,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_stripePaymentIntentId_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan" "plan_code" NOT NULL,
	"billing_cycle" "billing_cycle" DEFAULT 'MONTHLY' NOT NULL,
	"pricing_model" "pricing_model" DEFAULT 'PER_EMPLOYEE' NOT NULL,
	"status" "subscription_status" DEFAULT 'TRIALING' NOT NULL,
	"seats" integer DEFAULT 10 NOT NULL,
	"facility_limit" integer,
	"unit_price_cents" integer,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"trial_ends_at" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripeSubscriptionId_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_facilities" ADD CONSTRAINT "employee_facilities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_facilities" ADD CONSTRAINT "employee_facilities_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_facilities" ADD CONSTRAINT "employee_facilities_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_primary_facility_id_facilities_id_fk" FOREIGN KEY ("primary_facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_id_employees_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_tenant_id_tenants_id_fk" FOREIGN KEY ("active_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD CONSTRAINT "competency_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD CONSTRAINT "competency_assessments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD CONSTRAINT "competency_assessments_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD CONSTRAINT "competency_assessments_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_approvals" ADD CONSTRAINT "course_approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_approvals" ADD CONSTRAINT "course_approvals_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_course_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_current_version_id_course_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."course_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_assignment_id_training_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."training_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_answers" ADD CONSTRAINT "examination_answers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_answers" ADD CONSTRAINT "examination_answers_attempt_id_examination_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."examination_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_answers" ADD CONSTRAINT "examination_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_attempts" ADD CONSTRAINT "examination_attempts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_attempts" ADD CONSTRAINT "examination_attempts_examination_id_examinations_id_fk" FOREIGN KEY ("examination_id") REFERENCES "public"."examinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_attempts" ADD CONSTRAINT "examination_attempts_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examinations" ADD CONSTRAINT "examinations_question_bank_id_question_banks_id_fk" FOREIGN KEY ("question_bank_id") REFERENCES "public"."question_banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_bank_id_question_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."question_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_source_id_regulatory_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."regulatory_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_requirement_id_training_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."training_requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD CONSTRAINT "training_requirements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD CONSTRAINT "training_requirements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD CONSTRAINT "training_requirements_regulatory_rule_id_regulatory_rules_id_fk" FOREIGN KEY ("regulatory_rule_id") REFERENCES "public"."regulatory_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "departments_tenant_id_index" ON "departments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "employee_facilities_tenant_id_index" ON "employee_facilities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "employees_tenant_id_index" ON "employees" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "employees_tenant_id_primary_facility_id_index" ON "employees" USING btree ("tenant_id","primary_facility_id");--> statement-breakpoint
CREATE INDEX "employees_tenant_id_position_code_index" ON "employees" USING btree ("tenant_id","position_code");--> statement-breakpoint
CREATE INDEX "facilities_tenant_id_index" ON "facilities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "facilities_tenant_id_facility_type_index" ON "facilities" USING btree ("tenant_id","facility_type");--> statement-breakpoint
CREATE INDEX "instructors_tenant_id_index" ON "instructors" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "licenses_tenant_id_index" ON "licenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "licenses_tenant_id_expires_on_index" ON "licenses" USING btree ("tenant_id","expires_on");--> statement-breakpoint
CREATE INDEX "membership_roles_tenant_id_index" ON "membership_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "memberships_user_id_index" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizations_tenant_id_index" ON "organizations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_index" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_permissions_tenant_id_index" ON "role_permissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "roles_tenant_id_index" ON "roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenants_status_index" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_tenant_id_index" ON "attendance" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "certificate_verifications_tenant_id_index" ON "certificate_verifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "certificates_tenant_id_index" ON "certificates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "certificates_tenant_id_expires_on_index" ON "certificates" USING btree ("tenant_id","expires_on");--> statement-breakpoint
CREATE INDEX "certificates_user_id_index" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "competencies_tenant_id_index" ON "competencies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "competency_assessments_tenant_id_index" ON "competency_assessments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "competency_assessments_tenant_id_next_assessment_due_index" ON "competency_assessments" USING btree ("tenant_id","next_assessment_due");--> statement-breakpoint
CREATE INDEX "course_approvals_tenant_id_index" ON "course_approvals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "course_approvals_course_version_id_index" ON "course_approvals" USING btree ("course_version_id");--> statement-breakpoint
CREATE INDEX "course_categories_tenant_id_index" ON "course_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "course_reviews_tenant_id_index" ON "course_reviews" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "course_versions_tenant_id_index" ON "course_versions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "courses_tenant_id_index" ON "courses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "courses_category_id_index" ON "courses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "enrollments_tenant_id_index" ON "enrollments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "enrollments_tenant_id_user_id_index" ON "enrollments" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "examination_answers_tenant_id_index" ON "examination_answers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "examination_attempts_tenant_id_index" ON "examination_attempts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "examinations_tenant_id_index" ON "examinations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "learning_objectives_tenant_id_index" ON "learning_objectives" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "learning_objectives_course_version_id_index" ON "learning_objectives" USING btree ("course_version_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_tenant_id_index" ON "lesson_progress" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "lessons_tenant_id_index" ON "lessons" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "lessons_module_id_index" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "modules_tenant_id_index" ON "modules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "modules_course_version_id_index" ON "modules" USING btree ("course_version_id");--> statement-breakpoint
CREATE INDEX "question_banks_tenant_id_index" ON "question_banks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "questions_tenant_id_index" ON "questions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "questions_bank_id_index" ON "questions" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "training_assignments_tenant_id_index" ON "training_assignments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "training_assignments_tenant_id_status_due_date_index" ON "training_assignments" USING btree ("tenant_id","status","due_date");--> statement-breakpoint
CREATE INDEX "training_assignments_employee_id_index" ON "training_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "training_requirements_tenant_id_index" ON "training_requirements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "training_requirements_course_id_index" ON "training_requirements" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "training_sessions_tenant_id_starts_at_index" ON "training_sessions" USING btree ("tenant_id","starts_at");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_created_at_index" ON "audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_entity_id_index" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "invoices_tenant_id_index" ON "invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "notifications_tenant_id_user_id_read_at_index" ON "notifications" USING btree ("tenant_id","user_id","read_at");--> statement-breakpoint
CREATE INDEX "payments_tenant_id_index" ON "payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "subscriptions_tenant_id_index" ON "subscriptions" USING btree ("tenant_id");