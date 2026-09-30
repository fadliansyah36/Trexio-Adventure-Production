-- Mission 10C: relational tenant keys + database RLS isolation
-- Applied to Supabase as mission_10c_tenant_isolation_rls_v2.
BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS tenant_id text;

UPDATE public.users SET tenant_id = NULLIF(data->>'tenant_id','') WHERE tenant_id IS NULL AND NULLIF(data->>'tenant_id','') IS NOT NULL;
UPDATE public.vendors SET tenant_id = NULLIF(data->>'tenant_id','') WHERE tenant_id IS NULL AND NULLIF(data->>'tenant_id','') IS NOT NULL;
UPDATE public.trips SET tenant_id = NULLIF(data->>'tenant_id','') WHERE tenant_id IS NULL AND NULLIF(data->>'tenant_id','') IS NOT NULL;
UPDATE public.bookings SET tenant_id = NULLIF(data->>'tenant_id','') WHERE tenant_id IS NULL AND NULLIF(data->>'tenant_id','') IS NOT NULL;
UPDATE public.payment_transactions SET tenant_id = NULLIF(data->>'tenant_id','') WHERE tenant_id IS NULL AND NULLIF(data->>'tenant_id','') IS NOT NULL;

UPDATE public.vendors v SET tenant_id=u.tenant_id FROM public.users u WHERE v.tenant_id IS NULL AND v.user_id=u.uid AND u.tenant_id IS NOT NULL;
UPDATE public.trips t SET tenant_id=v.tenant_id FROM public.vendors v WHERE t.tenant_id IS NULL AND t.vendor_id=v.id AND v.tenant_id IS NOT NULL;
UPDATE public.bookings b SET tenant_id=t.tenant_id FROM public.trips t WHERE b.tenant_id IS NULL AND b.trip_id=t.id AND t.tenant_id IS NOT NULL;
UPDATE public.payment_transactions p SET tenant_id=b.tenant_id FROM public.bookings b WHERE p.tenant_id IS NULL AND p.booking_code=b.booking_code AND b.tenant_id IS NOT NULL;

UPDATE public.users SET tenant_id='tenant_default' WHERE tenant_id IS NULL;
UPDATE public.vendors SET tenant_id='tenant_default' WHERE tenant_id IS NULL;
UPDATE public.trips SET tenant_id='tenant_default' WHERE tenant_id IS NULL;
UPDATE public.bookings SET tenant_id='tenant_default' WHERE tenant_id IS NULL;
UPDATE public.payment_transactions SET tenant_id='tenant_default' WHERE tenant_id IS NULL;

ALTER TABLE public.users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vendors ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.trips ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.payment_transactions ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_tenant_id_fkey;
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_tenant_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_tenant_id_fkey;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_tenant_id_fkey;

ALTER TABLE public.users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.app_tenants(id);
ALTER TABLE public.vendors ADD CONSTRAINT vendors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.app_tenants(id);
ALTER TABLE public.trips ADD CONSTRAINT trips_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.app_tenants(id);
ALTER TABLE public.bookings ADD CONSTRAINT bookings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.app_tenants(id);
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.app_tenants(id);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON public.vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON public.trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON public.payment_transactions(tenant_id);

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public
AS $$ SELECT u.tenant_id FROM public.users u WHERE u.supabase_uid=auth.uid()::text LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_user_is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public
AS $$ SELECT EXISTS (SELECT 1 FROM public.users u WHERE u.supabase_uid=auth.uid()::text AND u.role IN ('admin','super_admin')) $$;

REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM PUBLIC,anon;
REVOKE EXECUTE ON FUNCTION public.current_user_is_platform_admin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS tenant_isolation_users_select ON public.users;
DROP POLICY IF EXISTS tenant_isolation_users_insert ON public.users;
DROP POLICY IF EXISTS tenant_isolation_users_update ON public.users;
DROP POLICY IF EXISTS tenant_isolation_users_delete ON public.users;
DROP POLICY IF EXISTS tenant_isolation_vendors_all ON public.vendors;
DROP POLICY IF EXISTS tenant_isolation_trips_all ON public.trips;
DROP POLICY IF EXISTS tenant_isolation_bookings_all ON public.bookings;
DROP POLICY IF EXISTS tenant_isolation_payments_all ON public.payment_transactions;
DROP POLICY IF EXISTS tenant_isolation_app_tenants ON public.app_tenants;

CREATE POLICY tenant_isolation_users_select ON public.users FOR SELECT TO authenticated USING (supabase_uid=auth.uid()::text OR public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id());
CREATE POLICY tenant_isolation_users_insert ON public.users FOR INSERT TO authenticated WITH CHECK (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id());
CREATE POLICY tenant_isolation_users_update ON public.users FOR UPDATE TO authenticated USING (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id() OR supabase_uid=auth.uid()::text) WITH CHECK (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id() OR supabase_uid=auth.uid()::text);
CREATE POLICY tenant_isolation_users_delete ON public.users FOR DELETE TO authenticated USING (public.current_user_is_platform_admin() OR supabase_uid=auth.uid()::text);
CREATE POLICY tenant_isolation_vendors_all ON public.vendors FOR ALL TO authenticated USING (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id()) WITH CHECK (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id());
CREATE POLICY tenant_isolation_trips_all ON public.trips FOR ALL TO authenticated USING (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id()) WITH CHECK (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id());
CREATE POLICY tenant_isolation_bookings_all ON public.bookings FOR ALL TO authenticated USING (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id()) WITH CHECK (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id());
CREATE POLICY tenant_isolation_payments_all ON public.payment_transactions FOR ALL TO authenticated USING (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id()) WITH CHECK (public.current_user_is_platform_admin() OR tenant_id=public.current_user_tenant_id());
CREATE POLICY tenant_isolation_app_tenants ON public.app_tenants FOR SELECT TO authenticated USING (public.current_user_is_platform_admin() OR id=public.current_user_tenant_id());

COMMIT;
