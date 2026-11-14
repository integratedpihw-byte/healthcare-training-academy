-- Pin search_path on every function in schema public so no caller-controlled
-- search_path can redirect unqualified names (required for trigger and
-- SECURITY DEFINER functions; flagged by Supabase lint 0011).
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f'
      AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.sig);
  END LOOP;
END $$;
--> statement-breakpoint
SELECT chta_apply_security();
