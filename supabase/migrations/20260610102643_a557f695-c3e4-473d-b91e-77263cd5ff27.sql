CREATE OR REPLACE FUNCTION public._lovable_exec_sql(_sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN EXECUTE _sql; END $$;
GRANT EXECUTE ON FUNCTION public._lovable_exec_sql(text) TO sandbox_exec, service_role, postgres;