-- ==============================================================================
-- TREXIO MISSION 08D — LEGACY BOOKING/PAYMENT TABLE RETIREMENT GATE
-- Non-destructive gate; legacy tables are not dropped.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.legacy_booking_payment_retirement_gate (
  id BIGSERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_legacy_rows BIGINT NOT NULL,
  booking_relational_rows BIGINT NOT NULL,
  booking_unmatched_rows BIGINT NOT NULL,
  payment_legacy_rows BIGINT NOT NULL,
  payment_relational_rows BIGINT NOT NULL,
  payment_unmatched_rows BIGINT NOT NULL,
  dependency_count BIGINT NOT NULL,
  retirement_status TEXT NOT NULL,
  blocking_reasons JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_legacy_retirement_gate_checked_at
  ON public.legacy_booking_payment_retirement_gate(checked_at DESC);

WITH
booking_stats AS (
  SELECT
    (SELECT COUNT(*) FROM public.app_bookings) AS legacy_rows,
    (SELECT COUNT(*) FROM public.bookings) AS relational_rows,
    (SELECT COUNT(*)
       FROM public.app_bookings l
       LEFT JOIN public.bookings r
         ON r.booking_code = l.data->>'booking_code'
        OR r.external_id = l.data->>'id'
      WHERE r.id IS NULL) AS unmatched_rows
),
payment_stats AS (
  SELECT
    (SELECT COUNT(*) FROM public.app_payments) AS legacy_rows,
    (SELECT COUNT(*) FROM public.payment_transactions) AS relational_rows,
    (SELECT COUNT(*)
       FROM public.app_payments l
       LEFT JOIN public.payment_transactions r
         ON r.tx_id = COALESCE(NULLIF(l.data->>'tx_id',''), NULLIF(l.data->>'payment_id',''), l.id)
      WHERE r.id IS NULL) AS unmatched_rows
),
dependency_stats AS (
  SELECT COUNT(*)::BIGINT AS dependency_count
  FROM pg_depend d
  JOIN pg_class target ON target.oid = d.refobjid
  JOIN pg_namespace tn ON tn.oid = target.relnamespace
  WHERE tn.nspname = 'public'
    AND target.relname IN ('app_bookings', 'app_payments')
    AND d.deptype NOT IN ('i', 'a')
    AND NOT (d.classid = 'pg_class'::regclass AND d.objid = target.oid)
),
gate AS (
  SELECT
    b.legacy_rows AS booking_legacy_rows,
    b.relational_rows AS booking_relational_rows,
    b.unmatched_rows AS booking_unmatched_rows,
    p.legacy_rows AS payment_legacy_rows,
    p.relational_rows AS payment_relational_rows,
    p.unmatched_rows AS payment_unmatched_rows,
    d.dependency_count,
    CASE
      WHEN b.unmatched_rows > 0 OR p.unmatched_rows > 0 THEN 'BLOCKED'
      WHEN b.legacy_rows > 0 OR p.legacy_rows > 0 THEN 'BLOCKED'
      WHEN d.dependency_count > 0 THEN 'BLOCKED'
      ELSE 'READY_FOR_RETIREMENT'
    END AS retirement_status,
    jsonb_build_object(
      'legacy_booking_rows_present', b.legacy_rows > 0,
      'legacy_payment_rows_present', p.legacy_rows > 0,
      'unmatched_booking_rows_present', b.unmatched_rows > 0,
      'unmatched_payment_rows_present', p.unmatched_rows > 0,
      'database_dependencies_present', d.dependency_count > 0
    ) AS blocking_reasons
  FROM booking_stats b, payment_stats p, dependency_stats d
)
INSERT INTO public.legacy_booking_payment_retirement_gate (
  booking_legacy_rows, booking_relational_rows, booking_unmatched_rows,
  payment_legacy_rows, payment_relational_rows, payment_unmatched_rows,
  dependency_count, retirement_status, blocking_reasons
)
SELECT
  booking_legacy_rows, booking_relational_rows, booking_unmatched_rows,
  payment_legacy_rows, payment_relational_rows, payment_unmatched_rows,
  dependency_count, retirement_status, blocking_reasons
FROM gate;
