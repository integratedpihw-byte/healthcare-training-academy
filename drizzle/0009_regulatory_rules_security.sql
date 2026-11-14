-- =============================================================================
-- Phase 5 — Regulatory compliance engine rules.
--   * Every regulatory rule change is versioned automatically and immutably, with a
--     required change summary (app.change_summary); rules are deactivated, never deleted.
--   * Applicability decisions are insert-only, need compliance.manage within the
--     decider's facility scope, and always record the rule version reviewed.
--   * Compliance snapshots are written by the platform job only.
-- =============================================================================

CREATE OR REPLACE FUNCTION regulatory_rules_versioning() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  summary text := nullif(trim(current_setting('app.change_summary', true)), '');
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'regulatory rules are deactivated, never deleted' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF summary IS NULL OR length(summary) < 10 THEN
      RAISE EXCEPTION 'a change summary (app.change_summary, 10+ characters) is required to change a regulatory rule'
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.version := OLD.version + 1;
    NEW.updated_at := now();
    NEW.created_at := OLD.created_at;
  ELSE
    NEW.version := 1;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS regulatory_rules_versioning ON regulatory_rules;
--> statement-breakpoint
CREATE TRIGGER regulatory_rules_versioning BEFORE INSERT OR UPDATE OR DELETE ON regulatory_rules
  FOR EACH ROW EXECUTE FUNCTION regulatory_rules_versioning();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION regulatory_rules_history() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO regulatory_rule_versions (rule_id, version, snapshot, change_summary, changed_by_id)
  VALUES (
    NEW.id, NEW.version, to_jsonb(NEW),
    coalesce(nullif(trim(current_setting('app.change_summary', true)), ''), 'Initial version'),
    nullif(current_setting('app.user_id', true), '')::uuid
  );
  RETURN NULL;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS regulatory_rules_history ON regulatory_rules;
--> statement-breakpoint
CREATE TRIGGER regulatory_rules_history AFTER INSERT OR UPDATE ON regulatory_rules
  FOR EACH ROW EXECUTE FUNCTION regulatory_rules_history();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION immutable_row() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% rows are immutable', TG_TABLE_NAME USING ERRCODE = 'check_violation';
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS regulatory_rule_versions_immutable ON regulatory_rule_versions;
--> statement-breakpoint
CREATE TRIGGER regulatory_rule_versions_immutable BEFORE UPDATE OR DELETE ON regulatory_rule_versions
  FOR EACH ROW EXECUTE FUNCTION immutable_row();
--> statement-breakpoint
DROP TRIGGER IF EXISTS tenant_rule_decisions_immutable ON tenant_rule_decisions;
--> statement-breakpoint
CREATE TRIGGER tenant_rule_decisions_immutable BEFORE UPDATE OR DELETE ON tenant_rule_decisions
  FOR EACH ROW EXECUTE FUNCTION immutable_row();
--> statement-breakpoint

-- Decisions always record the current rule version and the deciding user.
CREATE OR REPLACE FUNCTION tenant_rule_decisions_stamp() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  SELECT version INTO NEW.rule_version FROM regulatory_rules WHERE id = NEW.rule_id AND is_active;
  IF NEW.rule_version IS NULL THEN
    RAISE EXCEPTION 'rule not found or inactive' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.facility_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM facilities f WHERE f.id = NEW.facility_id AND f.tenant_id = NEW.tenant_id) THEN
    RAISE EXCEPTION 'facility does not belong to the organization' USING ERRCODE = 'check_violation';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS tenant_rule_decisions_stamp ON tenant_rule_decisions;
--> statement-breakpoint
CREATE TRIGGER tenant_rule_decisions_stamp BEFORE INSERT ON tenant_rule_decisions
  FOR EACH ROW EXECUTE FUNCTION tenant_rule_decisions_stamp();
--> statement-breakpoint

DROP POLICY IF EXISTS perm_read ON tenant_rule_decisions;
--> statement-breakpoint
CREATE POLICY perm_read ON tenant_rule_decisions AS RESTRICTIVE FOR SELECT USING (
  (SELECT app_has_permission('compliance.view')) OR (SELECT app_has_permission('compliance.manage')) OR (SELECT app_has_permission('reports.view'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON tenant_rule_decisions;
--> statement-breakpoint
CREATE POLICY perm_insert ON tenant_rule_decisions AS RESTRICTIVE FOR INSERT WITH CHECK (
  decided_by_id = app_current_user() AND app_has_permission_at('compliance.manage', facility_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_read ON compliance_snapshots;
--> statement-breakpoint
CREATE POLICY perm_read ON compliance_snapshots AS RESTRICTIVE FOR SELECT USING (
  (SELECT app_has_permission('compliance.view')) OR (SELECT app_has_permission('reports.view'))
);
--> statement-breakpoint

-- chta_apply_security() v5: decisions insert-only, snapshots read-only, rule history readable.
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
  platform_only text[] := ARRAY['email_outbox'];
  narrowed jsonb := '{"certificates": "SELECT, UPDATE", "course_approvals": "SELECT, INSERT", "certificate_verifications": "SELECT", "onboarding_runs": "SELECT, INSERT", "announcements": "SELECT, INSERT", "tenant_rule_decisions": "SELECT, INSERT", "compliance_snapshots": "SELECT"}';
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
