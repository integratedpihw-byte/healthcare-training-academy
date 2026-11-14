CREATE TYPE "public"."assignment_source" AS ENUM('MANUAL', 'ONBOARDING', 'RENEWAL', 'BULK');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"audience" jsonb NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"notification_id" uuid,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"status" "email_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_id" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"run_by_id" uuid,
	"results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assigned_count" integer DEFAULT 0 NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"email_assignments" boolean DEFAULT true NOT NULL,
	"email_results" boolean DEFAULT true NOT NULL,
	"email_announcements" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_notification_settings_tenantId_userId_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "training_requirements" ALTER COLUMN "course_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "verification_source" text;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD COLUMN "source" "assignment_source" DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD COLUMN "renews_certificate_id" uuid;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD COLUMN "status_reason" text;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD COLUMN "closed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD COLUMN "competency_id" uuid;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD COLUMN "reminder_lead_days" integer[];--> statement-breakpoint
ALTER TABLE "training_requirements" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "renewal_window_days" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "default_due_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "category" text DEFAULT 'critical' NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_runs" ADD CONSTRAINT "onboarding_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_runs" ADD CONSTRAINT "onboarding_runs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_tenant_id_created_at_index" ON "announcements" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "email_outbox_status_next_attempt_at_index" ON "email_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "email_outbox_tenant_id_index" ON "email_outbox" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "onboarding_runs_tenant_id_employee_id_index" ON "onboarding_runs" USING btree ("tenant_id","employee_id");--> statement-breakpoint
ALTER TABLE "training_requirements" ADD CONSTRAINT "training_requirements_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "training_assignments_open_uq" ON "training_assignments" USING btree ("employee_id","course_id") WHERE status in ('ASSIGNED', 'IN_PROGRESS', 'OVERDUE');--> statement-breakpoint
ALTER TABLE "training_requirements" ADD CONSTRAINT "training_requirements_target_ck" CHECK (num_nonnulls(course_id, competency_id) = 1);