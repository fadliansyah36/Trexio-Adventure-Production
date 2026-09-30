-- Mission 10C: harden tenant helper execution grants
REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_is_global_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_global_admin() TO authenticated, service_role;
