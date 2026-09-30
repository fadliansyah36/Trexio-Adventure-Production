-- Mission 10C: tenant ownership foreign keys
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
