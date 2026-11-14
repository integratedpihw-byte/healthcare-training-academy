-- Run ONCE per environment as a superuser / admin (e.g. psql -f scripts/db/setup-roles.sql).
-- Replace the passwords with values from your secret manager. Never commit real passwords.
--   psql -v owner_pw=... -v app_pw=... -v system_pw=... -v db=chta -f scripts/db/setup-roles.sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='chta_owner')  THEN CREATE ROLE chta_owner  LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='chta_app')    THEN CREATE ROLE chta_app    LOGIN NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='chta_system') THEN CREATE ROLE chta_system LOGIN BYPASSRLS; END IF;
END $$;
-- The owner already controls its tables (it could disable RLS); BYPASSRLS lets narrowly
-- scoped SECURITY DEFINER helpers it owns evaluate access rules without policy recursion.
ALTER ROLE chta_owner  WITH LOGIN BYPASSRLS PASSWORD :'owner_pw';
ALTER ROLE chta_app    WITH LOGIN NOBYPASSRLS PASSWORD :'app_pw';
ALTER ROLE chta_system WITH LOGIN BYPASSRLS PASSWORD :'system_pw';
SELECT format('CREATE DATABASE %I OWNER chta_owner', :'db')
 WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db') \gexec
