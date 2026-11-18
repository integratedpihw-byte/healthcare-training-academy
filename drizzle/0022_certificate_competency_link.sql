ALTER TABLE "certificates" ADD COLUMN "competency_assessment_id" uuid;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS certificates_competency_assessment_idx ON certificates (competency_assessment_id);
--> statement-breakpoint
SELECT chta_apply_security();
