-- Mission 10C: consolidate users RLS to one authoritative policy
DROP POLICY IF EXISTS tenant_isolation_users_select ON public.users;
DROP POLICY IF EXISTS tenant_isolation_users_insert ON public.users;
DROP POLICY IF EXISTS tenant_isolation_users_update ON public.users;
DROP POLICY IF EXISTS tenant_isolation_users_delete ON public.users;
