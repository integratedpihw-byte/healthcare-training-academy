-- Phase 6: serialize registrations per class (capacity race) and expose seat counts
-- to learners, who can otherwise see only their own attendance rows.
CREATE OR REPLACE FUNCTION attendance_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  s record;
  taken integer;
BEGIN
  -- Lock the session row so concurrent registrations cannot exceed capacity.
  SELECT * INTO s FROM training_sessions WHERE id = NEW.session_id FOR UPDATE;
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
CREATE OR REPLACE FUNCTION app_session_seats_taken(sess uuid) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT count(*)::int FROM attendance a
   WHERE a.session_id = sess AND a.status <> 'EXCUSED' AND a.tenant_id = app_current_tenant();
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_session_seats_taken(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_session_seats_taken(uuid) TO chta_app, chta_system;
--> statement-breakpoint
-- chta_apply_security() v7: billing_events (Stripe webhook idempotency) is platform-only.
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
  platform_only text[] := ARRAY['email_outbox', 'billing_events'];
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
SELECT chta_apply_security();
