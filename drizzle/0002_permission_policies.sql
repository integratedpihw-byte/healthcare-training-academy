-- =============================================================================
-- Database-level permission enforcement.
-- Tenant isolation (0001) answers "which tenant's rows?". These RESTRICTIVE
-- policies additionally answer "may this user perform this write?" so that a bug
-- in API authorization cannot, by itself, let a learner modify protected records.
-- The application sets app.user_id alongside app.tenant_id in withTenant().
-- =============================================================================

CREATE OR REPLACE FUNCTION app_current_user() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::uuid
$$;
--> statement-breakpoint

-- True when the current user holds `perm` in the current tenant through any
-- active role. Facility scoping is enforced in the application layer.
CREATE OR REPLACE FUNCTION app_has_permission(perm text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    JOIN membership_roles mr ON mr.membership_id = m.id
    JOIN role_permissions rp ON rp.role_id = mr.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE m.tenant_id = app_current_tenant()
      AND m.user_id = app_current_user()
      AND m.status = 'ACTIVE'
      AND p.key = perm
  )
$$;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION app_current_user() TO chta_app, chta_system;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_has_permission(text) TO chta_app, chta_system;
--> statement-breakpoint

-- Helper: create restrictive INSERT/UPDATE/DELETE policies requiring a permission.
CREATE OR REPLACE FUNCTION chta_require_permission_for_writes(tbl text, perm text) RETURNS void
LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS perm_insert ON %I', tbl);
  EXECUTE format('DROP POLICY IF EXISTS perm_update ON %I', tbl);
  EXECUTE format('DROP POLICY IF EXISTS perm_delete ON %I', tbl);
  EXECUTE format('CREATE POLICY perm_insert ON %I AS RESTRICTIVE FOR INSERT WITH CHECK (app_has_permission(%L))', tbl, perm);
  EXECUTE format('CREATE POLICY perm_update ON %I AS RESTRICTIVE FOR UPDATE USING (app_has_permission(%L))', tbl, perm);
  EXECUTE format('CREATE POLICY perm_delete ON %I AS RESTRICTIVE FOR DELETE USING (app_has_permission(%L))', tbl, perm);
END
$fn$;
--> statement-breakpoint

SELECT chta_require_permission_for_writes('organizations', 'org.settings.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('facilities', 'org.facilities.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('departments', 'org.facilities.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('memberships', 'org.users.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('membership_roles', 'org.users.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('roles', 'org.roles.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('role_permissions', 'org.roles.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('employees', 'employees.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('employee_facilities', 'employees.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('licenses', 'employees.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('training_requirements', 'training.requirements.manage');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('competency_assessments', 'competency.evaluate');
--> statement-breakpoint
SELECT chta_require_permission_for_writes('notification_preferences', 'org.settings.manage');
--> statement-breakpoint

-- Tenant profile edits.
DROP POLICY IF EXISTS perm_update ON tenants;
--> statement-breakpoint
CREATE POLICY perm_update ON tenants AS RESTRICTIVE FOR UPDATE USING (app_has_permission('org.settings.manage'));
--> statement-breakpoint

-- Certificates are issued by platform services only (system role); tenants may
-- update (revoke) only with certificates.revoke and may never delete (trigger).
REVOKE INSERT, DELETE ON certificates FROM chta_app;
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON certificates;
--> statement-breakpoint
CREATE POLICY perm_update ON certificates AS RESTRICTIVE FOR UPDATE USING (app_has_permission('certificates.revoke'));
--> statement-breakpoint

-- Audit trail: reading requires audit.view (appending is always allowed in-tenant).
DROP POLICY IF EXISTS perm_read ON audit_logs;
--> statement-breakpoint
CREATE POLICY perm_read ON audit_logs AS RESTRICTIVE FOR SELECT USING (app_has_permission('audit.view'));
--> statement-breakpoint

-- Training assignments: create/cancel needs training.assign; learners may update
-- their own assignment status only through platform services (Phase 2).
SELECT chta_require_permission_for_writes('training_assignments', 'training.assign');
--> statement-breakpoint

-- Because audit reads are now permission-restricted, the hash chain can no longer
-- read the previous row as the invoking user. Chain heads live in a platform table
-- maintained by a SECURITY DEFINER trigger (owner-only, no app grants).
CREATE TABLE IF NOT EXISTS audit_chain_heads (
  chain_key text PRIMARY KEY,
  last_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
REVOKE ALL ON audit_chain_heads FROM chta_app;
--> statement-breakpoint
GRANT ALL ON audit_chain_heads TO chta_system;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION audit_logs_chain() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  k text := coalesce(NEW.tenant_id::text, 'platform');
  prev text;
BEGIN
  INSERT INTO audit_chain_heads (chain_key, last_hash) VALUES (k, '')
    ON CONFLICT (chain_key) DO NOTHING;
  SELECT nullif(last_hash, '') INTO prev FROM audit_chain_heads WHERE chain_key = k FOR UPDATE;
  NEW.created_at := coalesce(NEW.created_at, now());
  NEW.prev_hash := prev;
  NEW.hash := encode(sha256(convert_to(
      coalesce(prev, '') || '|' || coalesce(NEW.tenant_id::text, '') || '|' ||
      coalesce(NEW.actor_user_id::text, '') || '|' || NEW.action || '|' ||
      NEW.entity_type || '|' || coalesce(NEW.entity_id, '') || '|' ||
      coalesce(NEW.before::text, '') || '|' || coalesce(NEW.after::text, '') || '|' ||
      to_char(NEW.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
    'UTF8')), 'hex');
  UPDATE audit_chain_heads SET last_hash = NEW.hash, updated_at = now() WHERE chain_key = k;
  RETURN NEW;
END $$;
