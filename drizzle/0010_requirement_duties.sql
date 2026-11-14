ALTER TABLE "facilities" ADD COLUMN "designations" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD COLUMN "facility_license_types" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "training_requirements" ADD COLUMN "job_duties" text[] DEFAULT '{}' NOT NULL;