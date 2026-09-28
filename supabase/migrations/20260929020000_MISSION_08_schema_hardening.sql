-- ==============================================================================
-- TREXIO MISSION 08 — SCHEMA HARDENING / RUNTIME ALIGNMENT
-- Purpose: align production relational schema with booking/payment repositories
-- and close Supabase security-advisor findings that are safe to remediate.
-- ==============================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS ticket_token TEXT,
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMPTZ;

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS signature_key TEXT,
  ADD COLUMN IF NOT EXISTS raw_response JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_payment_tx_transaction_id
  ON public.payment_transactions(transaction_id);

ALTER FUNCTION public.update_timestamp_column()
  SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- No legacy rows are deleted here. Parity and retirement remain separate steps.
