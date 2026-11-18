ALTER TYPE "public"."course_department" ADD VALUE 'EMERGENCY_MANAGEMENT';--> statement-breakpoint
ALTER TYPE "public"."course_department" ADD VALUE 'PUBLIC_HEALTH';--> statement-breakpoint
ALTER TYPE "public"."course_department" ADD VALUE 'CASE_MANAGEMENT';--> statement-breakpoint
SELECT chta_apply_security();
