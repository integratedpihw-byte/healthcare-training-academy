-- =============================================================================
-- Security layer: database roles, grants, row-level security, immutable audit.
--
-- Roles
--   (owner)      Runs migrations and owns tables. Subject to FORCE RLS.
--   chta_app     The web application's runtime role. NOBYPASSRLS. Every query
--                must run inside a transaction that sets app.tenant_id, otherwise
--                tenant tables return zero rows (fail-closed).
--   chta_system  Platform services: authentication, super-admin console,
--                scheduled jobs, Stripe webhooks, public certificate lookup.
--                BYPASSRLS. Never exposed to tenant-controlled input paths
--                without explicit server-side authorization.
--
-- Passwords/LOGIN are set outside migrations (scripts/db/setup-roles.sql).
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'chta_app') THEN
    CREATE ROLE chta_app NOLOGIN NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'chta_system') THEN
    CREATE ROLE chta_system NOLOGIN BYPASSRLS;
  END IF;
END $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid
$$;
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- chta_apply_security(): idempotent. Call at the end of EVERY future migration
-- so new tables automatically receive RLS + grants. Any table with a tenant_id
-- column is treated as tenant-owned:
--   tenant_id NOT NULL -> strict isolation for all commands
--   tenant_id NULLABLE -> NULL rows are platform-global (read-only to tenants)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
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

    IF r.table_name = ANY (billing_tables) THEN
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

-- -----------------------------------------------------------------------------
-- Immutable, hash-chained audit log
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (% blocked)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION audit_logs_chain() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  prev text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit:' || coalesce(NEW.tenant_id::text, 'platform')));
  SELECT hash INTO prev FROM audit_logs
   WHERE tenant_id IS NOT DISTINCT FROM NEW.tenant_id
   ORDER BY id DESC LIMIT 1;
  NEW.created_at := coalesce(NEW.created_at, now());
  NEW.prev_hash := prev;
  NEW.hash := encode(sha256(convert_to(
      coalesce(prev, '') || '|' || coalesce(NEW.tenant_id::text, '') || '|' ||
      coalesce(NEW.actor_user_id::text, '') || '|' || NEW.action || '|' ||
      NEW.entity_type || '|' || coalesce(NEW.entity_id, '') || '|' ||
      coalesce(NEW.before::text, '') || '|' || coalesce(NEW.after::text, '') || '|' ||
      to_char(NEW.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
    'UTF8')), 'hex');
  RETURN NEW;
END $$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs;
--> statement-breakpoint
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_block_mutation();
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_logs_hash_chain ON audit_logs;
--> statement-breakpoint
CREATE TRIGGER audit_logs_hash_chain BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_chain();
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- Integrity guards that must hold regardless of application code
-- -----------------------------------------------------------------------------

-- An issued certificate's identity fields can never be rewritten; only status
-- transitions (revocation/expiry/supersession) are allowed.
CREATE OR REPLACE FUNCTION certificates_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.certificate_number <> OLD.certificate_number
     OR NEW.verification_code <> OLD.verification_code
     OR NEW.recipient_name <> OLD.recipient_name
     OR NEW.course_title <> OLD.course_title
     OR NEW.completed_on <> OLD.completed_on
     OR NEW.issued_at <> OLD.issued_at
     OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'certificate identity fields are immutable';
  END IF;
  -- Never extend an expiration without a new certificate (renewal issues a new row).
  IF OLD.expires_on IS NOT NULL AND (NEW.expires_on IS NULL OR NEW.expires_on > OLD.expires_on) THEN
    RAISE EXCEPTION 'certificate expiration cannot be extended; issue a renewal certificate';
  END IF;
  IF OLD.status = 'REVOKED' AND NEW.status <> 'REVOKED' THEN
    RAISE EXCEPTION 'revoked certificates cannot be reinstated';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER certificates_guard BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION certificates_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION block_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% rows cannot be deleted; revoke or void instead', TG_TABLE_NAME;
END $$;
--> statement-breakpoint
CREATE TRIGGER certificates_no_delete BEFORE DELETE ON certificates
  FOR EACH ROW EXECUTE FUNCTION block_delete();
--> statement-breakpoint
CREATE TRIGGER examination_attempts_no_delete BEFORE DELETE ON examination_attempts
  FOR EACH ROW EXECUTE FUNCTION block_delete();
--> statement-breakpoint

-- A signed competency assessment is frozen (it may only be VOIDED).
CREATE OR REPLACE FUNCTION competency_signed_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'SIGNED' THEN
      RAISE EXCEPTION 'signed competency assessments cannot be deleted; void instead';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'SIGNED' AND NOT (NEW.status = 'VOIDED' AND
       (to_jsonb(NEW) - 'status') = (to_jsonb(OLD) - 'status')) THEN
    RAISE EXCEPTION 'signed competency assessments are immutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER competency_signed_guard BEFORE UPDATE OR DELETE ON competency_assessments
  FOR EACH ROW EXECUTE FUNCTION competency_signed_guard();
--> statement-breakpoint

-- Certificates require a completed enrollment (mandatory exam passed) when tied to a course.
CREATE OR REPLACE FUNCTION certificates_require_completion() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  st enrollment_status;
BEGIN
  IF NEW.kind <> 'COMPETENCY_VERIFICATION' THEN
    IF NEW.enrollment_id IS NULL THEN
      RAISE EXCEPTION 'course certificates must reference an enrollment';
    END IF;
    SELECT status INTO st FROM enrollments WHERE id = NEW.enrollment_id;
    IF st IS DISTINCT FROM 'COMPLETED' THEN
      RAISE EXCEPTION 'certificate cannot be issued: enrollment is not COMPLETED';
    END IF;
  END IF;
  IF NEW.kind = 'CONTINUING_EDUCATION' AND NEW.accreditation IS NULL THEN
    RAISE EXCEPTION 'continuing education certificates require a recorded accreditation approval';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER certificates_require_completion BEFORE INSERT ON certificates
  FOR EACH ROW EXECUTE FUNCTION certificates_require_completion();
--> statement-breakpoint

SELECT chta_apply_security();
