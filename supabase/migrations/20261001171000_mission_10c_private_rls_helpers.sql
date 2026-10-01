-- Mission 10C: move SECURITY DEFINER RLS helpers into a private schema
-- Supabase recommends keeping SECURITY DEFINER helpers out of exposed schemas.
-- The helpers remain callable by authenticated/service_role only because RLS
-- policies execute them on behalf of authenticated requests.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.current_user_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.supabase_uid = auth.uid()::text
     OR u.uid = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.current_user_is_global_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE (u.supabase_uid = auth.uid()::text OR u.uid = auth.uid()::text)
      AND u.role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.current_user_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_user_is_global_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_user_is_global_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS tenant_isolation_users_all ON public.users;
CREATE POLICY tenant_isolation_users_all ON public.users
FOR ALL TO authenticated
USING (
  (SELECT private.current_user_is_global_admin())
  OR tenant_id = (SELECT private.current_user_tenant_id())
  OR supabase_uid = auth.uid()::text
  OR uid = auth.uid()::text
)
WITH CHECK (
  (SELECT private.current_user_is_global_admin())
  OR tenant_id = (SELECT private.current_user_tenant_id())
  OR supabase_uid = auth.uid()::text
  OR uid = auth.uid()::text
);

DROP POLICY IF EXISTS tenant_isolation_vendors_all ON public.vendors;
CREATE POLICY tenant_isolation_vendors_all ON public.vendors
FOR ALL TO authenticated
USING ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()))
WITH CHECK ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()));

DROP POLICY IF EXISTS tenant_isolation_trips_all ON public.trips;
CREATE POLICY tenant_isolation_trips_all ON public.trips
FOR ALL TO authenticated
USING ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()))
WITH CHECK ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()));

DROP POLICY IF EXISTS tenant_isolation_bookings_all ON public.bookings;
CREATE POLICY tenant_isolation_bookings_all ON public.bookings
FOR ALL TO authenticated
USING ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()))
WITH CHECK ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()));

DROP POLICY IF EXISTS tenant_isolation_payments_all ON public.payment_transactions;
CREATE POLICY tenant_isolation_payments_all ON public.payment_transactions
FOR ALL TO authenticated
USING ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()))
WITH CHECK ((SELECT private.current_user_is_global_admin()) OR tenant_id = (SELECT private.current_user_tenant_id()));

DROP POLICY IF EXISTS tenant_isolation_app_tenants ON public.app_tenants;
CREATE POLICY tenant_isolation_app_tenants ON public.app_tenants
FOR SELECT TO authenticated
USING ((SELECT private.current_user_is_global_admin()) OR id = (SELECT private.current_user_tenant_id()));

DROP FUNCTION IF EXISTS public.current_user_tenant_id();
DROP FUNCTION IF EXISTS public.current_user_is_global_admin();
DROP FUNCTION IF EXISTS public.current_user_is_platform_admin();
