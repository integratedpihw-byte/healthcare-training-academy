-- =============================================================================
-- Phase 2 — Learning management rules enforced in the database.
--   * Learner privacy: learners see and write only their own enrollments/progress.
--   * Completion guard: an enrollment can become COMPLETED only when every required
--     lesson is complete and every mandatory examination has a passing attempt.
--   * Content integrity: published/archived versions are frozen; publishing requires
--     the recorded approval chain (Review → [Clinical] → Compliance).
-- Policies wrap app_has_permission() in a sub-select so Postgres evaluates it once
-- per statement (initplan) instead of once per row.
-- =============================================================================

-- One open enrollment per learner per course (renewals start a new one after completion).
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_one_open_per_course
  ON enrollments (tenant_id, user_id, course_id)
  WHERE status IN ('NOT_STARTED', 'IN_PROGRESS', 'AWAITING_ASSESSMENT');
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Learner privacy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS own_read ON enrollments;
--> statement-breakpoint
CREATE POLICY own_read ON enrollments AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user()
  OR (SELECT app_has_permission('training.view_all'))
  OR (SELECT app_has_permission('assessments.grade'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_insert ON enrollments;
--> statement-breakpoint
CREATE POLICY own_insert ON enrollments AS RESTRICTIVE FOR INSERT WITH CHECK (
  user_id = app_current_user() OR (SELECT app_has_permission('training.assign'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_update ON enrollments;
--> statement-breakpoint
CREATE POLICY own_update ON enrollments AS RESTRICTIVE FOR UPDATE USING (
  user_id = app_current_user() OR (SELECT app_has_permission('training.assign'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_delete ON enrollments;
--> statement-breakpoint
CREATE POLICY own_delete ON enrollments AS RESTRICTIVE FOR DELETE USING ((SELECT app_has_permission('training.assign')));
--> statement-breakpoint

DROP POLICY IF EXISTS own_read ON lesson_progress;
--> statement-breakpoint
CREATE POLICY own_read ON lesson_progress AS RESTRICTIVE FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments e WHERE e.id = enrollment_id AND e.user_id = app_current_user())
  OR (SELECT app_has_permission('training.view_all'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_write ON lesson_progress;
--> statement-breakpoint
CREATE POLICY own_write ON lesson_progress AS RESTRICTIVE FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM enrollments e WHERE e.id = enrollment_id AND e.user_id = app_current_user())
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_update ON lesson_progress;
--> statement-breakpoint
CREATE POLICY own_update ON lesson_progress AS RESTRICTIVE FOR UPDATE USING (
  EXISTS (SELECT 1 FROM enrollments e WHERE e.id = enrollment_id AND e.user_id = app_current_user())
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_delete ON lesson_progress;
--> statement-breakpoint
CREATE POLICY own_delete ON lesson_progress AS RESTRICTIVE FOR DELETE USING (false);
--> statement-breakpoint

DROP POLICY IF EXISTS own_write ON course_reviews;
--> statement-breakpoint
CREATE POLICY own_write ON course_reviews AS RESTRICTIVE FOR INSERT WITH CHECK (user_id = app_current_user());
--> statement-breakpoint
DROP POLICY IF EXISTS own_update ON course_reviews;
--> statement-breakpoint
CREATE POLICY own_update ON course_reviews AS RESTRICTIVE FOR UPDATE USING (user_id = app_current_user());
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Tenant course authoring requires courses.author
-- ---------------------------------------------------------------------------
SELECT chta_require_permission_for_writes(t, 'courses.author')
FROM unnest(ARRAY['courses','course_versions','modules','lessons','learning_objectives','question_banks','questions','examinations']) AS t;
--> statement-breakpoint
-- Approval records: any reviewer permission may write; the app checks the specific stage.
DROP POLICY IF EXISTS perm_insert ON course_approvals;
--> statement-breakpoint
CREATE POLICY perm_insert ON course_approvals AS RESTRICTIVE FOR INSERT WITH CHECK (
  (SELECT app_has_permission('courses.review')) OR (SELECT app_has_permission('courses.approve.clinical'))
  OR (SELECT app_has_permission('courses.approve.compliance')) OR (SELECT app_has_permission('courses.publish'))
);
--> statement-breakpoint
REVOKE UPDATE, DELETE ON course_approvals FROM chta_app;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Completion guard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enrollments_completion_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  missing int;
  unpassed int;
BEGIN
  IF NEW.status = 'COMPLETED' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'COMPLETED') THEN
    SELECT count(*) INTO missing
      FROM lessons l JOIN modules m ON m.id = l.module_id
     WHERE m.course_version_id = NEW.course_version_id AND l.is_required
       AND NOT EXISTS (SELECT 1 FROM lesson_progress p
                        WHERE p.enrollment_id = NEW.id AND p.lesson_id = l.id AND p.status = 'COMPLETED');
    IF missing > 0 THEN
      RAISE EXCEPTION 'enrollment cannot be completed: % required lesson(s) not completed', missing
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT count(*) INTO unpassed
      FROM examinations x
     WHERE x.course_version_id = NEW.course_version_id AND x.is_mandatory
       AND NOT EXISTS (SELECT 1 FROM examination_attempts a
                        WHERE a.enrollment_id = NEW.id AND a.examination_id = x.id AND a.passed IS TRUE);
    IF unpassed > 0 THEN
      RAISE EXCEPTION 'enrollment cannot be completed: % mandatory examination(s) not passed', unpassed
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.completed_at := coalesce(NEW.completed_at, now());
    NEW.progress_pct := 100;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'COMPLETED' AND NEW.status <> 'COMPLETED' THEN
    RAISE EXCEPTION 'completed enrollments cannot be reopened; start a new enrollment';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS enrollments_completion_guard ON enrollments;
--> statement-breakpoint
CREATE TRIGGER enrollments_completion_guard BEFORE INSERT OR UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION enrollments_completion_guard();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Content integrity: frozen published versions and approval-gated publishing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION course_versions_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  needed text[];
  v_stage text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('PUBLISHED', 'ARCHIVED') THEN
      RAISE EXCEPTION 'published or archived course versions cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('PUBLISHED', 'ARCHIVED') THEN
    IF (to_jsonb(NEW) - 'status' - 'revised_at') <> (to_jsonb(OLD) - 'status' - 'revised_at')
       OR NOT (NEW.status = OLD.status OR (OLD.status = 'PUBLISHED' AND NEW.status = 'ARCHIVED')) THEN
      RAISE EXCEPTION 'published course versions are frozen; create a new version';
    END IF;
  END IF;
  IF NEW.status = 'PUBLISHED' AND (TG_OP = 'INSERT' OR OLD.status <> 'PUBLISHED') THEN
    needed := ARRAY['REVIEW', 'COMPLIANCE_APPROVAL'];
    IF NEW.clinical_review_required THEN needed := array_append(needed, 'CLINICAL_APPROVAL'); END IF;
    FOREACH v_stage IN ARRAY needed LOOP
      IF NOT EXISTS (SELECT 1 FROM course_approvals a
                      WHERE a.course_version_id = NEW.id AND a.stage::text = v_stage AND a.decision = 'APPROVED'
                        -- only approvals given since the latest submission count
                        AND a.decided_at >= coalesce(NEW.revised_at, '-infinity'::timestamptz)) THEN
        RAISE EXCEPTION 'cannot publish: missing % approval', v_stage USING ERRCODE = 'check_violation';
      END IF;
    END LOOP;
    NEW.published_at := coalesce(NEW.published_at, now());
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS course_versions_guard ON course_versions;
--> statement-breakpoint
CREATE TRIGGER course_versions_guard BEFORE INSERT OR UPDATE OR DELETE ON course_versions
  FOR EACH ROW EXECUTE FUNCTION course_versions_guard();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION course_content_frozen_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  vid uuid;
  st content_status;
  r record;
BEGIN
  r := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  IF TG_TABLE_NAME = 'lessons' THEN
    SELECT m.course_version_id INTO vid FROM modules m WHERE m.id = r.module_id;
  ELSE
    vid := r.course_version_id;
  END IF;
  SELECT status INTO st FROM course_versions WHERE id = vid;
  IF st IN ('PUBLISHED', 'ARCHIVED') THEN
    RAISE EXCEPTION 'content of a published course version is frozen; create a new version';
  END IF;
  RETURN r;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS modules_frozen ON modules;
--> statement-breakpoint
CREATE TRIGGER modules_frozen BEFORE INSERT OR UPDATE OR DELETE ON modules FOR EACH ROW EXECUTE FUNCTION course_content_frozen_guard();
--> statement-breakpoint
DROP TRIGGER IF EXISTS lessons_frozen ON lessons;
--> statement-breakpoint
CREATE TRIGGER lessons_frozen BEFORE INSERT OR UPDATE OR DELETE ON lessons FOR EACH ROW EXECUTE FUNCTION course_content_frozen_guard();
--> statement-breakpoint
DROP TRIGGER IF EXISTS examinations_frozen ON examinations;
--> statement-breakpoint
CREATE TRIGGER examinations_frozen BEFORE INSERT OR UPDATE OR DELETE ON examinations FOR EACH ROW EXECUTE FUNCTION course_content_frozen_guard();
--> statement-breakpoint
DROP TRIGGER IF EXISTS objectives_frozen ON learning_objectives;
--> statement-breakpoint
CREATE TRIGGER objectives_frozen BEFORE INSERT OR UPDATE OR DELETE ON learning_objectives FOR EACH ROW EXECUTE FUNCTION course_content_frozen_guard();
--> statement-breakpoint

-- chta_apply_security() v2: preserves narrowed grants (certificates, course_approvals)
-- so re-running it in later migrations never widens them.
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
  -- Tables where the app role gets a narrower grant than full CRUD.
  narrowed jsonb := '{"certificates": "SELECT, UPDATE", "course_approvals": "SELECT, INSERT"}';
  special_tables text[] := ARRAY['audit_logs'];
BEGIN
  GRANT USAGE ON SCHEMA public TO chta_app, chta_system;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO chta_system;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO chta_system;
  GRANT EXECUTE ON FUNCTION app_current_tenant() TO chta_app, chta_system;

  FOR r IN
    SELECT c.table_name, c.is_nullable = 'YES' AS nullable
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id'
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.table_name);

    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_read ON %I', r.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_insert ON %I', r.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_update ON %I', r.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_delete ON %I', r.table_name);

    IF r.table_name = ANY (special_tables) THEN
      CONTINUE; -- handled explicitly below
    END IF;

    IF r.nullable THEN
      EXECUTE format($p$CREATE POLICY tenant_read ON %I FOR SELECT
        USING (tenant_id IS NULL OR tenant_id = app_current_tenant())$p$, r.table_name);
      EXECUTE format($p$CREATE POLICY tenant_insert ON %I FOR INSERT
        WITH CHECK (tenant_id = app_current_tenant())$p$, r.table_name);
      EXECUTE format($p$CREATE POLICY tenant_update ON %I FOR UPDATE
        USING (tenant_id = app_current_tenant()) WITH CHECK (tenant_id = app_current_tenant())$p$, r.table_name);
      EXECUTE format($p$CREATE POLICY tenant_delete ON %I FOR DELETE
        USING (tenant_id = app_current_tenant())$p$, r.table_name);
    ELSE
      EXECUTE format($p$CREATE POLICY tenant_isolation ON %I FOR ALL
        USING (tenant_id = app_current_tenant()) WITH CHECK (tenant_id = app_current_tenant())$p$, r.table_name);
    END IF;

    IF narrowed ? r.table_name THEN
      EXECUTE format('REVOKE ALL ON %I FROM chta_app', r.table_name);
      EXECUTE format('GRANT %s ON %I TO chta_app', narrowed ->> r.table_name, r.table_name);
    ELSIF r.table_name = ANY (billing_tables) THEN
      -- Billing is written only by platform services (Stripe webhooks).
      EXECUTE format('REVOKE ALL ON %I FROM chta_app', r.table_name);
      EXECUTE format('GRANT SELECT ON %I TO chta_app', r.table_name);
    ELSE
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO chta_app', r.table_name);
    END IF;
  END LOOP;

  -- tenants: a tenant sees and may edit only itself; creation is platform-only.
  ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tenant_self ON tenants;
  CREATE POLICY tenant_self ON tenants FOR ALL
    USING (id = app_current_tenant()) WITH CHECK (id = app_current_tenant());
  REVOKE ALL ON tenants FROM chta_app;
  GRANT SELECT ON tenants TO chta_app;
  GRANT UPDATE (name, primary_state, updated_at) ON tenants TO chta_app;

  -- audit_logs: tenants may read and append their own entries only.
  DROP POLICY IF EXISTS audit_read ON audit_logs;
  DROP POLICY IF EXISTS audit_append ON audit_logs;
  CREATE POLICY audit_read ON audit_logs FOR SELECT USING (tenant_id = app_current_tenant());
  CREATE POLICY audit_append ON audit_logs FOR INSERT WITH CHECK (tenant_id = app_current_tenant());
  REVOKE ALL ON audit_logs FROM chta_app;
  GRANT SELECT, INSERT ON audit_logs TO chta_app;
  GRANT USAGE ON SEQUENCE audit_logs_id_seq TO chta_app;

  -- Platform reference data: read-only for the app role.
  GRANT SELECT ON permissions, regulatory_sources, regulatory_rules TO chta_app;

  -- Global identity: the app may read display columns only (never hashes/MFA secrets).
  REVOKE ALL ON users FROM chta_app;
  GRANT SELECT (id, email, first_name, last_name, status) ON users TO chta_app;

  -- Credentials and auth plumbing are platform-only.
  REVOKE ALL ON sessions, password_reset_tokens, rate_limits FROM chta_app;
END
$fn$;
--> statement-breakpoint

SELECT chta_apply_security();
