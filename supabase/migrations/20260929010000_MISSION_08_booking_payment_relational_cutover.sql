-- ==============================================================================
-- TREXIO MISSION 08 - BOOKING & PAYMENT RELATIONAL CUTOVER
-- Timestamp: 20260929010000
-- Purpose: Promote bookings and payment_transactions to runtime canonical stores.
-- Legacy app_bookings/app_payments are preserved until parity is verified.
-- ==============================================================================

-- BOOKING RELATIONAL EXTENSIONS
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_external_id
  ON public.bookings(external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_midtrans_order_id
  ON public.bookings(midtrans_order_id);

CREATE INDEX IF NOT EXISTS idx_bookings_updated_at
  ON public.bookings(updated_at);

-- PAYMENT RELATIONAL EXTENSIONS
ALTER TABLE IF EXISTS public.payment_transactions
  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';

CREATE INDEX IF NOT EXISTS idx_payment_tx_user_id
  ON public.payment_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_tx_updated_at
  ON public.payment_transactions(updated_at);

-- ---------------------------------------------------------------------------
-- BOOKING BACKFILL / RECONCILIATION
-- Match existing relational rows by stable booking_code or external_id first.
-- No legacy rows are deleted.
-- ---------------------------------------------------------------------------
UPDATE public.bookings b
SET
  external_id = COALESCE(b.external_id, NULLIF(b.data->>'id', ''), NULLIF(a.id, '')),
  data = CASE
    WHEN jsonb_typeof(a.data) = 'object' THEN a.data
    ELSE b.data
  END,
  updated_at = NOW()
FROM public.app_bookings a
WHERE (b.booking_code = a.data->>'booking_code')
   OR (b.external_id = a.id);

INSERT INTO public.bookings (
  external_id,
  booking_code,
  user_id,
  vendor_id,
  trip_id,
  total_amount,
  payment_status,
  booking_status,
  payment_method,
  payment_channel,
  midtrans_order_id,
  midtrans_token,
  ticket_token,
  checked_in,
  checkin_time,
  paid_at,
  data,
  created_at,
  updated_at
)
SELECT
  NULLIF(a.data->>'id', ''),
  COALESCE(NULLIF(a.data->>'booking_code', ''), a.id),
  CASE
    WHEN a.data->>'user_id' ~ '^\\d+$' THEN (a.data->>'user_id')::INT
    ELSE NULL
  END,
  NULLIF(a.data->>'vendor_id', ''),
  CASE
    WHEN a.data->>'trip_id' ~ '^\\d+$' THEN (a.data->>'trip_id')::INT
    ELSE NULL
  END,
  COALESCE(NULLIF(a.data->>'total_amount', '')::NUMERIC, 0),
  COALESCE(NULLIF(a.data->>'payment_status', ''), 'pending'),
  COALESCE(NULLIF(a.data->>'booking_status', ''), 'pending_payment'),
  NULLIF(a.data->>'payment_method', ''),
  NULLIF(a.data->>'payment_channel', ''),
  NULLIF(a.data->>'midtrans_order_id', ''),
  NULLIF(a.data->>'midtrans_token', ''),
  NULLIF(a.data->>'ticket_token', ''),
  COALESCE((a.data->>'checked_in')::BOOLEAN, FALSE),
  CASE WHEN NULLIF(a.data->>'checkin_time', '') IS NOT NULL THEN (a.data->>'checkin_time')::TIMESTAMPTZ ELSE NULL END,
  CASE WHEN NULLIF(a.data->>'paid_at', '') IS NOT NULL THEN (a.data->>'paid_at')::TIMESTAMPTZ ELSE NULL END,
  a.data,
  CASE WHEN NULLIF(a.data->>'created_at', '') IS NOT NULL THEN (a.data->>'created_at')::TIMESTAMPTZ ELSE NOW() END,
  NOW()
FROM public.app_bookings a
WHERE NULLIF(a.data->>'id', '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.external_id = a.data->>'id'
       OR b.booking_code = COALESCE(NULLIF(a.data->>'booking_code', ''), a.id)
  );

-- ---------------------------------------------------------------------------
-- PAYMENT BACKFILL / RECONCILIATION
-- Canonical transaction identity is tx_id; legacy payment_id is accepted.
-- ---------------------------------------------------------------------------
UPDATE public.payment_transactions p
SET
  user_id = COALESCE(p.user_id, NULLIF(p.data->>'user_id', '')),
  payment_method = COALESCE(p.payment_method, NULLIF(p.data->>'payment_method', '')),
  currency = COALESCE(p.currency, NULLIF(p.data->>'currency', ''), 'IDR'),
  data = CASE
    WHEN jsonb_typeof(a.data) = 'object' THEN a.data
    ELSE p.data
  END,
  updated_at = NOW()
FROM public.app_payments a
WHERE p.tx_id = COALESCE(NULLIF(a.data->>'tx_id', ''), NULLIF(a.data->>'payment_id', ''), a.id)
   OR p.order_id = NULLIF(a.data->>'order_id', '');

INSERT INTO public.payment_transactions (
  tx_id,
  booking_code,
  order_id,
  amount,
  status,
  payment_type,
  transaction_id,
  signature_key,
  raw_response,
  user_id,
  payment_method,
  currency,
  data,
  created_at,
  updated_at
)
SELECT
  COALESCE(NULLIF(a.data->>'tx_id', ''), NULLIF(a.data->>'payment_id', ''), a.id),
  COALESCE(NULLIF(a.data->>'booking_code', ''), ''),
  COALESCE(NULLIF(a.data->>'order_id', ''), NULLIF(a.data->>'booking_code', ''), a.id),
  COALESCE(NULLIF(a.data->>'amount', '')::NUMERIC, 0),
  COALESCE(NULLIF(a.data->>'status', ''), NULLIF(a.data->>'payment_status', ''), 'pending'),
  NULLIF(a.data->>'payment_type', ''),
  NULLIF(a.data->>'transaction_id', ''),
  NULLIF(a.data->>'signature_key', ''),
  COALESCE(a.data->'raw_response', '{}'::jsonb),
  NULLIF(a.data->>'user_id', ''),
  NULLIF(a.data->>'payment_method', ''),
  COALESCE(NULLIF(a.data->>'currency', ''), 'IDR'),
  a.data,
  CASE WHEN NULLIF(a.data->>'created_at', '') IS NOT NULL THEN (a.data->>'created_at')::TIMESTAMPTZ ELSE NOW() END,
  NOW()
FROM public.app_payments a
WHERE NOT EXISTS (
  SELECT 1
  FROM public.payment_transactions p
  WHERE p.tx_id = COALESCE(NULLIF(a.data->>'tx_id', ''), NULLIF(a.data->>'payment_id', ''), a.id)
     OR p.order_id = COALESCE(NULLIF(a.data->>'order_id', ''), NULLIF(a.data->>'booking_code', ''), a.id)
);

-- Ensure timestamp triggers are available for future relational writes.
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER trg_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
