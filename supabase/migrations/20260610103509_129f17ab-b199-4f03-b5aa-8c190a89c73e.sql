GRANT USAGE ON SCHEMA public TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public._lovable_exec_sql(text) TO sandbox_exec;
CREATE OR REPLACE FUNCTION public._lovable_exec_sql(_sql text) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER AS $f$ BEGIN EXECUTE _sql; END $f$;
GRANT EXECUTE ON FUNCTION public._lovable_exec_sql(text) TO sandbox_exec;