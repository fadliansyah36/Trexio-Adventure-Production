-- ==============================================================================
-- TREXIO OUTDOOR PLATFORM - V3 DATABASE MIGRATION
-- Migration Name: V3_trexio_migration
-- Target: Supabase PostgreSQL (Production & Staging Environments)
-- Timestamp: 20260829000000
-- ==============================================================================

-- 1. EXTENSIONS & UTILITY FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. CORE RELATIONAL TABLES
-- ==============================================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    supabase_uid TEXT,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON public.users(supabase_uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- VENDORS TABLE
CREATE TABLE IF NOT EXISTS public.vendors (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    brand_name TEXT NOT NULL,
    slug TEXT,
    status VARCHAR(50) DEFAULT 'active',
    rating NUMERIC DEFAULT 5.0,
    total_trips INT DEFAULT 0,
    documents JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);

-- TRIPS / PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration_days INT DEFAULT 1,
    available_seats INT DEFAULT 10,
    category TEXT,
    vendor_id VARCHAR(100),
    slug TEXT,
    status VARCHAR(50) DEFAULT 'published',
    cover_image TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trips_vendor_id ON public.trips(vendor_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id SERIAL PRIMARY KEY,
    booking_code TEXT UNIQUE NOT NULL,
    user_id INT,
    vendor_id VARCHAR(100),
    trip_id INT,
    total_amount NUMERIC NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    booking_status TEXT DEFAULT 'pending_payment',
    payment_method TEXT,
    payment_channel TEXT,
    midtrans_order_id TEXT,
    midtrans_token TEXT,
    ticket_token TEXT,
    checked_in BOOLEAN DEFAULT FALSE,
    checkin_time TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_id ON public.bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id SERIAL PRIMARY KEY,
    tx_id TEXT UNIQUE NOT NULL,
    booking_code TEXT NOT NULL,
    order_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_type TEXT,
    transaction_id TEXT,
    signature_key TEXT,
    raw_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_tx_booking_code ON public.payment_transactions(booking_code);
CREATE INDEX IF NOT EXISTS idx_payment_tx_order_id ON public.payment_transactions(order_id);

-- CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    user_name TEXT,
    vendor_id VARCHAR(100) NOT NULL,
    vendor_name TEXT,
    product_id TEXT,
    product_title TEXT,
    booking_id TEXT,
    booking_code TEXT,
    last_message TEXT,
    status VARCHAR(50) DEFAULT 'active',
    unread_user_count INT DEFAULT 0,
    unread_vendor_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations(vendor_id);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(100) NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(100) NOT NULL,
    sender_role VARCHAR(50) DEFAULT 'user',
    sender_name TEXT,
    text TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(100) PRIMARY KEY,
    recipient_id VARCHAR(100) NOT NULL,
    recipient_role VARCHAR(50) DEFAULT 'user',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, recipient_role);

-- NEWS & COMMUNITY ARTICLES
CREATE TABLE IF NOT EXISTS public.news (
    id VARCHAR(100) PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin TREXIO',
    category VARCHAR(50) DEFAULT 'Umum',
    published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BACKPACKER & COMMUNITY MODULES
CREATE TABLE IF NOT EXISTS public.travel_intents (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    destination TEXT NOT NULL,
    travel_date DATE,
    budget NUMERIC,
    activities TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journeys (
    id VARCHAR(100) PRIMARY KEY,
    creator_id VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rides (
    id VARCHAR(100) PRIMARY KEY,
    creator_id VARCHAR(100) NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE,
    total_seats INT DEFAULT 4,
    available_seats INT DEFAULT 4,
    price_per_seat NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. MULTI-TENANT & JSONB DOCUMENT STORAGE TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.app_trips (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_vendors (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_bookings (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_payments (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_rentals (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_destinations (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_communities (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_coupons (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_tenants (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_announcements (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_conversations (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_messages (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_advertising_packages (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_advertising_campaigns (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_billing_transactions (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_subscription_plans (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_tenant_subscriptions (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_audit_logs (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_incidents (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_reviews (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_articles (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_homepage_config (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_master_categories (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_master_locations (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_master_roles (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & GRANTS
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.app_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_advertising_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_advertising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_homepage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_master_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_master_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_master_roles ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access across all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "service_role_all_%s" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;
