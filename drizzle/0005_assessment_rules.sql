-- =============================================================================
-- Phase 3 — Assessment and competency integrity enforced in the database.
--   * Exam privacy: learners see only their own attempts/answers; graders and
--     training administrators see all in the tenant.
--   * Attempt integrity: attempt limits (max + authorized extra attempts), time
--     limits, immutable submitted answers, passes consistent with the passing score.
--   * Competency signatures: only holders of competency.sign may sign, only their
--     own evaluation, never for themselves; signed records may only be voided.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Privacy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS own_read ON examination_attempts;
--> statement-breakpoint
CREATE POLICY own_read ON examination_attempts AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user()
  OR (SELECT app_has_permission('assessments.grade'))
  OR (SELECT app_has_permission('training.view_all'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_insert ON examination_attempts;
--> statement-breakpoint
CREATE POLICY own_insert ON examination_attempts AS RESTRICTIVE FOR INSERT WITH CHECK (
  user_id = app_current_user()
  AND EXISTS (SELECT 1 FROM enrollments e WHERE e.id = enrollment_id AND e.user_id = app_current_user())
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_update ON examination_attempts;
--> statement-breakpoint
CREATE POLICY own_update ON examination_attempts AS RESTRICTIVE FOR UPDATE USING (
  user_id = app_current_user() OR (SELECT app_has_permission('assessments.grade'))
);
--> statement-breakpoint

DROP POLICY IF EXISTS own_read ON examination_answers;
--> statement-breakpoint
CREATE POLICY own_read ON examination_answers AS RESTRICTIVE FOR SELECT USING (
  EXISTS (SELECT 1 FROM examination_attempts a WHERE a.id = attempt_id AND a.user_id = app_current_user())
  OR (SELECT app_has_permission('assessments.grade'))
  OR (SELECT app_has_permission('training.view_all'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_write ON examination_answers;
--> statement-breakpoint
CREATE POLICY own_write ON examination_answers AS RESTRICTIVE FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM examination_attempts a WHERE a.id = attempt_id AND a.user_id = app_current_user())
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_update ON examination_answers;
--> statement-breakpoint
CREATE POLICY own_update ON examination_answers AS RESTRICTIVE FOR UPDATE USING (
  EXISTS (SELECT 1 FROM examination_attempts a WHERE a.id = attempt_id AND a.user_id = app_current_user())
  OR (SELECT app_has_permission('assessments.grade'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_delete ON examination_answers;
--> statement-breakpoint
CREATE POLICY own_delete ON examination_answers AS RESTRICTIVE FOR DELETE USING (false);
--> statement-breakpoint

-- Learners see only their own competency records and certificates.
DROP POLICY IF EXISTS own_read ON competency_assessments;
--> statement-breakpoint
CREATE POLICY own_read ON competency_assessments AS RESTRICTIVE FOR SELECT USING (
  (SELECT app_has_permission('competency.view'))
  OR EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND e.user_id = app_current_user())
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_read ON certificates;
--> statement-breakpoint
CREATE POLICY own_read ON certificates AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user() OR (SELECT app_has_permission('certificates.view_all'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_read ON certificate_verifications;
--> statement-breakpoint
CREATE POLICY perm_read ON certificate_verifications AS RESTRICTIVE FOR SELECT USING ((SELECT app_has_permission('certificates.view_all')));
--> statement-breakpoint

-- Granting extra attempts requires training.assign or assessments.grade; learners
-- may not raise their own attempt allowance.
CREATE OR REPLACE FUNCTION enrollments_extra_attempts_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.extra_attempts IS DISTINCT FROM OLD.extra_attempts AND current_user = 'chta_app'
     AND NOT (app_has_permission('training.assign') OR app_has_permission('assessments.grade')) THEN
    RAISE EXCEPTION 'not permitted to change exam attempt allowance' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.extra_attempts < OLD.extra_attempts THEN
    RAISE EXCEPTION 'extra attempts cannot be reduced';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS enrollments_extra_attempts_guard ON enrollments;
--> statement-breakpoint
CREATE TRIGGER enrollments_extra_attempts_guard BEFORE UPDATE OF extra_attempts ON enrollments
  FOR EACH ROW EXECUTE FUNCTION enrollments_extra_attempts_guard();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Attempt integrity
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION examination_attempts_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  used int;
  allowed int;
  st enrollment_status;
  pass_mark int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT e.status, x.max_attempts + e.extra_attempts INTO st, allowed
      FROM enrollments e, examinations x
     WHERE e.id = NEW.enrollment_id AND x.id = NEW.examination_id;
    IF st IS DISTINCT FROM 'AWAITING_ASSESSMENT' THEN
      RAISE EXCEPTION 'exam not available: complete all required lessons first (enrollment is %)', st
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT count(*) INTO used FROM examination_attempts
     WHERE enrollment_id = NEW.enrollment_id AND examination_id = NEW.examination_id;
    IF used >= allowed THEN
      RAISE EXCEPTION 'no examination attempts remaining (% of % used)', used, allowed
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.attempt_number <> used + 1 THEN
      RAISE EXCEPTION 'attempt number must be %', used + 1;
    END IF;
    IF cardinality(NEW.question_ids) = 0 THEN
      RAISE EXCEPTION 'an attempt must contain questions';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.question_ids <> OLD.question_ids OR NEW.started_at <> OLD.started_at
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at OR NEW.attempt_number <> OLD.attempt_number
     OR NEW.enrollment_id <> OLD.enrollment_id OR NEW.examination_id <> OLD.examination_id OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'attempt identity fields are immutable';
  END IF;
  IF OLD.submitted_at IS NOT NULL THEN
    IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
      RAISE EXCEPTION 'submission time is immutable';
    END IF;
    IF OLD.grading_status <> 'PENDING_INSTRUCTOR'
       AND (NEW.score_pct IS DISTINCT FROM OLD.score_pct OR NEW.passed IS DISTINCT FROM OLD.passed
            OR NEW.grading_status IS DISTINCT FROM OLD.grading_status) THEN
      RAISE EXCEPTION 'graded attempts are final';
    END IF;
  END IF;
  IF NEW.passed IS TRUE THEN
    SELECT passing_score INTO pass_mark FROM examinations WHERE id = NEW.examination_id;
    IF NEW.score_pct IS NULL OR NEW.score_pct < pass_mark THEN
      RAISE EXCEPTION 'an attempt cannot pass below the passing score (%)', pass_mark USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS examination_attempts_guard ON examination_attempts;
--> statement-breakpoint
CREATE TRIGGER examination_attempts_guard BEFORE INSERT OR UPDATE ON examination_attempts
  FOR EACH ROW EXECUTE FUNCTION examination_attempts_guard();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION examination_answers_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  att examination_attempts%ROWTYPE;
BEGIN
  SELECT * INTO att FROM examination_attempts WHERE id = coalesce(NEW.attempt_id, OLD.attempt_id);
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'examination answers cannot be deleted';
  END IF;
  IF NOT (NEW.question_id = ANY (att.question_ids)) THEN
    RAISE EXCEPTION 'question is not part of this attempt';
  END IF;
  IF att.submitted_at IS NULL THEN
    -- After the time limit, responses are frozen; only grading of saved answers (and
    -- recording unanswered questions as JSON null) is allowed.
    IF att.expires_at IS NOT NULL AND now() > att.expires_at + interval '60 seconds'
       AND NOT ((TG_OP = 'UPDATE' AND NEW.response::text = OLD.response::text)
                OR (TG_OP = 'INSERT' AND NEW.response = 'null'::jsonb)) THEN
      RAISE EXCEPTION 'time limit expired; answers can no longer be changed' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  -- Submitted: the response is immutable; grading fields change only during instructor grading.
  IF TG_OP = 'INSERT' OR NEW.response::text <> OLD.response::text THEN
    RAISE EXCEPTION 'answers cannot be changed after submission';
  END IF;
  IF att.grading_status <> 'PENDING_INSTRUCTOR'
     AND (NEW.is_correct IS DISTINCT FROM OLD.is_correct OR NEW.points_awarded IS DISTINCT FROM OLD.points_awarded) THEN
    RAISE EXCEPTION 'graded answers are final';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS examination_answers_guard ON examination_answers;
--> statement-breakpoint
CREATE TRIGGER examination_answers_guard BEFORE INSERT OR UPDATE OR DELETE ON examination_answers
  FOR EACH ROW EXECUTE FUNCTION examination_answers_guard();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Competency signatures and voiding
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION competency_signed_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  emp_user uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'DRAFT' THEN
      RAISE EXCEPTION 'signed competency assessments cannot be deleted; void instead';
    END IF;
    RETURN OLD;
  END IF;

  SELECT user_id INTO emp_user FROM employees WHERE id = NEW.employee_id;
  IF emp_user IS NOT NULL AND emp_user = NEW.evaluator_user_id THEN
    RAISE EXCEPTION 'evaluators cannot assess their own competency' USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'VOIDED' THEN
    RAISE EXCEPTION 'voided competency assessments are final';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'SIGNED' THEN
    IF NEW.status <> 'VOIDED'
       OR (to_jsonb(NEW) - 'status' - 'voided_at' - 'voided_by_id' - 'void_reason')
          <> (to_jsonb(OLD) - 'status' - 'voided_at' - 'voided_by_id' - 'void_reason') THEN
      RAISE EXCEPTION 'signed competency assessments are immutable (they may only be voided)';
    END IF;
    IF NEW.void_reason IS NULL OR length(trim(NEW.void_reason)) < 5 OR NEW.voided_by_id IS NULL THEN
      RAISE EXCEPTION 'voiding requires a reason and the voiding user';
    END IF;
    NEW.voided_at := coalesce(NEW.voided_at, now());
    RETURN NEW;
  END IF;

  IF NEW.status = 'VOIDED' AND (TG_OP = 'INSERT' OR OLD.status = 'DRAFT') THEN
    RAISE EXCEPTION 'only signed assessments can be voided; delete drafts instead';
  END IF;

  IF NEW.status = 'SIGNED' AND (TG_OP = 'INSERT' OR OLD.status <> 'SIGNED') THEN
    IF current_user = 'chta_app' THEN
      IF NOT app_has_permission('competency.sign') THEN
        RAISE EXCEPTION 'electronic signature requires the competency.sign permission' USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF NEW.evaluator_user_id IS DISTINCT FROM app_current_user() THEN
        RAISE EXCEPTION 'only the evaluator may sign this assessment' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
    IF NEW.signature_hash IS NULL OR NEW.signer_name IS NULL THEN
      RAISE EXCEPTION 'a signature hash and signer name are required to sign';
    END IF;
    NEW.signed_at := coalesce(NEW.signed_at, now());
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS competency_signed_guard ON competency_assessments;
--> statement-breakpoint
CREATE TRIGGER competency_signed_guard BEFORE INSERT OR UPDATE OR DELETE ON competency_assessments
  FOR EACH ROW EXECUTE FUNCTION competency_signed_guard();
--> statement-breakpoint

-- chta_apply_security() v3: certificate_verifications is written only by the platform.
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
  -- Tables where the app role gets a narrower grant than full CRUD.
  narrowed jsonb := '{"certificates": "SELECT, UPDATE", "course_approvals": "SELECT, INSERT", "certificate_verifications": "SELECT"}';
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
