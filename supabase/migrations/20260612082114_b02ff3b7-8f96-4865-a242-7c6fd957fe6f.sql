REVOKE EXECUTE ON FUNCTION public.is_bupati(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_executive(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_effective_permissions(uuid) FROM anon;