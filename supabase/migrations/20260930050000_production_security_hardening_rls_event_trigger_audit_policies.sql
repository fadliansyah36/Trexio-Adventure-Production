-- Production security hardening for the RLS event trigger and internal audit tables.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

DROP POLICY IF EXISTS service_role_all_booking_reconciliation_audit ON public.booking_reconciliation_audit;
CREATE POLICY service_role_all_booking_reconciliation_audit
  ON public.booking_reconciliation_audit
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_legacy_booking_payment_retirement_gate ON public.legacy_booking_payment_retirement_gate;
CREATE POLICY service_role_all_legacy_booking_payment_retirement_gate
  ON public.legacy_booking_payment_retirement_gate
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
