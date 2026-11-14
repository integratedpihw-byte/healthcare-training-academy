-- =============================================================================
-- Phase 6 — Enterprise: instructors, classes and attendance, course evaluations,
-- instructor messages, AI usage log, API keys, billing webhook idempotency.
-- =============================================================================

-- Instructor profiles: managed with instructors.manage; instructors may edit their own.
SELECT chta_require_permission_for_writes('instructors', 'instructors.manage');
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON instructors;
--> statement-breakpoint
CREATE POLICY perm_update ON instructors AS RESTRICTIVE FOR UPDATE
  USING (user_id = app_current_user() OR (SELECT app_has_permission('instructors.manage')));
--> statement-breakpoint
SELECT chta_require_permission_for_writes('instructor_courses', 'instructors.manage');
--> statement-breakpoint

-- Is the current user the instructor of this session?
CREATE OR REPLACE FUNCTION app_is_session_instructor(sess uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM training_sessions s JOIN instructors i ON i.id = s.instructor_id
     WHERE s.id = sess AND s.tenant_id = app_current_tenant() AND i.user_id = app_current_user()
  )
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_is_session_instructor(uuid) TO chta_app, chta_system;
--> statement-breakpoint

-- Classes: scheduled by training.schedule.manage; the session's instructor may update it.
SELECT chta_require_permission_for_writes('training_sessions', 'training.schedule.manage');
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON training_sessions;
--> statement-breakpoint
CREATE POLICY perm_update ON training_sessions AS RESTRICTIVE FOR UPDATE
  USING ((SELECT app_has_permission('training.schedule.manage')) OR app_is_session_instructor(id));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON training_sessions;
--> statement-breakpoint
CREATE POLICY perm_delete ON training_sessions AS RESTRICTIVE FOR DELETE USING (false);
--> statement-breakpoint

-- Attendance: own registration (self-enrolment), schedulers and the session instructor.
DROP POLICY IF EXISTS own_read ON attendance;
--> statement-breakpoint
CREATE POLICY own_read ON attendance AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user()
  OR (SELECT app_has_permission('training.schedule.manage'))
  OR app_is_session_instructor(session_id)
  OR (SELECT app_has_tenant_permission('training.view_all'))
  OR app_can_access_user(ARRAY['training.view_all'], user_id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON attendance;
--> statement-breakpoint
CREATE POLICY perm_insert ON attendance AS RESTRICTIVE FOR INSERT WITH CHECK (
  (user_id = app_current_user() AND status = 'REGISTERED')
  OR (SELECT app_has_permission('training.schedule.manage'))
  OR app_is_session_instructor(session_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON attendance;
--> statement-breakpoint
CREATE POLICY perm_update ON attendance AS RESTRICTIVE FOR UPDATE USING (
  (SELECT app_has_permission('training.schedule.manage')) OR app_is_session_instructor(session_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON attendance;
--> statement-breakpoint
CREATE POLICY perm_delete ON attendance AS RESTRICTIVE FOR DELETE USING (
  (user_id = app_current_user() AND status = 'REGISTERED') OR (SELECT app_has_permission('training.schedule.manage'))
);
--> statement-breakpoint

CREATE OR REPLACE FUNCTION attendance_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  s record;
  taken integer;
BEGIN
  SELECT * INTO s FROM training_sessions WHERE id = NEW.session_id;
  IF s.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'the session was cancelled' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF s.capacity IS NOT NULL THEN
      SELECT count(*) INTO taken FROM attendance WHERE session_id = NEW.session_id AND status <> 'EXCUSED';
      IF taken >= s.capacity THEN
        RAISE EXCEPTION 'the session is full' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM memberships m WHERE m.tenant_id = NEW.tenant_id AND m.user_id = NEW.user_id AND m.status = 'ACTIVE') THEN
      RAISE EXCEPTION 'attendee is not a member of the organization' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.status IN ('PRESENT', 'ABSENT') AND s.starts_at > now() THEN
    RAISE EXCEPTION 'attendance can be recorded only once the session has started' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'PRESENT' THEN
    NEW.checked_in_at := coalesce(NEW.checked_in_at, now());
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.session_id <> OLD.session_id OR NEW.user_id <> OLD.user_id) THEN
    RAISE EXCEPTION 'attendance identity cannot change' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS attendance_guard ON attendance;
--> statement-breakpoint
CREATE TRIGGER attendance_guard BEFORE INSERT OR UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION attendance_guard();
--> statement-breakpoint

-- Course evaluations: only learners who completed the course may rate it (1–5).
CREATE OR REPLACE FUNCTION course_reviews_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.tenant_id = NEW.tenant_id AND e.user_id = NEW.user_id AND e.course_id = NEW.course_id AND e.status = 'COMPLETED') THEN
    RAISE EXCEPTION 'only learners who completed the course can evaluate it' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS course_reviews_guard ON course_reviews;
--> statement-breakpoint
CREATE TRIGGER course_reviews_guard BEFORE INSERT OR UPDATE ON course_reviews FOR EACH ROW EXECUTE FUNCTION course_reviews_guard();
--> statement-breakpoint

-- Instructor messages reuse announcements: announcers or active instructors may send.
DROP POLICY IF EXISTS perm_insert ON announcements;
--> statement-breakpoint
CREATE POLICY perm_insert ON announcements AS RESTRICTIVE FOR INSERT WITH CHECK (
  author_id = app_current_user() AND (
    (SELECT app_has_permission('notifications.announce'))
    OR EXISTS (SELECT 1 FROM instructors i WHERE i.user_id = app_current_user() AND i.tenant_id = app_current_tenant() AND i.is_active)
  )
);
--> statement-breakpoint

-- AI usage log: insert/read own; auditors read all.
DROP POLICY IF EXISTS own_read ON ai_interactions;
--> statement-breakpoint
CREATE POLICY own_read ON ai_interactions AS RESTRICTIVE FOR SELECT USING (user_id = app_current_user() OR (SELECT app_has_permission('audit.view')));
--> statement-breakpoint
DROP POLICY IF EXISTS own_insert ON ai_interactions;
--> statement-breakpoint
CREATE POLICY own_insert ON ai_interactions AS RESTRICTIVE FOR INSERT WITH CHECK (user_id = app_current_user());
--> statement-breakpoint

-- API keys: integrations.manage only.
SELECT chta_require_permission_for_writes('api_keys', 'integrations.manage');
--> statement-breakpoint
DROP POLICY IF EXISTS perm_read ON api_keys;
--> statement-breakpoint
CREATE POLICY perm_read ON api_keys AS RESTRICTIVE FOR SELECT USING ((SELECT app_has_permission('integrations.manage')));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION api_keys_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.key_hash <> OLD.key_hash OR NEW.prefix <> OLD.prefix OR NEW.scopes <> OLD.scopes OR NEW.tenant_id <> OLD.tenant_id) THEN
    RAISE EXCEPTION 'API keys cannot be altered; revoke and create a new key' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at THEN
    RAISE EXCEPTION 'revocation is permanent' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS api_keys_guard ON api_keys;
--> statement-breakpoint
CREATE TRIGGER api_keys_guard BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION api_keys_guard();
--> statement-breakpoint

-- Webhook idempotency is platform-only.
REVOKE ALL ON billing_events FROM chta_app;
--> statement-breakpoint
GRANT ALL ON billing_events TO chta_system;
--> statement-breakpoint

-- chta_apply_security() v6: AI log insert/read, API keys without delete.
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
  platform_only text[] := ARRAY['email_outbox'];
  narrowed jsonb := '{"certificates": "SELECT, UPDATE", "course_approvals": "SELECT, INSERT", "certificate_verifications": "SELECT", "onboarding_runs": "SELECT, INSERT", "announcements": "SELECT, INSERT", "tenant_rule_decisions": "SELECT, INSERT", "compliance_snapshots": "SELECT", "ai_interactions": "SELECT, INSERT", "api_keys": "SELECT, INSERT, UPDATE"}';
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

    IF r.table_name = ANY (platform_only) THEN
      EXECUTE format('REVOKE ALL ON %I FROM chta_app', r.table_name);
    ELSIF narrowed ? r.table_name THEN
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
  GRANT SELECT ON permissions, regulatory_sources, regulatory_rules, regulatory_rule_versions TO chta_app;

  -- Global identity: the app may read display columns only (never hashes/MFA secrets).
  REVOKE ALL ON users FROM chta_app;
  GRANT SELECT (id, email, first_name, last_name, status) ON users TO chta_app;

  -- Credentials and auth plumbing are platform-only.
  REVOKE ALL ON sessions, password_reset_tokens, rate_limits FROM chta_app;
END
$fn$;
--> statement-breakpoint
--> statement-breakpoint
SELECT chta_apply_security();
