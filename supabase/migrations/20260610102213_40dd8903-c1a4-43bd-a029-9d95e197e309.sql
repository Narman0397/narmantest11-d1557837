DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, sandbox_exec;
GRANT CREATE, USAGE ON SCHEMA public TO sandbox_exec;
GRANT ALL ON SCHEMA public TO service_role, postgres;