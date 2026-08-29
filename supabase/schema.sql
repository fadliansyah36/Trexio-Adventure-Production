-- ==========================================================================
-- TREXIO SUPABASE POSTGRESQL SCHEMA DUMP / PULLED FROM LIVE DATABASE
-- Host: db.fndxxiqojmhiepidrxio.supabase.co:5432/postgres
-- Pulled at: 2026-08-29T14:16:30.855Z
-- Total Tables: 38
-- ==========================================================================

-- --- EXTENSIONS ---
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- TABLES DEFINITION ---

-- Table: _supabase_migrations
CREATE TABLE IF NOT EXISTS public._supabase_migrations (
  version varchar(255) NOT NULL,
  name text NOT NULL,
  applied_at timestamptz DEFAULT now(),
  CONSTRAINT _supabase_migrations_pkey PRIMARY KEY (version)
);

-- Table: app_advertising_campaigns
CREATE TABLE IF NOT EXISTS public.app_advertising_campaigns (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_advertising_campaigns_pkey PRIMARY KEY (id)
);

-- Table: app_advertising_packages
CREATE TABLE IF NOT EXISTS public.app_advertising_packages (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_advertising_packages_pkey PRIMARY KEY (id)
);

-- Table: app_announcements
CREATE TABLE IF NOT EXISTS public.app_announcements (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_announcements_pkey PRIMARY KEY (id)
);

-- Table: app_articles
CREATE TABLE IF NOT EXISTS public.app_articles (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_articles_pkey PRIMARY KEY (id)
);

-- Table: app_audit_logs
CREATE TABLE IF NOT EXISTS public.app_audit_logs (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_audit_logs_pkey PRIMARY KEY (id)
);

-- Table: app_billing_transactions
CREATE TABLE IF NOT EXISTS public.app_billing_transactions (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_billing_transactions_pkey PRIMARY KEY (id)
);

-- Table: app_bookings
CREATE TABLE IF NOT EXISTS public.app_bookings (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_bookings_pkey PRIMARY KEY (id)
);

-- Table: app_communities
CREATE TABLE IF NOT EXISTS public.app_communities (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_communities_pkey PRIMARY KEY (id)
);

-- Table: app_conversations
CREATE TABLE IF NOT EXISTS public.app_conversations (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_conversations_pkey PRIMARY KEY (id)
);

-- Table: app_coupons
CREATE TABLE IF NOT EXISTS public.app_coupons (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_coupons_pkey PRIMARY KEY (id)
);

-- Table: app_destinations
CREATE TABLE IF NOT EXISTS public.app_destinations (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_destinations_pkey PRIMARY KEY (id)
);

-- Table: app_homepage_config
CREATE TABLE IF NOT EXISTS public.app_homepage_config (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_homepage_config_pkey PRIMARY KEY (id)
);

-- Table: app_incidents
CREATE TABLE IF NOT EXISTS public.app_incidents (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_incidents_pkey PRIMARY KEY (id)
);

-- Table: app_master_categories
CREATE TABLE IF NOT EXISTS public.app_master_categories (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_master_categories_pkey PRIMARY KEY (id)
);

-- Table: app_master_locations
CREATE TABLE IF NOT EXISTS public.app_master_locations (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_master_locations_pkey PRIMARY KEY (id)
);

-- Table: app_master_roles
CREATE TABLE IF NOT EXISTS public.app_master_roles (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_master_roles_pkey PRIMARY KEY (id)
);

-- Table: app_messages
CREATE TABLE IF NOT EXISTS public.app_messages (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_messages_pkey PRIMARY KEY (id)
);

-- Table: app_payments
CREATE TABLE IF NOT EXISTS public.app_payments (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_payments_pkey PRIMARY KEY (id)
);

-- Table: app_rentals
CREATE TABLE IF NOT EXISTS public.app_rentals (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_rentals_pkey PRIMARY KEY (id)
);

-- Table: app_reviews
CREATE TABLE IF NOT EXISTS public.app_reviews (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_reviews_pkey PRIMARY KEY (id)
);

-- Table: app_subscription_plans
CREATE TABLE IF NOT EXISTS public.app_subscription_plans (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_subscription_plans_pkey PRIMARY KEY (id)
);

-- Table: app_tenant_subscriptions
CREATE TABLE IF NOT EXISTS public.app_tenant_subscriptions (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_tenant_subscriptions_pkey PRIMARY KEY (id)
);

-- Table: app_tenants
CREATE TABLE IF NOT EXISTS public.app_tenants (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_tenants_pkey PRIMARY KEY (id)
);

-- Table: app_trips
CREATE TABLE IF NOT EXISTS public.app_trips (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_trips_pkey PRIMARY KEY (id)
);

-- Table: app_vendors
CREATE TABLE IF NOT EXISTS public.app_vendors (
  id text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT app_vendors_pkey PRIMARY KEY (id)
);

-- Table: bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id integer DEFAULT nextval('bookings_id_seq'::regclass) NOT NULL,
  booking_code text NOT NULL,
  user_id integer,
  vendor_id varchar(100),
  trip_id integer,
  total_amount numeric NOT NULL,
  payment_status text DEFAULT 'pending'::text,
  booking_status text DEFAULT 'pending_payment'::text,
  payment_method text,
  payment_channel text,
  midtrans_order_id text,
  midtrans_token text,
  paid_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id)
);

-- Table: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id varchar(100) NOT NULL,
  user_id varchar(100) NOT NULL,
  user_name text,
  vendor_id varchar(100) NOT NULL,
  vendor_name text,
  product_id text,
  product_title text,
  booking_id text,
  booking_code text,
  last_message text,
  status varchar(50) DEFAULT 'active'::character varying,
  unread_user_count integer DEFAULT 0,
  unread_vendor_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

-- Table: journeys
CREATE TABLE IF NOT EXISTS public.journeys (
  id varchar(100) NOT NULL,
  creator_id varchar(100) NOT NULL,
  title text NOT NULL,
  destination text NOT NULL,
  start_date date,
  end_date date,
  status varchar(50) DEFAULT 'active'::character varying,
  created_at timestamp DEFAULT now(),
  CONSTRAINT journeys_pkey PRIMARY KEY (id)
);

-- Table: messages
CREATE TABLE IF NOT EXISTS public.messages (
  id varchar(100) NOT NULL,
  conversation_id varchar(100) NOT NULL,
  sender_id varchar(100) NOT NULL,
  sender_role varchar(50) DEFAULT 'user'::character varying,
  sender_name text,
  text text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- Table: news
CREATE TABLE IF NOT EXISTS public.news (
  id varchar(100) NOT NULL,
  title text NOT NULL,
  slug text,
  content text NOT NULL,
  author text DEFAULT 'Admin TREXIO'::text,
  category varchar(50) DEFAULT 'Umum'::character varying,
  published boolean DEFAULT true,
  published_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  CONSTRAINT news_pkey PRIMARY KEY (id)
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id varchar(100) NOT NULL,
  recipient_id varchar(100) NOT NULL,
  recipient_role varchar(50) DEFAULT 'user'::character varying,
  title text NOT NULL,
  message text NOT NULL,
  type varchar(50) DEFAULT 'info'::character varying,
  read boolean DEFAULT false,
  link text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Table: payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id integer DEFAULT nextval('payment_transactions_id_seq'::regclass) NOT NULL,
  tx_id text NOT NULL,
  booking_code text NOT NULL,
  order_id text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending'::text,
  payment_type text,
  transaction_id text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id)
);

-- Table: rides
CREATE TABLE IF NOT EXISTS public.rides (
  id varchar(100) NOT NULL,
  creator_id varchar(100) NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  departure_time timestamp,
  total_seats integer DEFAULT 4,
  available_seats integer DEFAULT 4,
  price_per_seat numeric DEFAULT 0,
  status varchar(50) DEFAULT 'active'::character varying,
  created_at timestamp DEFAULT now(),
  CONSTRAINT rides_pkey PRIMARY KEY (id)
);

-- Table: travel_intents
CREATE TABLE IF NOT EXISTS public.travel_intents (
  id varchar(100) NOT NULL,
  user_id varchar(100) NOT NULL,
  destination text NOT NULL,
  travel_date date,
  budget numeric,
  activities ARRAY,
  status varchar(50) DEFAULT 'active'::character varying,
  created_at timestamp DEFAULT now(),
  CONSTRAINT travel_intents_pkey PRIMARY KEY (id)
);

-- Table: trips
CREATE TABLE IF NOT EXISTS public.trips (
  id integer DEFAULT nextval('trips_id_seq'::regclass) NOT NULL,
  title text NOT NULL,
  destination text NOT NULL,
  price numeric NOT NULL,
  duration_days integer DEFAULT 1,
  available_seats integer DEFAULT 10,
  category text,
  vendor_id varchar(100),
  slug text,
  status varchar(50) DEFAULT 'published'::character varying,
  cover_image text,
  description text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT trips_pkey PRIMARY KEY (id)
);

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
  uid text NOT NULL,
  email text NOT NULL,
  name text,
  role text DEFAULT 'user'::text,
  created_at timestamp DEFAULT now(),
  supabase_uid text,
  data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Table: vendors
CREATE TABLE IF NOT EXISTS public.vendors (
  id varchar(100) NOT NULL,
  user_id varchar(100),
  brand_name text NOT NULL,
  slug text,
  status varchar(50) DEFAULT 'active'::character varying,
  rating numeric DEFAULT 5.0,
  total_trips integer DEFAULT 0,
  documents jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);

-- --- INDEXES ---

CREATE UNIQUE INDEX bookings_booking_code_key ON public.bookings USING btree (booking_code);
CREATE INDEX idx_bookings_booking_code ON public.bookings USING btree (booking_code);
CREATE INDEX idx_bookings_payment_status ON public.bookings USING btree (payment_status);
CREATE INDEX idx_bookings_trip_id ON public.bookings USING btree (trip_id);
CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);
CREATE INDEX idx_bookings_vendor_id ON public.bookings USING btree (vendor_id);
CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);
CREATE INDEX idx_conversations_vendor_id ON public.conversations USING btree (vendor_id);
CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);
CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id, recipient_role);
CREATE INDEX idx_payment_tx_booking_code ON public.payment_transactions USING btree (booking_code);
CREATE INDEX idx_payment_tx_order_id ON public.payment_transactions USING btree (order_id);
CREATE UNIQUE INDEX payment_transactions_tx_id_key ON public.payment_transactions USING btree (tx_id);
CREATE INDEX idx_trips_destination ON public.trips USING btree (destination);
CREATE INDEX idx_trips_status ON public.trips USING btree (status);
CREATE INDEX idx_trips_vendor_id ON public.trips USING btree (vendor_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE INDEX idx_users_supabase_uid ON public.users USING btree (supabase_uid);
CREATE UNIQUE INDEX users_uid_key ON public.users USING btree (uid);
CREATE INDEX idx_vendors_status ON public.vendors USING btree (status);
CREATE INDEX idx_vendors_user_id ON public.vendors USING btree (user_id);

-- --- ROW LEVEL SECURITY (RLS) ---

ALTER TABLE public._supabase_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_advertising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_advertising_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_homepage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_master_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_master_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_master_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- --- POLICIES ---

CREATE POLICY "service_role_all__supabase_migrations" ON public._supabase_migrations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_advertising_campaigns" ON public.app_advertising_campaigns
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_advertising_packages" ON public.app_advertising_packages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_announcements" ON public.app_announcements
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_articles" ON public.app_articles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_audit_logs" ON public.app_audit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_billing_transactions" ON public.app_billing_transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_bookings" ON public.app_bookings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_communities" ON public.app_communities
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_conversations" ON public.app_conversations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_coupons" ON public.app_coupons
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_destinations" ON public.app_destinations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_homepage_config" ON public.app_homepage_config
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_incidents" ON public.app_incidents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_master_categories" ON public.app_master_categories
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_master_locations" ON public.app_master_locations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_master_roles" ON public.app_master_roles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_messages" ON public.app_messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_payments" ON public.app_payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_rentals" ON public.app_rentals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_reviews" ON public.app_reviews
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_subscription_plans" ON public.app_subscription_plans
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_tenant_subscriptions" ON public.app_tenant_subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_tenants" ON public.app_tenants
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_trips" ON public.app_trips
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_app_vendors" ON public.app_vendors
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_bookings" ON public.bookings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_conversations" ON public.conversations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_journeys" ON public.journeys
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_messages" ON public.messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_news" ON public.news
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_notifications" ON public.notifications
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_payment_transactions" ON public.payment_transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_rides" ON public.rides
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_travel_intents" ON public.travel_intents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_trips" ON public.trips
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_users" ON public.users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY "service_role_all_vendors" ON public.vendors
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

