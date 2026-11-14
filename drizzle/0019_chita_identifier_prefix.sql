-- Rebrand: the academy's identifier prefix changes from CHTA to CHITA on course codes and
-- certificate numbers. One-time, pre-launch correction of existing rows, run by the owner
-- role. Records that are normally immutable (published course versions, issued
-- certificates) are updated with their guards switched off for this statement only;
-- verification codes are unchanged, so printed QR codes and verification links keep working.
-- The audit trail and regulatory version history are deliberately left untouched.
UPDATE courses SET code = 'CHITA-' || substr(code, 6) WHERE tenant_id IS NULL AND code LIKE 'CHTA-%';
--> statement-breakpoint
ALTER TABLE course_versions DISABLE TRIGGER course_versions_guard;
--> statement-breakpoint
UPDATE course_versions
   SET prerequisites = ARRAY(SELECT regexp_replace(p, '^CHTA-', 'CHITA-') FROM unnest(prerequisites) WITH ORDINALITY AS u(p, i) ORDER BY i)
 WHERE EXISTS (SELECT 1 FROM unnest(prerequisites) p WHERE p LIKE 'CHTA-%');
--> statement-breakpoint
UPDATE course_versions SET source_references = replace(source_references::text, '"publisher": "CHTA"', '"publisher": "CHITA"')::jsonb
 WHERE source_references::text LIKE '%"publisher": "CHTA"%';
--> statement-breakpoint
ALTER TABLE course_versions ENABLE TRIGGER course_versions_guard;
--> statement-breakpoint
ALTER TABLE certificates DISABLE TRIGGER certificates_guard;
--> statement-breakpoint
UPDATE certificates
   SET certificate_number = regexp_replace(certificate_number, '^CHTA-', 'CHITA-'),
       course_code = regexp_replace(course_code, '^CHTA-', 'CHITA-')
 WHERE certificate_number LIKE 'CHTA-%' OR course_code LIKE 'CHTA-%';
--> statement-breakpoint
ALTER TABLE certificates ENABLE TRIGGER certificates_guard;
--> statement-breakpoint
ALTER TABLE regulatory_rules DISABLE TRIGGER regulatory_rules_history;
--> statement-breakpoint
ALTER TABLE regulatory_rules DISABLE TRIGGER regulatory_rules_versioning;
--> statement-breakpoint
UPDATE regulatory_rules
   SET suggested_course_codes = ARRAY(SELECT regexp_replace(p, '^CHTA-', 'CHITA-') FROM unnest(suggested_course_codes) WITH ORDINALITY AS u(p, i) ORDER BY i)
 WHERE EXISTS (SELECT 1 FROM unnest(suggested_course_codes) p WHERE p LIKE 'CHTA-%');
--> statement-breakpoint
ALTER TABLE regulatory_rules ENABLE TRIGGER regulatory_rules_versioning;
--> statement-breakpoint
ALTER TABLE regulatory_rules ENABLE TRIGGER regulatory_rules_history;
--> statement-breakpoint
SELECT chta_apply_security();
