CREATE OR REPLACE FUNCTION public._lovable_exec_sql(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
BEGIN EXECUTE sql; END; $f$;
GRANT EXECUTE ON FUNCTION public._lovable_exec_sql(text) TO authenticated, service_role, sandbox_exec;