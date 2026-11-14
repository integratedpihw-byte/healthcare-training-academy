-- Phase 7: file uploads (RLS follows the parent record) and optional SMS for critical alerts.

-- Files: readable only while the parent record is readable by the same user
-- (subqueries run under the caller's row-level security). Removed files are filtered
-- by the application (an RLS filter on deleted_at would also block the soft delete).
DROP POLICY IF EXISTS parent_read ON files;
--> statement-breakpoint
CREATE POLICY parent_read ON files AS RESTRICTIVE FOR SELECT USING (
  CASE purpose
    WHEN 'LICENSE_DOCUMENT' THEN EXISTS (SELECT 1 FROM licenses l WHERE l.id = entity_id)
    WHEN 'COMPETENCY_EVIDENCE' THEN EXISTS (SELECT 1 FROM competency_assessments a WHERE a.id = entity_id)
    WHEN 'LESSON_MEDIA' THEN EXISTS (SELECT 1 FROM lessons x WHERE x.id = entity_id)
    ELSE false END
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON files;
--> statement-breakpoint
CREATE POLICY perm_insert ON files AS RESTRICTIVE FOR INSERT WITH CHECK (
  uploaded_by_id = app_current_user() AND deleted_at IS NULL AND CASE purpose
    WHEN 'LICENSE_DOCUMENT' THEN EXISTS (SELECT 1 FROM licenses l WHERE l.id = entity_id AND app_can_access_employee(ARRAY['employees.manage'], l.employee_id))
    WHEN 'COMPETENCY_EVIDENCE' THEN EXISTS (SELECT 1 FROM competency_assessments a WHERE a.id = entity_id AND a.status = 'DRAFT' AND a.evaluator_user_id = app_current_user())
    WHEN 'LESSON_MEDIA' THEN (SELECT app_has_permission('courses.author')) AND EXISTS (SELECT 1 FROM lessons x WHERE x.id = entity_id AND x.tenant_id = app_current_tenant())
    ELSE false END
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON files;
--> statement-breakpoint
CREATE POLICY perm_update ON files AS RESTRICTIVE FOR UPDATE USING (
  uploaded_by_id = app_current_user() OR CASE purpose
    WHEN 'LICENSE_DOCUMENT' THEN EXISTS (SELECT 1 FROM licenses l WHERE l.id = entity_id AND app_can_access_employee(ARRAY['employees.manage'], l.employee_id))
    WHEN 'LESSON_MEDIA' THEN (SELECT app_has_permission('courses.author'))
    ELSE false END
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION files_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.tenant_id <> OLD.tenant_id OR NEW.purpose <> OLD.purpose OR NEW.entity_id <> OLD.entity_id
     OR NEW.storage_key <> OLD.storage_key OR NEW.sha256 <> OLD.sha256 OR NEW.size_bytes <> OLD.size_bytes
     OR NEW.content_type <> OLD.content_type OR NEW.uploaded_by_id <> OLD.uploaded_by_id OR NEW.filename <> OLD.filename THEN
    RAISE EXCEPTION 'files are immutable; upload a new file instead' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'file removal is permanent' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.purpose = 'COMPETENCY_EVIDENCE' AND NEW.deleted_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM competency_assessments a WHERE a.id = OLD.entity_id AND a.status <> 'DRAFT') THEN
    RAISE EXCEPTION 'evidence on a signed evaluation cannot be removed' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS files_guard ON files;
--> statement-breakpoint
CREATE TRIGGER files_guard BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION files_guard();
--> statement-breakpoint
ALTER TABLE user_notification_settings DROP CONSTRAINT IF EXISTS user_notification_settings_sms_phone_ck;
--> statement-breakpoint
ALTER TABLE user_notification_settings ADD CONSTRAINT user_notification_settings_sms_phone_ck
  CHECK (sms_phone IS NULL OR sms_phone ~ '^\+[1-9][0-9]{7,14}$');
--> statement-breakpoint
ALTER TABLE user_notification_settings DROP CONSTRAINT IF EXISTS user_notification_settings_sms_consent_ck;
--> statement-breakpoint
ALTER TABLE user_notification_settings ADD CONSTRAINT user_notification_settings_sms_consent_ck
  CHECK (NOT sms_opt_in OR (sms_phone IS NOT NULL AND sms_consent_at IS NOT NULL));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION notifications_enqueue_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  org_enabled boolean;
  s record;
  addr text;
  ustatus text;
  sms_org boolean;
  has_settings boolean := false;
BEGIN
  IF NEW.category = 'none' OR NEW.channel <> 'IN_APP' THEN
    RETURN NULL;
  END IF;
  SELECT email_enabled INTO org_enabled FROM notification_preferences WHERE tenant_id = NEW.tenant_id;
  IF org_enabled IS FALSE THEN
    RETURN NULL;
  END IF;
  SELECT * INTO s FROM user_notification_settings WHERE tenant_id = NEW.tenant_id AND user_id = NEW.user_id;
  has_settings := FOUND;
  IF FOUND AND (
       (NEW.category = 'assignments' AND NOT s.email_assignments)
    OR (NEW.category = 'results' AND NOT s.email_results)
    OR (NEW.category = 'announcements' AND NOT s.email_announcements)
  ) THEN
    RETURN NULL;
  END IF;
  SELECT email, status::text INTO addr, ustatus FROM users WHERE id = NEW.user_id;
  IF addr IS NULL OR ustatus = 'DISABLED' THEN
    RETURN NULL;
  END IF;
  -- Optional SMS: critical alerts only, organization enabled, user opted in with a phone.
  IF NEW.category = 'critical' THEN
    SELECT sms_enabled INTO sms_org FROM notification_preferences WHERE tenant_id = NEW.tenant_id;
    IF sms_org IS TRUE AND has_settings AND s.sms_opt_in IS TRUE AND s.sms_phone IS NOT NULL THEN
      INSERT INTO sms_outbox (tenant_id, user_id, notification_id, to_phone, body)
      VALUES (NEW.tenant_id, NEW.user_id, NEW.id, s.sms_phone, left(NEW.title, 140));
    END IF;
  END IF;
  INSERT INTO email_outbox (tenant_id, user_id, notification_id, to_email, subject, body, link)
  VALUES (NEW.tenant_id, NEW.user_id, NEW.id, addr, NEW.title, NEW.body, NEW.link);
  RETURN NULL;
END
$$;
--> statement-breakpoint
-- chta_apply_security() v8: sms_outbox platform-only; files without delete.
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
  platform_only text[] := ARRAY['email_outbox', 'billing_events', 'sms_outbox'];
  narrowed jsonb := '{"certificates": "SELECT, UPDATE", "course_approvals": "SELECT, INSERT", "certificate_verifications": "SELECT", "onboarding_runs": "SELECT, INSERT", "announcements": "SELECT, INSERT", "tenant_rule_decisions": "SELECT, INSERT", "compliance_snapshots": "SELECT", "ai_interactions": "SELECT, INSERT", "api_keys": "SELECT, INSERT, UPDATE", "files": "SELECT, INSERT, UPDATE"}';
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
SELECT chta_apply_security();
