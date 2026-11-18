CREATE TYPE "public"."program_classification" AS ENUM('GENERAL_EDUCATION', 'EMPLOYER_REQUIRED', 'STATE_REGULATED_TRAINING', 'STATE_APPROVED_PROGRAM', 'CONTINUING_EDUCATION', 'PROFESSION_SPECIFIC');--> statement-breakpoint
ALTER TYPE "public"."certificate_kind" ADD VALUE 'PROFESSIONAL_DEVELOPMENT';--> statement-breakpoint
ALTER TYPE "public"."certificate_kind" ADD VALUE 'INSTRUCTOR';--> statement-breakpoint
ALTER TYPE "public"."certificate_kind" ADD VALUE 'SPECIALIZED_TRAINING';--> statement-breakpoint
ALTER TYPE "public"."course_department" ADD VALUE 'HOME_HEALTH';--> statement-breakpoint
ALTER TYPE "public"."course_department" ADD VALUE 'MENTAL_HEALTH';--> statement-breakpoint
CREATE TABLE "program_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"approving_body" text NOT NULL,
	"approval_number" text NOT NULL,
	"scope" text,
	"effective_on" date NOT NULL,
	"expires_on" date,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"source_url" text,
	"verified_on" date NOT NULL,
	"verified_by_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_approvals_kind" CHECK ("program_approvals"."kind" in ('STATE_PROGRAM_APPROVAL','CE_PROVIDER_APPROVAL','CURRICULUM_APPROVAL','ACCREDITATION','PARTNER_AUTHORIZATION')),
	CONSTRAINT "program_approvals_status" CHECK ("program_approvals"."status" in ('ACTIVE','EXPIRED','WITHDRAWN'))
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "certificate_name_display" text DEFAULT 'FULL' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "certificate_signatory_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "certificate_signatory_title" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "program_classification" "program_classification";--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "program_notice" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "instructor_name" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "signatory_name" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "signatory_title" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "renewal_requirements" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "correction_reason" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "issued_by_id" uuid;--> statement-breakpoint
ALTER TABLE "course_versions" ADD COLUMN "credential_notice" text;--> statement-breakpoint
ALTER TABLE "course_versions" ADD COLUMN "renewal_requirements" text;--> statement-breakpoint
ALTER TABLE "course_versions" ADD COLUMN "instructor_resources" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "program_classification" "program_classification" DEFAULT 'GENERAL_EDUCATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "certificate_type" "certificate_kind" DEFAULT 'COURSE_COMPLETION' NOT NULL;--> statement-breakpoint
ALTER TABLE "program_approvals" ADD CONSTRAINT "program_approvals_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "program_approvals_course_id_index" ON "program_approvals" USING btree ("course_id");--> statement-breakpoint
-- A course may claim to be a state-approved program or continuing education only while
-- a real, active, unexpired approval is on record. Never invent regulatory approval.
CREATE OR REPLACE FUNCTION courses_classification_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.program_classification::text IN ('STATE_APPROVED_PROGRAM', 'CONTINUING_EDUCATION')
     AND NOT EXISTS (
       SELECT 1 FROM program_approvals a
        WHERE a.course_id = NEW.id AND a.status = 'ACTIVE'
          AND a.effective_on <= current_date
          AND (a.expires_on IS NULL OR a.expires_on >= current_date)) THEN
    RAISE EXCEPTION 'course % cannot be classified as % without an active approval in program_approvals', NEW.code, NEW.program_classification;
  END IF;
  IF NEW.certificate_type::text = 'CONTINUING_EDUCATION' AND NEW.program_classification::text <> 'CONTINUING_EDUCATION' THEN
    RAISE EXCEPTION 'continuing education certificates require a course classified as CONTINUING_EDUCATION';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER courses_classification_guard BEFORE INSERT OR UPDATE OF program_classification, certificate_type ON courses
  FOR EACH ROW EXECUTE FUNCTION courses_classification_guard();
--> statement-breakpoint
-- Instructor certificates and competency certificates are not tied to a course enrollment.
CREATE OR REPLACE FUNCTION certificates_require_completion() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  st enrollment_status;
BEGIN
  IF NEW.kind::text NOT IN ('COMPETENCY_VERIFICATION', 'INSTRUCTOR') THEN
    IF NEW.enrollment_id IS NULL THEN
      RAISE EXCEPTION 'course certificates must reference an enrollment';
    END IF;
    SELECT status INTO st FROM enrollments WHERE id = NEW.enrollment_id;
    IF st IS DISTINCT FROM 'COMPLETED' THEN
      RAISE EXCEPTION 'certificate cannot be issued: enrollment is not COMPLETED';
    END IF;
  END IF;
  IF NEW.kind::text = 'CONTINUING_EDUCATION' AND NEW.accreditation IS NULL THEN
    RAISE EXCEPTION 'continuing education certificates require a recorded accreditation approval';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION certificates_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.certificate_number <> OLD.certificate_number
     OR NEW.verification_code <> OLD.verification_code
     OR NEW.recipient_name <> OLD.recipient_name
     OR NEW.course_title <> OLD.course_title
     OR NEW.completed_on <> OLD.completed_on
     OR NEW.issued_at <> OLD.issued_at
     OR NEW.user_id <> OLD.user_id
     OR NEW.kind <> OLD.kind
     OR NEW.training_hours <> OLD.training_hours
     OR NEW.course_code IS DISTINCT FROM OLD.course_code
     OR NEW.program_classification IS DISTINCT FROM OLD.program_classification
     OR NEW.program_notice IS DISTINCT FROM OLD.program_notice
     OR NEW.instructor_name IS DISTINCT FROM OLD.instructor_name
     OR NEW.signatory_name IS DISTINCT FROM OLD.signatory_name
     OR NEW.signatory_title IS DISTINCT FROM OLD.signatory_title
     OR NEW.renewal_requirements IS DISTINCT FROM OLD.renewal_requirements
     OR NEW.correction_reason IS DISTINCT FROM OLD.correction_reason THEN
    RAISE EXCEPTION 'certificate identity fields are immutable; issue a corrected certificate instead';
  END IF;
  IF OLD.expires_on IS NOT NULL AND (NEW.expires_on IS NULL OR NEW.expires_on > OLD.expires_on) THEN
    RAISE EXCEPTION 'certificate expiration cannot be extended; issue a renewal certificate';
  END IF;
  IF OLD.status = 'REVOKED' AND NEW.status <> 'REVOKED' THEN
    RAISE EXCEPTION 'revoked certificates cannot be reinstated';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER program_approvals_no_delete BEFORE DELETE ON program_approvals
  FOR EACH ROW EXECUTE FUNCTION block_delete();
--> statement-breakpoint
GRANT SELECT ON program_approvals TO chta_app;
--> statement-breakpoint
SELECT chta_apply_security();
