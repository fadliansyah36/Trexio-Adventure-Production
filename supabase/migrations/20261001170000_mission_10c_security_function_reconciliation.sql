-- Mission 10C: reconcile tenant security helper functions
-- Replace the legacy platform-admin helper with the canonical global-admin helper
-- and keep the SECURITY DEFINER helpers restricted to authenticated/service_role.
-- The helpers are intentionally SECURITY DEFINER because they read public.users
-- from RLS policies; direct EXECUTE by anon/PUBLIC is revoked.

DROP POLICY IF EXISTS tenant_isolation_app_tenants ON public.app_tenants;

CREATE POLICY tenant_isolation_app_tenants
ON public.app_tenants
FOR SELECT
TO authenticated
USING (
  public.current_user_is_global_admin()
  OR id = public.current_user_tenant_id()
);

DROP FUNCTION IF EXISTS public.current_user_is_platform_admin();

REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_is_global_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_global_admin() TO authenticated, service_role;
