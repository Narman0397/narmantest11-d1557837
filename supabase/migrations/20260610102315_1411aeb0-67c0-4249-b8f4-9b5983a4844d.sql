GRANT USAGE ON SCHEMA auth TO sandbox_exec;
GRANT REFERENCES ON auth.users TO sandbox_exec;
GRANT SELECT ON auth.users TO sandbox_exec;