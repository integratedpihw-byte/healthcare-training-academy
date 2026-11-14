CREATE TYPE "public"."regulatory_category" AS ENUM('AHCA', 'FL_DOH', 'FL_BON', 'FL_BOP', 'FL_DCF', 'CMS', 'HRSA', 'OSHA', 'HHS_OCR', 'CDC', 'HIPAA', 'MEDICARE_MEDICAID', 'PROGRAM_340B');--> statement-breakpoint
CREATE TYPE "public"."rule_decision" AS ENUM('APPLICABLE', 'NOT_APPLICABLE', 'UNDER_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."rule_kind" AS ENUM('TRAINING_MANDATE', 'CONTINUING_EDUCATION', 'COMPETENCY_ASSESSMENT', 'PROGRAM_REQUIREMENT', 'GUIDANCE', 'NO_TRAINING_MANDATE_IDENTIFIED');--> statement-breakpoint
CREATE TABLE "compliance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"facility_id" uuid,
	"snapshot_date" date NOT NULL,
	"applicable" integer NOT NULL,
	"satisfied" integer NOT NULL,
	"overdue" integer NOT NULL,
	"gaps" integer NOT NULL,
	"needs_review" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_snapshots_tenantId_facilityId_snapshotDate_unique" UNIQUE NULLS NOT DISTINCT("tenant_id","facility_id","snapshot_date")
);
--> statement-breakpoint
CREATE TABLE "regulatory_rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_summary" text NOT NULL,
	"changed_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_rule_versions_ruleId_version_unique" UNIQUE("rule_id","version")
);
--> statement-breakpoint
CREATE TABLE "tenant_rule_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"facility_id" uuid,
	"decision" "rule_decision" NOT NULL,
	"rationale" text NOT NULL,
	"rule_version" integer NOT NULL,
	"decided_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_rule_decisions_rationale_ck" CHECK (length(trim(rationale)) >= 10)
);
--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "category" "regulatory_category" NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "kind" "rule_kind" DEFAULT 'TRAINING_MANDATE' NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "audience_text" text;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "facility_license_types" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "job_duties" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "frequency_text" text;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "initial_timing_text" text;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "pending_change_note" text;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "reviewer_user_id" uuid;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "suggested_course_codes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_sources" ADD COLUMN "category" "regulatory_category" NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_sources" ADD COLUMN "source_kind" text DEFAULT 'REGULATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_sources" ADD COLUMN "is_official" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "regulatory_sources" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "compliance_snapshots" ADD CONSTRAINT "compliance_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_rule_versions" ADD CONSTRAINT "regulatory_rule_versions_rule_id_regulatory_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."regulatory_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rule_decisions" ADD CONSTRAINT "tenant_rule_decisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rule_decisions" ADD CONSTRAINT "tenant_rule_decisions_rule_id_regulatory_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."regulatory_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "compliance_snapshots_tenant_id_snapshot_date_index" ON "compliance_snapshots" USING btree ("tenant_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "tenant_rule_decisions_tenant_id_rule_id_created_at_index" ON "tenant_rule_decisions" USING btree ("tenant_id","rule_id","created_at");--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_citation_title_unique" UNIQUE("citation","title");--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_frequency_ck" CHECK (frequency_months is null or frequency_verified);--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_verified_ck" CHECK (compliance_status <> 'VERIFIED' or last_verified_at is not null);--> statement-breakpoint
ALTER TABLE "training_requirements" ADD CONSTRAINT "training_requirements_regulation_ck" CHECK (source not in ('FEDERAL_REGULATION', 'STATE_REGULATION') or regulatory_rule_id is not null);