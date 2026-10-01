-- Mission 10P.2: durable PostgreSQL backing for Backpacker domain collections.
-- These tables replace the process-local/file-backed store. Business state is JSONB for
-- compatibility during the repository cutover; tenant-aware relational normalization follows in 10P.9.
CREATE TABLE IF NOT EXISTS public.backpacker_profiles (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_profiles_updated_at_idx ON public.backpacker_profiles(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_travel_intents (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_travel_intents_updated_at_idx ON public.backpacker_travel_intents(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_journeys (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_journeys_updated_at_idx ON public.backpacker_journeys(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_journey_stops (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_journey_stops_updated_at_idx ON public.backpacker_journey_stops(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_journey_participants (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_journey_participants_updated_at_idx ON public.backpacker_journey_participants(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_journey_expenses (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_journey_expenses_updated_at_idx ON public.backpacker_journey_expenses(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_shared_rides (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_shared_rides_updated_at_idx ON public.backpacker_shared_rides(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_shared_ride_participants (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_shared_ride_participants_updated_at_idx ON public.backpacker_shared_ride_participants(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_shared_ride_requests (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_shared_ride_requests_updated_at_idx ON public.backpacker_shared_ride_requests(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_connections (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_connections_updated_at_idx ON public.backpacker_connections(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_reports (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_reports_updated_at_idx ON public.backpacker_reports(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_location_consents (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_location_consents_updated_at_idx ON public.backpacker_location_consents(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_locations (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_locations_updated_at_idx ON public.backpacker_locations(updated_at);

CREATE TABLE IF NOT EXISTS public.backpacker_assistance_requests (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backpacker_assistance_requests_updated_at_idx ON public.backpacker_assistance_requests(updated_at);


-- Server-side repository tables are not public Data API resources.
ALTER TABLE public.backpacker_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_profiles FROM anon, authenticated;
ALTER TABLE public.backpacker_travel_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_travel_intents FROM anon, authenticated;
ALTER TABLE public.backpacker_journeys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_journeys FROM anon, authenticated;
ALTER TABLE public.backpacker_journey_stops ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_journey_stops FROM anon, authenticated;
ALTER TABLE public.backpacker_journey_participants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_journey_participants FROM anon, authenticated;
ALTER TABLE public.backpacker_journey_expenses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_journey_expenses FROM anon, authenticated;
ALTER TABLE public.backpacker_shared_rides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_shared_rides FROM anon, authenticated;
ALTER TABLE public.backpacker_shared_ride_participants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_shared_ride_participants FROM anon, authenticated;
ALTER TABLE public.backpacker_shared_ride_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_shared_ride_requests FROM anon, authenticated;
ALTER TABLE public.backpacker_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_connections FROM anon, authenticated;
ALTER TABLE public.backpacker_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_reports FROM anon, authenticated;
ALTER TABLE public.backpacker_location_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_location_consents FROM anon, authenticated;
ALTER TABLE public.backpacker_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_locations FROM anon, authenticated;
ALTER TABLE public.backpacker_assistance_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.backpacker_assistance_requests FROM anon, authenticated;