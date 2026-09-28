-- ==============================================================================
-- TREXIO MISSION 08G — PHYSICAL LEGACY BOOKING/PAYMENT RETIREMENT
-- Destructive migration. Authorized after Mission 08F final verification.
-- ==============================================================================

DO $$
DECLARE
  lb BIGINT; ab BIGINT; lp BIGINT; ap BIGINT;
  bm BIGINT; pm BIGINT; ext BIGINT;
BEGIN
  SELECT COUNT(*) INTO lb FROM public.app_bookings;
  SELECT COUNT(*) INTO ab FROM public.archive_app_bookings;
  SELECT COUNT(*) INTO lp FROM public.app_payments;
  SELECT COUNT(*) INTO ap FROM public.archive_app_payments;
  SELECT COUNT(*) INTO bm FROM public.app_bookings b JOIN public.archive_app_bookings a ON a.id=b.id AND a.data=b.data;
  SELECT COUNT(*) INTO pm FROM public.app_payments p JOIN public.archive_app_payments a ON a.id=p.id AND a.data=p.data;
  SELECT COUNT(*) INTO ext
  FROM pg_depend d
  JOIN pg_class c ON c.oid=d.refobjid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN ('app_bookings','app_payments')
    AND d.deptype NOT IN ('i','t')
    AND d.classid NOT IN ('pg_policy'::regclass,'pg_constraint'::regclass,'pg_attrdef'::regclass);

  IF lb <> ab OR bm <> lb THEN
    RAISE EXCEPTION 'Mission 08G blocked: booking archive parity failed';
  END IF;
  IF lp <> ap OR pm <> lp THEN
    RAISE EXCEPTION 'Mission 08G blocked: payment archive parity failed';
  END IF;
  IF ext <> 0 THEN
    RAISE EXCEPTION 'Mission 08G blocked: external dependencies remain';
  END IF;
END $$;

DROP TABLE public.app_bookings;
DROP TABLE public.app_payments;

CREATE TABLE IF NOT EXISTS public.legacy_physical_retirement_audit (
  id BIGSERIAL PRIMARY KEY,
  retired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_archive_rows BIGINT NOT NULL,
  payment_archive_rows BIGINT NOT NULL,
  relational_booking_rows BIGINT NOT NULL,
  relational_payment_rows BIGINT NOT NULL,
  booking_legacy_table_exists BOOLEAN NOT NULL,
  payment_legacy_table_exists BOOLEAN NOT NULL,
  status TEXT NOT NULL
);

ALTER TABLE public.legacy_physical_retirement_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY legacy_physical_retirement_audit_service_role_only
  ON public.legacy_physical_retirement_audit
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

INSERT INTO public.legacy_physical_retirement_audit (
  booking_archive_rows, payment_archive_rows,
  relational_booking_rows, relational_payment_rows,
  booking_legacy_table_exists, payment_legacy_table_exists, status
)
SELECT
 (SELECT COUNT(*) FROM public.archive_app_bookings),
 (SELECT COUNT(*) FROM public.archive_app_payments),
 (SELECT COUNT(*) FROM public.bookings),
 (SELECT COUNT(*) FROM public.payment_transactions),
 EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='app_bookings'),
 EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='app_payments'),
 'RETIRED';
