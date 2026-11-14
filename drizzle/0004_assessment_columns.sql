ALTER TABLE "competency_assessments" ADD COLUMN "signer_name" text;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD COLUMN "signer_credentials" text;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD COLUMN "voided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD COLUMN "voided_by_id" uuid;--> statement-breakpoint
ALTER TABLE "competency_assessments" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "extra_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "examination_answers" ADD COLUMN "graded_by_id" uuid;--> statement-breakpoint
ALTER TABLE "examination_answers" ADD COLUMN "saved_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "examination_attempts" ADD COLUMN "expires_at" timestamp with time zone;