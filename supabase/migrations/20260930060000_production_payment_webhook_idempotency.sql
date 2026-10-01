-- Durable Midtrans webhook idempotency and processing state.
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  event_key text PRIMARY KEY,
  order_id text NOT NULL,
  transaction_id text,
  transaction_status text,
  status text NOT NULL DEFAULT 'processing',
  attempt_count integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text
);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_payment_webhook_events ON public.payment_webhook_events;
CREATE POLICY service_role_all_payment_webhook_events
  ON public.payment_webhook_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS payment_webhook_events_order_id_idx
  ON public.payment_webhook_events (order_id);

CREATE INDEX IF NOT EXISTS payment_webhook_events_status_updated_idx
  ON public.payment_webhook_events (status, updated_at);
