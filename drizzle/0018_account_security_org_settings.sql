ALTER TABLE "organizations" ADD COLUMN "time_zone" text DEFAULT 'America/New_York' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "mfa_policy" text DEFAULT 'ADMINS' NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "purpose" text DEFAULT 'reset' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_recovery_hashes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_last_step" bigint;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_mfa_policy_check" CHECK (mfa_policy IN ('ADMINS','ALL','OFF'));--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_purpose_check" CHECK (purpose IN ('reset','invite','verify'));--> statement-breakpoint
-- Demonstration organizations keep password-only sign-in so shared demo accounts stay usable.
UPDATE organizations SET mfa_policy = 'OFF' WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'demo-%');--> statement-breakpoint
SELECT chta_apply_security();
