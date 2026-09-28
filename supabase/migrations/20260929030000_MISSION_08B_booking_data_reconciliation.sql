-- ==============================================================================
-- TREXIO MISSION 08B — BOOKING DATA RECONCILIATION
-- Purpose: record relational-only bookings without destructive cleanup.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.booking_reconciliation_audit (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  booking_code TEXT NOT NULL,
  classification TEXT NOT NULL,
  reason TEXT NOT NULL,
  payment_count INTEGER NOT NULL DEFAULT 0,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_reconciliation_audit_booking
  ON public.booking_reconciliation_audit(booking_id);

-- The production reconciliation is intentionally non-destructive.
-- Rows are classified by whether a matching app_bookings booking_code exists.
