CREATE TABLE "course_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid,
	"course_id" uuid NOT NULL,
	"seats_total" integer NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_entitlements_seats_ck" CHECK (seats_total >= 0)
);
--> statement-breakpoint
CREATE TABLE "course_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"course_id" uuid,
	"package_id" uuid,
	"item_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"promo_code_id" uuid,
	"promo_code" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"payment_method" text NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp with time zone,
	"refunded_cents" integer DEFAULT 0 NOT NULL,
	"refund_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_orders_stripeSessionId_unique" UNIQUE("stripe_session_id"),
	CONSTRAINT "course_orders_item_ck" CHECK ((item_type = 'COURSE' and course_id is not null) or (item_type = 'PACKAGE' and package_id is not null)),
	CONSTRAINT "course_orders_status_ck" CHECK (status in ('PENDING','PAID','PARTIALLY_REFUNDED','REFUNDED','CANCELLED')),
	CONSTRAINT "course_orders_method_ck" CHECK (payment_method in ('STRIPE','INVOICE','MANUAL','FREE')),
	CONSTRAINT "course_orders_amounts_ck" CHECK (quantity between 1 and 10000 and total_cents = subtotal_cents - discount_cents and total_cents >= 0 and refunded_cents between 0 and total_cents)
);
--> statement-breakpoint
CREATE TABLE "course_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_prices_amount_ck" CHECK (price_cents >= 0 and price_cents <= 10000000)
);
--> statement-breakpoint
CREATE TABLE "entitlement_uses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlement_uses_enrollmentId_unique" UNIQUE("enrollment_id")
);
--> statement-breakpoint
CREATE TABLE "instructor_compensation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"instructor_id" uuid NOT NULL,
	"rate_type" text NOT NULL,
	"rate_cents" integer NOT NULL,
	"effective_from" text NOT NULL,
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instructor_compensation_instructorId_effectiveFrom_unique" UNIQUE("instructor_id","effective_from"),
	CONSTRAINT "instructor_comp_type_ck" CHECK (rate_type in ('PER_SESSION','PER_HOUR','PER_LEARNER')),
	CONSTRAINT "instructor_comp_rate_ck" CHECK (rate_cents >= 0 and rate_cents <= 10000000),
	CONSTRAINT "instructor_comp_date_ck" CHECK (effective_from ~ '^\d{4}-\d{2}-\d{2}$')
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"percent_off" integer,
	"amount_off_cents" integer,
	"max_redemptions" integer,
	"redeemed_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"course_id" uuid,
	"package_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "promo_codes_one_discount_ck" CHECK ((percent_off is null) <> (amount_off_cents is null)),
	CONSTRAINT "promo_codes_percent_ck" CHECK (percent_off is null or (percent_off between 1 and 100)),
	CONSTRAINT "promo_codes_amount_ck" CHECK (amount_off_cents is null or amount_off_cents > 0),
	CONSTRAINT "promo_codes_uppercase_ck" CHECK (code = upper(code))
);
--> statement-breakpoint
CREATE TABLE "training_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"audience" text,
	"course_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"price_cents" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_packages_code_unique" UNIQUE("code"),
	CONSTRAINT "training_packages_amount_ck" CHECK (price_cents >= 0 and price_cents <= 100000000)
);
--> statement-breakpoint
ALTER TABLE "course_entitlements" ADD CONSTRAINT "course_entitlements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_entitlements" ADD CONSTRAINT "course_entitlements_order_id_course_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."course_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_entitlements" ADD CONSTRAINT "course_entitlements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_orders" ADD CONSTRAINT "course_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_orders" ADD CONSTRAINT "course_orders_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_orders" ADD CONSTRAINT "course_orders_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_orders" ADD CONSTRAINT "course_orders_package_id_training_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."training_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_orders" ADD CONSTRAINT "course_orders_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prices" ADD CONSTRAINT "course_prices_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_uses" ADD CONSTRAINT "entitlement_uses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_uses" ADD CONSTRAINT "entitlement_uses_entitlement_id_course_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."course_entitlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_compensation" ADD CONSTRAINT "instructor_compensation_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_package_id_training_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."training_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_entitlements_tenant_id_course_id_index" ON "course_entitlements" USING btree ("tenant_id","course_id");--> statement-breakpoint
CREATE INDEX "course_orders_tenant_id_created_at_index" ON "course_orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "course_prices_course_id_index" ON "course_prices" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_prices_one_active_uq" ON "course_prices" USING btree ("course_id") WHERE is_active;--> statement-breakpoint
CREATE INDEX "entitlement_uses_entitlement_id_index" ON "entitlement_uses" USING btree ("entitlement_id");--> statement-breakpoint
CREATE INDEX "instructor_compensation_tenant_id_index" ON "instructor_compensation" USING btree ("tenant_id");

--> statement-breakpoint
-- Seat capacity: an entitlement can never be used by more enrollments than seats paid for,
-- and expired or revoked entitlements cannot be used.
CREATE OR REPLACE FUNCTION entitlement_uses_capacity() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  e course_entitlements%ROWTYPE;
  used integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.entitlement_id::text, 0));
  SELECT * INTO e FROM course_entitlements WHERE id = NEW.entitlement_id;
  IF NOT FOUND OR e.tenant_id <> NEW.tenant_id THEN
    RAISE EXCEPTION 'entitlement not found for this organization';
  END IF;
  IF e.revoked_at IS NOT NULL OR (e.expires_at IS NOT NULL AND e.expires_at < now()) THEN
    RAISE EXCEPTION 'entitlement is expired or revoked';
  END IF;
  SELECT count(*) INTO used FROM entitlement_uses WHERE entitlement_id = NEW.entitlement_id;
  IF used >= e.seats_total THEN
    RAISE EXCEPTION 'no seats remaining on this entitlement';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER entitlement_uses_capacity BEFORE INSERT ON entitlement_uses
  FOR EACH ROW EXECUTE FUNCTION entitlement_uses_capacity();
--> statement-breakpoint
CREATE TRIGGER course_orders_no_delete BEFORE DELETE ON course_orders FOR EACH ROW EXECUTE FUNCTION block_delete();
--> statement-breakpoint
CREATE TRIGGER entitlement_uses_no_delete BEFORE DELETE ON entitlement_uses FOR EACH ROW EXECUTE FUNCTION block_delete();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION chta_apply_security() RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
  r record;
  billing_tables text[] := ARRAY['subscriptions','invoices','payments','course_orders','course_entitlements'];
  platform_only text[] := ARRAY['email_outbox', 'billing_events', 'sms_outbox'];
  narrowed jsonb := '{"certificates": "SELECT, UPDATE", "course_approvals": "SELECT, INSERT", "certificate_verifications": "SELECT", "onboarding_runs": "SELECT, INSERT", "announcements": "SELECT, INSERT", "tenant_rule_decisions": "SELECT, INSERT", "compliance_snapshots": "SELECT", "ai_interactions": "SELECT, INSERT", "api_keys": "SELECT, INSERT, UPDATE", "files": "SELECT, INSERT, UPDATE", "entitlement_uses": "SELECT, INSERT"}';
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
  -- Published prices and packages are readable; promo codes are redeemed only by platform services.
  GRANT SELECT ON course_prices, training_packages TO chta_app;
  REVOKE ALL ON promo_codes FROM chta_app;

  -- Global identity: the app may read display columns only (never hashes/MFA secrets).
  REVOKE ALL ON users FROM chta_app;
  GRANT SELECT (id, email, first_name, last_name, status) ON users TO chta_app;

  -- Credentials and auth plumbing are platform-only.
  REVOKE ALL ON sessions, password_reset_tokens, rate_limits FROM chta_app;
END
$fn$;
--> statement-breakpoint
SELECT chta_apply_security();
--> statement-breakpoint
-- Instructor pay rates: visible to people who manage instructors or view billing; changed only by instructor managers.
DROP POLICY IF EXISTS perm_select ON instructor_compensation;
--> statement-breakpoint
CREATE POLICY perm_select ON instructor_compensation AS RESTRICTIVE FOR SELECT USING (app_has_permission('instructors.manage') OR app_has_permission('billing.view'));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_insert ON instructor_compensation;
--> statement-breakpoint
CREATE POLICY perm_insert ON instructor_compensation AS RESTRICTIVE FOR INSERT WITH CHECK (app_has_permission('instructors.manage'));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_update ON instructor_compensation;
--> statement-breakpoint
CREATE POLICY perm_update ON instructor_compensation AS RESTRICTIVE FOR UPDATE USING (app_has_permission('instructors.manage'));
--> statement-breakpoint
DROP POLICY IF EXISTS perm_delete ON instructor_compensation;
--> statement-breakpoint
CREATE POLICY perm_delete ON instructor_compensation AS RESTRICTIVE FOR DELETE USING (app_has_permission('instructors.manage'));
--> statement-breakpoint
SELECT chta_apply_security();
--> statement-breakpoint
-- Order amounts are billing data: only people who can view billing see them. Seats
-- (course_entitlements, entitlement_uses) stay readable so enrollment can check access.
DROP POLICY IF EXISTS perm_select ON course_orders;--> statement-breakpoint
CREATE POLICY perm_select ON course_orders AS RESTRICTIVE FOR SELECT USING (app_has_permission('billing.view'));
