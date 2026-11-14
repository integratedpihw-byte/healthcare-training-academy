-- =============================================================================
-- Phase 4 — Workforce management rules enforced in the database.
--   * Facility scoping: permissions held through a facility-scoped role (e.g.
--     Facility Administrator) now limit READS and WRITES to employees assigned to
--     that facility — previously facility scope was enforced only in the app.
--   * Team scoping: holders of team.view (Supervisor) see the records of their
--     direct reports only (employees.supervisor_id).
--   * Training assignments: completed only by a completed enrollment (synced by
--     trigger), closed assignments are immutable, waive/cancel need a reason,
--     never deleted by the application.
--   * Licenses: VERIFIED requires a verifier and a verification source; a new
--     expiration date resets verification.
--   * Notifications: private to the recipient; email fan-out applies organization
--     and user preferences in one place (trigger → email_outbox, platform-only).
-- Requires the owner role to have BYPASSRLS (scripts/db/setup-roles.sql) so the
-- SECURITY DEFINER access helpers below can read across RLS without recursion.
-- =============================================================================

DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'Migration role % needs BYPASSRLS (re-run scripts/db/setup-roles.sql as an administrator)', current_user;
  END IF;
END $$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

-- Permission held tenant-wide (through a role that is not facility-scoped).
CREATE OR REPLACE FUNCTION app_has_tenant_permission(perm text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
      AND mr.facility_id IS NULL
  )
$$;
--> statement-breakpoint

-- Permission held tenant-wide or for the given facility.
CREATE OR REPLACE FUNCTION app_has_permission_at(perm text, fac uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
      AND (mr.facility_id IS NULL OR mr.facility_id = fac)
  )
$$;
--> statement-breakpoint

-- True when the current user holds any of `perms` for the employee: tenant-wide, or
-- through a facility-scoped role at a facility the employee is assigned to, or (when
-- include_team) as the employee's supervisor of record holding team.view.
CREATE OR REPLACE FUNCTION app_can_access_employee(perms text[], emp uuid, include_team boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = emp
      AND e.tenant_id = app_current_tenant()
      AND (
        EXISTS (
          SELECT 1
          FROM memberships m
          JOIN membership_roles mr ON mr.membership_id = m.id
          JOIN role_permissions rp ON rp.role_id = mr.role_id
          JOIN permissions p ON p.id = rp.permission_id
          WHERE m.tenant_id = e.tenant_id
            AND m.user_id = app_current_user()
            AND m.status = 'ACTIVE'
            AND p.key = ANY (perms)
            AND (
              mr.facility_id IS NULL
              OR mr.facility_id = e.primary_facility_id
              OR EXISTS (SELECT 1 FROM employee_facilities ef WHERE ef.employee_id = e.id AND ef.facility_id = mr.facility_id)
            )
        )
        OR (
          include_team
          AND e.supervisor_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM employees s WHERE s.id = e.supervisor_id AND s.user_id = app_current_user())
          AND EXISTS (
            SELECT 1
            FROM memberships m
            JOIN membership_roles mr ON mr.membership_id = m.id
            JOIN role_permissions rp ON rp.role_id = mr.role_id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE m.tenant_id = e.tenant_id AND m.user_id = app_current_user() AND m.status = 'ACTIVE' AND p.key = 'team.view'
          )
        )
      )
  )
$$;
--> statement-breakpoint

-- Same rule for records keyed by user (enrollments, attempts, certificates).
CREATE OR REPLACE FUNCTION app_can_access_user(perms text[], target uuid, include_team boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.tenant_id = app_current_tenant()
      AND e.user_id = target
      AND app_can_access_employee(perms, e.id, include_team)
  )
$$;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION app_has_tenant_permission(text) TO chta_app, chta_system;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_has_permission_at(text, uuid) TO chta_app, chta_system;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_can_access_employee(text[], uuid, boolean) TO chta_app, chta_system;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_can_access_user(text[], uuid, boolean) TO chta_app, chta_system;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Employees and assignments to facilities
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS own_read ON employees;
--> statement-breakpoint
CREATE POLICY own_read ON employees AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user()
  OR (SELECT app_has_tenant_permission('employees.view'))
  OR (SELECT app_has_tenant_permission('training.view_all'))
  OR (SELECT app_has_tenant_permission('competency.view'))
  OR app_can_access_employee(ARRAY['employees.view','employees.manage','training.view_all','training.assign','competency.view'], id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON employees;
--> statement-breakpoint
CREATE POLICY perm_insert ON employees AS RESTRICTIVE FOR INSERT
  WITH CHECK (app_has_permission_at('employees.manage', primary_facility_id));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON employees;
--> statement-breakpoint
CREATE POLICY perm_update ON employees AS RESTRICTIVE FOR UPDATE
  USING (app_can_access_employee(ARRAY['employees.manage'], id))
  WITH CHECK (app_has_permission_at('employees.manage', primary_facility_id));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON employees;
--> statement-breakpoint
CREATE POLICY perm_delete ON employees AS RESTRICTIVE FOR DELETE USING ((SELECT app_has_tenant_permission('employees.manage')));
--> statement-breakpoint

DROP POLICY IF EXISTS perm_insert ON employee_facilities;
--> statement-breakpoint
CREATE POLICY perm_insert ON employee_facilities AS RESTRICTIVE FOR INSERT WITH CHECK (
  app_has_permission_at('employees.manage', facility_id)
  AND app_can_access_employee(ARRAY['employees.manage'], employee_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON employee_facilities;
--> statement-breakpoint
CREATE POLICY perm_update ON employee_facilities AS RESTRICTIVE FOR UPDATE USING (false);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON employee_facilities;
--> statement-breakpoint
CREATE POLICY perm_delete ON employee_facilities AS RESTRICTIVE FOR DELETE USING (app_has_permission_at('employees.manage', facility_id));
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Licenses
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS own_read ON licenses;
--> statement-breakpoint
CREATE POLICY own_read ON licenses AS RESTRICTIVE FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND e.user_id = app_current_user())
  OR (SELECT app_has_tenant_permission('employees.view'))
  OR app_can_access_employee(ARRAY['employees.view','employees.manage'], employee_id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON licenses;
--> statement-breakpoint
CREATE POLICY perm_insert ON licenses AS RESTRICTIVE FOR INSERT WITH CHECK (app_can_access_employee(ARRAY['employees.manage'], employee_id));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON licenses;
--> statement-breakpoint
CREATE POLICY perm_update ON licenses AS RESTRICTIVE FOR UPDATE USING (app_can_access_employee(ARRAY['employees.manage'], employee_id));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON licenses;
--> statement-breakpoint
CREATE POLICY perm_delete ON licenses AS RESTRICTIVE FOR DELETE USING (app_can_access_employee(ARRAY['employees.manage'], employee_id));
--> statement-breakpoint

CREATE OR REPLACE FUNCTION licenses_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- A renewed (later) expiration date is new information that must be re-verified.
  IF TG_OP = 'UPDATE' AND NEW.expires_on IS DISTINCT FROM OLD.expires_on AND NEW.verification_status = 'VERIFIED'
     AND OLD.verification_status = 'VERIFIED' AND NEW.verified_at IS NOT DISTINCT FROM OLD.verified_at THEN
    NEW.verification_status := 'UNVERIFIED';
    NEW.verified_at := NULL;
    NEW.verified_by_id := NULL;
  END IF;
  IF NEW.verification_status = 'VERIFIED' THEN
    IF NEW.verified_by_id IS NULL OR NEW.verified_at IS NULL OR coalesce(length(trim(NEW.verification_source)), 0) < 3 THEN
      RAISE EXCEPTION 'a verified license requires the verifier, date and verification source'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.issued_on IS NOT NULL AND NEW.expires_on IS NOT NULL AND NEW.expires_on < NEW.issued_on THEN
    RAISE EXCEPTION 'license expiration cannot precede issue date' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS licenses_guard ON licenses;
--> statement-breakpoint
CREATE TRIGGER licenses_guard BEFORE INSERT OR UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION licenses_guard();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Training assignments
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS own_read ON training_assignments;
--> statement-breakpoint
CREATE POLICY own_read ON training_assignments AS RESTRICTIVE FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND e.user_id = app_current_user())
  OR (SELECT app_has_tenant_permission('training.view_all'))
  OR (SELECT app_has_tenant_permission('training.assign'))
  OR app_can_access_employee(ARRAY['training.view_all','training.assign'], employee_id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON training_assignments;
--> statement-breakpoint
CREATE POLICY perm_insert ON training_assignments AS RESTRICTIVE FOR INSERT WITH CHECK (app_can_access_employee(ARRAY['training.assign'], employee_id));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON training_assignments;
--> statement-breakpoint
CREATE POLICY perm_update ON training_assignments AS RESTRICTIVE FOR UPDATE USING (app_can_access_employee(ARRAY['training.assign'], employee_id));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON training_assignments;
--> statement-breakpoint
CREATE POLICY perm_delete ON training_assignments AS RESTRICTIVE FOR DELETE USING (false);
--> statement-breakpoint

CREATE OR REPLACE FUNCTION training_assignments_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'ASSIGNED' THEN
      RAISE EXCEPTION 'new training assignments start as ASSIGNED' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = NEW.course_id AND c.status = 'PUBLISHED'
        AND (c.tenant_id IS NULL OR c.tenant_id = NEW.tenant_id)
    ) THEN
      RAISE EXCEPTION 'only published courses available to the organization can be assigned' USING ERRCODE = 'check_violation';
    END IF;
    -- Already working on the course? Start the assignment in progress.
    IF EXISTS (
      SELECT 1 FROM enrollments en JOIN employees em ON em.user_id = en.user_id AND em.id = NEW.employee_id
       WHERE en.tenant_id = NEW.tenant_id AND en.course_id = NEW.course_id
         AND en.status IN ('IN_PROGRESS', 'AWAITING_ASSESSMENT', 'FAILED')
    ) THEN
      NEW.status := 'IN_PROGRESS';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.tenant_id <> OLD.tenant_id OR NEW.employee_id <> OLD.employee_id OR NEW.course_id <> OLD.course_id
     OR NEW.created_at <> OLD.created_at OR NEW.source <> OLD.source THEN
    RAISE EXCEPTION 'training assignment identity cannot be changed' USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.status IN ('COMPLETED', 'WAIVED', 'CANCELLED') THEN
    IF NEW.status <> OLD.status OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
       OR NEW.due_date IS DISTINCT FROM OLD.due_date OR NEW.status_reason IS DISTINCT FROM OLD.status_reason THEN
      RAISE EXCEPTION 'closed training assignments cannot be changed' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'COMPLETED' THEN
    IF NOT EXISTS (
      SELECT 1 FROM enrollments en
      JOIN employees em ON em.user_id = en.user_id AND em.id = NEW.employee_id
      WHERE en.tenant_id = NEW.tenant_id AND en.course_id = NEW.course_id AND en.status = 'COMPLETED'
        AND (en.assignment_id = NEW.id OR en.completed_at >= NEW.created_at)
    ) THEN
      RAISE EXCEPTION 'a training assignment is completed only by a completed course enrollment'
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.completed_at := coalesce(NEW.completed_at, now());
  ELSIF NEW.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'completed_at is set only on completion' USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status IN ('WAIVED', 'CANCELLED') THEN
    IF coalesce(length(trim(NEW.status_reason)), 0) < 5 THEN
      RAISE EXCEPTION 'waiving or cancelling an assignment requires a reason' USING ERRCODE = 'check_violation';
    END IF;
    NEW.closed_at := coalesce(NEW.closed_at, now());
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS training_assignments_guard ON training_assignments;
--> statement-breakpoint
CREATE TRIGGER training_assignments_guard BEFORE INSERT OR UPDATE ON training_assignments
  FOR EACH ROW EXECUTE FUNCTION training_assignments_guard();
--> statement-breakpoint

-- Enrollment progress drives assignment status (runs as owner: learners cannot
-- update assignments directly). Matches the linked assignment or the employee's
-- open assignment for the same course.
CREATE OR REPLACE FUNCTION enrollments_sync_assignment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  a_id uuid := NEW.assignment_id;
BEGIN
  -- Only honour a linked assignment that belongs to this learner and is still open.
  IF a_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM training_assignments ta JOIN employees e ON e.id = ta.employee_id
     WHERE ta.id = a_id AND e.user_id = NEW.user_id AND ta.course_id = NEW.course_id
       AND ta.status IN ('ASSIGNED','IN_PROGRESS','OVERDUE')
  ) THEN
    a_id := NULL;
    SELECT ta.id INTO a_id
      FROM training_assignments ta
      JOIN employees e ON e.id = ta.employee_id
     WHERE ta.tenant_id = NEW.tenant_id AND e.user_id = NEW.user_id AND ta.course_id = NEW.course_id
       AND ta.status IN ('ASSIGNED', 'IN_PROGRESS', 'OVERDUE')
     LIMIT 1;
  END IF;
  IF a_id IS NULL THEN
    RETURN NULL;
  END IF;
  IF NEW.status = 'COMPLETED' THEN
    UPDATE training_assignments SET status = 'COMPLETED', completed_at = NEW.completed_at
     WHERE id = a_id AND status IN ('ASSIGNED', 'IN_PROGRESS', 'OVERDUE');
  ELSIF NEW.status IN ('IN_PROGRESS', 'AWAITING_ASSESSMENT', 'FAILED') THEN
    UPDATE training_assignments SET status = 'IN_PROGRESS' WHERE id = a_id AND status = 'ASSIGNED';
  END IF;
  RETURN NULL;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS enrollments_sync_assignment ON enrollments;
--> statement-breakpoint
CREATE TRIGGER enrollments_sync_assignment AFTER INSERT OR UPDATE OF status ON enrollments
  FOR EACH ROW EXECUTE FUNCTION enrollments_sync_assignment();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Learning records: facility/team-aware visibility (replaces Phase 2/3 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS own_read ON enrollments;
--> statement-breakpoint
CREATE POLICY own_read ON enrollments AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user()
  OR (SELECT app_has_tenant_permission('training.view_all'))
  OR (SELECT app_has_tenant_permission('assessments.grade'))
  OR app_can_access_user(ARRAY['training.view_all','training.assign','assessments.grade'], user_id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_insert ON enrollments;
--> statement-breakpoint
CREATE POLICY own_insert ON enrollments AS RESTRICTIVE FOR INSERT WITH CHECK (
  user_id = app_current_user() OR app_can_access_user(ARRAY['training.assign'], user_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_update ON enrollments;
--> statement-breakpoint
CREATE POLICY own_update ON enrollments AS RESTRICTIVE FOR UPDATE USING (
  user_id = app_current_user() OR app_can_access_user(ARRAY['training.assign'], user_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_delete ON enrollments;
--> statement-breakpoint
CREATE POLICY own_delete ON enrollments AS RESTRICTIVE FOR DELETE USING (app_can_access_user(ARRAY['training.assign'], user_id));
--> statement-breakpoint

DROP POLICY IF EXISTS own_read ON lesson_progress;
--> statement-breakpoint
CREATE POLICY own_read ON lesson_progress AS RESTRICTIVE FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments e WHERE e.id = enrollment_id)
);
--> statement-breakpoint

DROP POLICY IF EXISTS own_read ON examination_attempts;
--> statement-breakpoint
CREATE POLICY own_read ON examination_attempts AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user()
  OR (SELECT app_has_tenant_permission('assessments.grade'))
  OR (SELECT app_has_tenant_permission('training.view_all'))
  OR app_can_access_user(ARRAY['training.view_all','assessments.grade'], user_id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS own_read ON examination_answers;
--> statement-breakpoint
CREATE POLICY own_read ON examination_answers AS RESTRICTIVE FOR SELECT USING (
  EXISTS (SELECT 1 FROM examination_attempts a WHERE a.id = attempt_id)
);
--> statement-breakpoint

DROP POLICY IF EXISTS own_read ON certificates;
--> statement-breakpoint
CREATE POLICY own_read ON certificates AS RESTRICTIVE FOR SELECT USING (
  user_id = app_current_user()
  OR (SELECT app_has_tenant_permission('certificates.view_all'))
  OR app_can_access_user(ARRAY['certificates.view_all'], user_id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON certificates;
--> statement-breakpoint
CREATE POLICY perm_update ON certificates AS RESTRICTIVE FOR UPDATE USING (
  (SELECT app_has_tenant_permission('certificates.revoke'))
  OR app_can_access_user(ARRAY['certificates.revoke'], user_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_read ON certificate_verifications;
--> statement-breakpoint
CREATE POLICY perm_read ON certificate_verifications AS RESTRICTIVE FOR SELECT USING (
  ((SELECT app_has_permission('certificates.view_all')) OR (SELECT app_has_permission('team.view')))
  AND EXISTS (SELECT 1 FROM certificates c WHERE c.id = certificate_id)
);
--> statement-breakpoint

DROP POLICY IF EXISTS own_read ON competency_assessments;
--> statement-breakpoint
CREATE POLICY own_read ON competency_assessments AS RESTRICTIVE FOR SELECT USING (
  evaluator_user_id = app_current_user()
  OR EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND e.user_id = app_current_user())
  OR (SELECT app_has_tenant_permission('competency.view'))
  OR app_can_access_employee(ARRAY['competency.view'], employee_id, true)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON competency_assessments;
--> statement-breakpoint
-- Evaluators may record skills only at facilities in their scope and only for
-- employees visible to them (a Supervisor: direct reports).
CREATE POLICY perm_insert ON competency_assessments AS RESTRICTIVE FOR INSERT WITH CHECK (
  app_has_permission_at('competency.evaluate', facility_id)
  AND EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id)
);
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- New Phase 4 tables
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS own_read ON onboarding_runs;
--> statement-breakpoint
CREATE POLICY own_read ON onboarding_runs AS RESTRICTIVE FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON onboarding_runs;
--> statement-breakpoint
CREATE POLICY perm_insert ON onboarding_runs AS RESTRICTIVE FOR INSERT WITH CHECK (
  app_can_access_employee(ARRAY['training.assign','employees.manage'], employee_id)
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON onboarding_runs;
--> statement-breakpoint
CREATE POLICY perm_update ON onboarding_runs AS RESTRICTIVE FOR UPDATE USING (false);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON onboarding_runs;
--> statement-breakpoint
CREATE POLICY perm_delete ON onboarding_runs AS RESTRICTIVE FOR DELETE USING (false);
--> statement-breakpoint

DROP POLICY IF EXISTS perm_read ON announcements;
--> statement-breakpoint
CREATE POLICY perm_read ON announcements AS RESTRICTIVE FOR SELECT USING (
  author_id = app_current_user() OR (SELECT app_has_permission('notifications.announce'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON announcements;
--> statement-breakpoint
CREATE POLICY perm_insert ON announcements AS RESTRICTIVE FOR INSERT WITH CHECK (
  author_id = app_current_user() AND (SELECT app_has_permission('notifications.announce'))
);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON announcements;
--> statement-breakpoint
CREATE POLICY perm_update ON announcements AS RESTRICTIVE FOR UPDATE USING (false);
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON announcements;
--> statement-breakpoint
CREATE POLICY perm_delete ON announcements AS RESTRICTIVE FOR DELETE USING (false);
--> statement-breakpoint

DROP POLICY IF EXISTS own_all ON user_notification_settings;
--> statement-breakpoint
CREATE POLICY own_all ON user_notification_settings AS RESTRICTIVE FOR ALL
  USING (user_id = app_current_user()) WITH CHECK (user_id = app_current_user());
--> statement-breakpoint

-- Notifications are private to their recipient (others may create them).
DROP POLICY IF EXISTS own_read ON notifications;
--> statement-breakpoint
CREATE POLICY own_read ON notifications AS RESTRICTIVE FOR SELECT USING (user_id = app_current_user());
--> statement-breakpoint
DROP POLICY IF EXISTS own_update ON notifications;
--> statement-breakpoint
CREATE POLICY own_update ON notifications AS RESTRICTIVE FOR UPDATE USING (user_id = app_current_user());
--> statement-breakpoint
DROP POLICY IF EXISTS own_delete ON notifications;
--> statement-breakpoint
CREATE POLICY own_delete ON notifications AS RESTRICTIVE FOR DELETE USING (user_id = app_current_user());
--> statement-breakpoint

-- INSERT ... ON CONFLICT must pass the SELECT policy, which a sender cannot (the
-- row belongs to the recipient). Notifications are therefore created through this
-- narrow SECURITY DEFINER entry point: application connections may only target
-- active members of the current tenant; dedupe keys prevent duplicates.
CREATE OR REPLACE FUNCTION app_insert_notifications(items jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  is_app boolean := session_user = 'chta_app';
  n integer;
BEGIN
  IF is_app AND app_current_tenant() IS NULL THEN
    RAISE EXCEPTION 'tenant context required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO notifications (tenant_id, user_id, type, channel, title, body, link, category, dedupe_key)
  SELECT (i->>'tenantId')::uuid, (i->>'userId')::uuid, i->>'type', 'IN_APP', i->>'title', i->>'body',
         nullif(i->>'link', ''), coalesce(i->>'category', 'critical'), nullif(i->>'dedupeKey', '')
    FROM jsonb_array_elements(items) i
   WHERE NOT is_app
      OR ((i->>'tenantId')::uuid = app_current_tenant()
          AND EXISTS (SELECT 1 FROM memberships m WHERE m.tenant_id = app_current_tenant()
                       AND m.user_id = (i->>'userId')::uuid AND m.status = 'ACTIVE'))
  ON CONFLICT (tenant_id, dedupe_key) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_insert_notifications(jsonb) TO chta_app, chta_system;
--> statement-breakpoint

-- Email fan-out: organization switch, then the recipient's category choices.
-- 'critical' (expiration, overdue, compliance, escalation) is not user-mutable.
CREATE OR REPLACE FUNCTION notifications_enqueue_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  org_enabled boolean;
  s record;
  addr text;
  ustatus text;
BEGIN
  IF NEW.category = 'none' OR NEW.channel <> 'IN_APP' THEN
    RETURN NULL;
  END IF;
  SELECT email_enabled INTO org_enabled FROM notification_preferences WHERE tenant_id = NEW.tenant_id;
  IF org_enabled IS FALSE THEN
    RETURN NULL;
  END IF;
  SELECT * INTO s FROM user_notification_settings WHERE tenant_id = NEW.tenant_id AND user_id = NEW.user_id;
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
  INSERT INTO email_outbox (tenant_id, user_id, notification_id, to_email, subject, body, link)
  VALUES (NEW.tenant_id, NEW.user_id, NEW.id, addr, NEW.title, NEW.body, NEW.link);
  RETURN NULL;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS notifications_enqueue_email ON notifications;
--> statement-breakpoint
CREATE TRIGGER notifications_enqueue_email AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notifications_enqueue_email();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- chta_apply_security() v4: platform-only tables get no application grants.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments'];
  platform_only text[] := ARRAY['email_outbox'];
  narrowed jsonb := '{"certificates": "SELECT, UPDATE", "course_approvals": "SELECT, INSERT", "certificate_verifications": "SELECT", "onboarding_runs": "SELECT, INSERT", "announcements": "SELECT, INSERT"}';
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
