-- ==============================================================================
-- TREXIO MISSION 08E — LEGACY ARCHIVE & FINAL RETIREMENT PREPARATION
-- Non-destructive archive. Does not drop or delete live legacy tables.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.archive_app_bookings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_table TEXT NOT NULL DEFAULT 'app_bookings',
  source_migration TEXT NOT NULL DEFAULT 'mission_08e'
);

CREATE TABLE IF NOT EXISTS public.archive_app_payments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_table TEXT NOT NULL DEFAULT 'app_payments',
  source_migration TEXT NOT NULL DEFAULT 'mission_08e'
);

CREATE INDEX IF NOT EXISTS idx_archive_app_bookings_archived_at
  ON public.archive_app_bookings(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_app_payments_archived_at
  ON public.archive_app_payments(archived_at DESC);

INSERT INTO public.archive_app_bookings (id, data, updated_at)
SELECT id, data, updated_at
FROM public.app_bookings
ON CONFLICT (id) DO UPDATE
SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at, archived_at=NOW();

INSERT INTO public.archive_app_payments (id, data, updated_at)
SELECT id, data, updated_at
FROM public.app_payments
ON CONFLICT (id) DO UPDATE
SET data=EXCLUDED.data, updated_at=EXCLUDED.updated_at, archived_at=NOW();

DO $$
DECLARE
  legacy_b BIGINT;
  archive_b BIGINT;
  legacy_p BIGINT;
  archive_p BIGINT;
BEGIN
  SELECT COUNT(*) INTO legacy_b FROM public.app_bookings;
  SELECT COUNT(*) INTO archive_b FROM public.archive_app_bookings;
  SELECT COUNT(*) INTO legacy_p FROM public.app_payments;
  SELECT COUNT(*) INTO archive_p FROM public.archive_app_payments;
  IF legacy_b <> archive_b THEN
    RAISE EXCEPTION 'Mission 08E booking archive parity failed: legacy=% archive=%', legacy_b, archive_b;
  END IF;
  IF legacy_p <> archive_p THEN
    RAISE EXCEPTION 'Mission 08E payment archive parity failed: legacy=% archive=%', legacy_p, archive_p;
  END IF;
END $$;

ALTER TABLE public.archive_app_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_app_payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.legacy_archive_retirement_gate (
  id BIGSERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_archive_rows BIGINT NOT NULL,
  booking_legacy_rows BIGINT NOT NULL,
  booking_exact_matches BIGINT NOT NULL,
  payment_archive_rows BIGINT NOT NULL,
  payment_legacy_rows BIGINT NOT NULL,
  payment_exact_matches BIGINT NOT NULL,
  status TEXT NOT NULL,
  blocking_reasons JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO public.legacy_archive_retirement_gate (
  booking_archive_rows, booking_legacy_rows, booking_exact_matches,
  payment_archive_rows, payment_legacy_rows, payment_exact_matches,
  status, blocking_reasons
)
SELECT
  (SELECT COUNT(*) FROM public.archive_app_bookings),
  (SELECT COUNT(*) FROM public.app_bookings),
  (SELECT COUNT(*) FROM public.app_bookings b JOIN public.archive_app_bookings a ON a.id=b.id AND a.data=b.data),
  (SELECT COUNT(*) FROM public.archive_app_payments),
  (SELECT COUNT(*) FROM public.app_payments),
  (SELECT COUNT(*) FROM public.app_payments p JOIN public.archive_app_payments a ON a.id=p.id AND a.data=p.data),
  CASE
    WHEN (SELECT COUNT(*) FROM public.app_bookings) = (SELECT COUNT(*) FROM public.archive_app_bookings)
     AND (SELECT COUNT(*) FROM public.app_payments) = (SELECT COUNT(*) FROM public.archive_app_payments)
     AND (SELECT COUNT(*) FROM public.app_bookings b JOIN public.archive_app_bookings a ON a.id=b.id AND a.data=b.data) = (SELECT COUNT(*) FROM public.app_bookings)
     AND (SELECT COUNT(*) FROM public.app_payments p JOIN public.archive_app_payments a ON a.id=p.id AND a.data=p.data) = (SELECT COUNT(*) FROM public.app_payments)
    THEN 'ARCHIVE_READY'
    ELSE 'BLOCKED'
  END,
  jsonb_build_object(
    'archive_parity_complete',
    (SELECT COUNT(*) FROM public.app_bookings) = (SELECT COUNT(*) FROM public.archive_app_bookings)
    AND (SELECT COUNT(*) FROM public.app_payments) = (SELECT COUNT(*) FROM public.archive_app_payments)
  );
