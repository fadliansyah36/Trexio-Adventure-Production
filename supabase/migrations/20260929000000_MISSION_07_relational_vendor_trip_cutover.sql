-- ==============================================================================
-- TREXIO MISSION 07 — RELATIONAL VENDOR/TRIP CUTOVER
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- Relational domain rows retain flexible marketplace fields in data JSONB while
-- canonical/indexed fields remain first-class columns.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS external_id TEXT;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_external_id
  ON public.trips(external_id);

CREATE INDEX IF NOT EXISTS idx_vendors_data_gin
  ON public.vendors USING GIN (data);

CREATE INDEX IF NOT EXISTS idx_trips_data_gin
  ON public.trips USING GIN (data);

-- Preserve IDs already present in the relational trips table.
UPDATE public.trips
SET external_id = id::text
WHERE external_id IS NULL;

-- Backfill vendor rows from the transitional JSONB store.
INSERT INTO public.vendors (
  id, user_id, brand_name, slug, status, rating, total_trips, documents, data
)
SELECT
  COALESCE(NULLIF(data->>'id', ''), id),
  NULLIF(data->>'user_id', ''),
  COALESCE(NULLIF(data->>'brand_name', ''), 'Mitra TREXIO'),
  NULLIF(data->>'slug', ''),
  COALESCE(NULLIF(data->>'status', ''), 'active'),
  CASE
    WHEN COALESCE(data->>'rating', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (data->>'rating')::numeric
    ELSE 5.0
  END,
  CASE
    WHEN COALESCE(data->>'total_trips', '') ~ '^[0-9]+$'
      THEN (data->>'total_trips')::int
    ELSE 0
  END,
  COALESCE(data->'documents', '{}'::jsonb),
  data
FROM public.app_vendors
WHERE NULLIF(data->>'id', '') IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  brand_name = EXCLUDED.brand_name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  rating = EXCLUDED.rating,
  total_trips = EXCLUDED.total_trips,
  documents = EXCLUDED.documents,
  data = EXCLUDED.data,
  updated_at = NOW();

-- Reconcile pre-existing relational trip rows before inserting legacy rows.
-- Some databases already contain numeric SERIAL-backed trips from an earlier
-- schema. Match them by stable marketplace fields instead of creating duplicates.
UPDATE public.trips AS t
SET
  external_id = a.data->>'id',
  title = COALESCE(NULLIF(a.data->>'title', ''), t.title),
  destination = COALESCE(NULLIF(a.data->>'destination', ''), NULLIF(a.data->>'location', ''), t.destination),
  vendor_id = COALESCE(NULLIF(a.data->>'vendor_id', ''), t.vendor_id),
  slug = COALESCE(NULLIF(a.data->>'slug', ''), t.slug),
  status = CASE
    WHEN a.data->>'published' = 'false' THEN 'draft'
    ELSE COALESCE(NULLIF(a.data->>'status', ''), t.status)
  END,
  cover_image = COALESCE(NULLIF(a.data->>'cover_image', ''), t.cover_image),
  description = COALESCE(NULLIF(a.data->>'description', ''), t.description),
  data = a.data,
  updated_at = NOW()
FROM public.app_trips AS a
WHERE NULLIF(a.data->>'id', '') IS NOT NULL
  AND t.external_id ~ '^[0-9]+INSERT INTO public.trips (
  external_id,
  title,
  destination,
  price,
  duration_days,
  available_seats,
  category,
  vendor_id,
  slug,
  status,
  cover_image,
  description,
  data
)
SELECT
  NULLIF(data->>'id', ''),
  COALESCE(NULLIF(data->>'title', ''), 'Trip TREXIO'),
  COALESCE(NULLIF(data->>'destination', ''), NULLIF(data->>'location', ''), 'Indonesia'),
  CASE
    WHEN COALESCE(data->>'price', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
      THEN (data->>'price')::numeric
    ELSE 0
  END,
  CASE
    WHEN COALESCE(data->>'duration_days', '') ~ '^[0-9]+$'
      THEN (data->>'duration_days')::int
    WHEN COALESCE(data->>'duration', '') ~ '^[0-9]+'
      THEN substring(data->>'duration' from '^[0-9]+')::int
    ELSE 1
  END,
  CASE
    WHEN COALESCE(data->>'available_seats', '') ~ '^[0-9]+$'
      THEN (data->>'available_seats')::int
    ELSE 10
  END,
  NULLIF(data->>'category', ''),
  NULLIF(data->>'vendor_id', ''),
  NULLIF(data->>'slug', ''),
  CASE
    WHEN data->>'published' = 'false' THEN 'draft'
    ELSE COALESCE(NULLIF(data->>'status', ''), 'published')
  END,
  NULLIF(data->>'cover_image', ''),
  NULLIF(data->>'description', ''),
  data
FROM public.app_trips
WHERE NULLIF(data->>'id', '') IS NOT NULL
ON CONFLICT (external_id) DO UPDATE
SET
  title = EXCLUDED.title,
  destination = EXCLUDED.destination,
  price = EXCLUDED.price,
  duration_days = EXCLUDED.duration_days,
  available_seats = EXCLUDED.available_seats,
  category = EXCLUDED.category,
  vendor_id = EXCLUDED.vendor_id,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  cover_image = EXCLUDED.cover_image,
  description = EXCLUDED.description,
  data = EXCLUDED.data,
  updated_at = NOW();

  AND t.title = COALESCE(NULLIF(a.data->>'title', ''), 'Trip TREXIO')
  AND t.destination = COALESCE(NULLIF(a.data->>'destination', ''), NULLIF(a.data->>'location', ''), 'Indonesia')
  AND NOT EXISTS (
    SELECT 1 FROM public.trips AS existing
    WHERE existing.external_id = a.data->>'id'
      AND existing.id <> t.id
  );

-- Backfill trip rows. Marketplace IDs remain stable in external_id so the
-- public API does not have to expose PostgreSQL SERIAL identifiers.
INSERT INTO public.trips (
  external_id,
  title,
  destination,
  price,
  duration_days,
  available_seats,
  category,
  vendor_id,
  slug,
  status,
  cover_image,
  description,
  data
)
SELECT
  NULLIF(data->>'id', ''),
  COALESCE(NULLIF(data->>'title', ''), 'Trip TREXIO'),
  COALESCE(NULLIF(data->>'destination', ''), NULLIF(data->>'location', ''), 'Indonesia'),
  CASE
    WHEN COALESCE(data->>'price', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
      THEN (data->>'price')::numeric
    ELSE 0
  END,
  CASE
    WHEN COALESCE(data->>'duration_days', '') ~ '^[0-9]+$'
      THEN (data->>'duration_days')::int
    WHEN COALESCE(data->>'duration', '') ~ '^[0-9]+'
      THEN substring(data->>'duration' from '^[0-9]+')::int
    ELSE 1
  END,
  CASE
    WHEN COALESCE(data->>'available_seats', '') ~ '^[0-9]+$'
      THEN (data->>'available_seats')::int
    ELSE 10
  END,
  NULLIF(data->>'category', ''),
  NULLIF(data->>'vendor_id', ''),
  NULLIF(data->>'slug', ''),
  CASE
    WHEN data->>'published' = 'false' THEN 'draft'
    ELSE COALESCE(NULLIF(data->>'status', ''), 'published')
  END,
  NULLIF(data->>'cover_image', ''),
  NULLIF(data->>'description', ''),
  data
FROM public.app_trips
WHERE NULLIF(data->>'id', '') IS NOT NULL
ON CONFLICT (external_id) DO UPDATE
SET
  title = EXCLUDED.title,
  destination = EXCLUDED.destination,
  price = EXCLUDED.price,
  duration_days = EXCLUDED.duration_days,
  available_seats = EXCLUDED.available_seats,
  category = EXCLUDED.category,
  vendor_id = EXCLUDED.vendor_id,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  cover_image = EXCLUDED.cover_image,
  description = EXCLUDED.description,
  data = EXCLUDED.data,
  updated_at = NOW();
