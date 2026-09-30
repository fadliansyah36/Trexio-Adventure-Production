-- Mission 10C: relational tenant isolation + RLS enforcement
-- Tenant keys were backfilled before this migration was committed.
-- This migration is intentionally additive and policy-only after the tenant-key cutover.

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.supabase_uid = auth.uid()::text
     OR u.uid = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_global_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE (u.supabase_uid = auth.uid()::text OR u.uid = auth.uid()::text)
      AND u.role IN ('admin', 'super_admin')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_is_global_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_global_admin() TO authenticated, service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_users_all ON public.users;
CREATE POLICY tenant_isolation_users_all
ON public.users
FOR ALL
TO authenticated
USING (
  public.current_user_is_global_admin()
  OR tenant_id = public.current_user_tenant_id()
  OR supabase_uid = auth.uid()::text
  OR uid = auth.uid()::text
)
WITH CHECK (
  public.current_user_is_global_admin()
  OR tenant_id = public.current_user_tenant_id()
  OR supabase_uid = auth.uid()::text
  OR uid = auth.uid()::text
);

DROP POLICY IF EXISTS tenant_isolation_vendors_all ON public.vendors;
CREATE POLICY tenant_isolation_vendors_all
ON public.vendors
FOR ALL
TO authenticated
USING (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id())
WITH CHECK (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_trips_all ON public.trips;
CREATE POLICY tenant_isolation_trips_all
ON public.trips
FOR ALL
TO authenticated
USING (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id())
WITH CHECK (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_bookings_all ON public.bookings;
CREATE POLICY tenant_isolation_bookings_all
ON public.bookings
FOR ALL
TO authenticated
USING (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id())
WITH CHECK (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_payments_all ON public.payment_transactions;
CREATE POLICY tenant_isolation_payments_all
ON public.payment_transactions
FOR ALL
TO authenticated
USING (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id())
WITH CHECK (public.current_user_is_global_admin() OR tenant_id = public.current_user_tenant_id());

-- Backend uses the privileged database role for authoritative persistence.
-- Keep explicit service-role policies so the application can perform controlled
-- cross-tenant platform operations while HTTP authorization remains mandatory.
DROP POLICY IF EXISTS service_role_all_users ON public.users;
CREATE POLICY service_role_all_users ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_vendors ON public.vendors;
CREATE POLICY service_role_all_vendors ON public.vendors FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_trips ON public.trips;
CREATE POLICY service_role_all_trips ON public.trips FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_bookings ON public.bookings;
CREATE POLICY service_role_all_bookings ON public.bookings FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_payment_transactions ON public.payment_transactions;
CREATE POLICY service_role_all_payment_transactions ON public.payment_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON public.users(supabase_uid);
