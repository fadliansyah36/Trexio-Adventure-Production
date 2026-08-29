-- ==============================================================================
-- TREXIO SUPABASE POSTGRESQL SCHEMA DUMP (PULLED VIA SUPABASE DB PULL)
-- Database: db.fndxxiqojmhiepidrxio.supabase.co
-- Pulled At: 2026-08-29T12:04:58.579Z
-- Total Tables: 37
-- ==============================================================================

-- Table: public.app_advertising_campaigns (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_advertising_campaigns" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_advertising_packages (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_advertising_packages" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_announcements (Rows: 2)
CREATE TABLE IF NOT EXISTS public."app_announcements" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_articles (Rows: 2)
CREATE TABLE IF NOT EXISTS public."app_articles" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_audit_logs (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_audit_logs" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_billing_transactions (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_billing_transactions" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_bookings (Rows: 31)
CREATE TABLE IF NOT EXISTS public."app_bookings" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_communities (Rows: 2)
CREATE TABLE IF NOT EXISTS public."app_communities" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_conversations (Rows: 1)
CREATE TABLE IF NOT EXISTS public."app_conversations" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_coupons (Rows: 2)
CREATE TABLE IF NOT EXISTS public."app_coupons" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_destinations (Rows: 5)
CREATE TABLE IF NOT EXISTS public."app_destinations" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_homepage_config (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_homepage_config" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_incidents (Rows: 12)
CREATE TABLE IF NOT EXISTS public."app_incidents" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_master_categories (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_master_categories" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_master_locations (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_master_locations" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_master_roles (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_master_roles" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_messages (Rows: 1)
CREATE TABLE IF NOT EXISTS public."app_messages" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_payments (Rows: 32)
CREATE TABLE IF NOT EXISTS public."app_payments" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_rentals (Rows: 3)
CREATE TABLE IF NOT EXISTS public."app_rentals" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_reviews (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_reviews" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_subscription_plans (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_subscription_plans" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_tenant_subscriptions (Rows: 0)
CREATE TABLE IF NOT EXISTS public."app_tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_tenants (Rows: 1)
CREATE TABLE IF NOT EXISTS public."app_tenants" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_trips (Rows: 11)
CREATE TABLE IF NOT EXISTS public."app_trips" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.app_vendors (Rows: 8)
CREATE TABLE IF NOT EXISTS public."app_vendors" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.bookings (Rows: 35)
CREATE TABLE IF NOT EXISTS public."bookings" (
    "id" INTEGER NOT NULL DEFAULT nextval('bookings_id_seq'::regclass),
    "booking_code" TEXT NOT NULL,
    "user_id" INTEGER,
    "vendor_id" CHARACTER VARYING(100),
    "trip_id" INTEGER,
    "total_amount" NUMERIC NOT NULL,
    "payment_status" TEXT DEFAULT 'pending'::text,
    "booking_status" TEXT DEFAULT 'pending_payment'::text,
    "payment_method" TEXT,
    "payment_channel" TEXT,
    "midtrans_order_id" TEXT,
    "midtrans_token" TEXT,
    "paid_at" TIMESTAMP WITHOUT TIME ZONE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.conversations (Rows: 0)
CREATE TABLE IF NOT EXISTS public."conversations" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "user_id" CHARACTER VARYING(100) NOT NULL,
    "user_name" TEXT,
    "vendor_id" CHARACTER VARYING(100) NOT NULL,
    "vendor_name" TEXT,
    "product_id" TEXT,
    "product_title" TEXT,
    "booking_id" TEXT,
    "booking_code" TEXT,
    "last_message" TEXT,
    "status" CHARACTER VARYING(50) DEFAULT 'active'::character varying,
    "unread_user_count" INTEGER DEFAULT 0,
    "unread_vendor_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.journeys (Rows: 0)
CREATE TABLE IF NOT EXISTS public."journeys" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "creator_id" CHARACTER VARYING(100) NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "status" CHARACTER VARYING(50) DEFAULT 'active'::character varying,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.messages (Rows: 0)
CREATE TABLE IF NOT EXISTS public."messages" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "conversation_id" CHARACTER VARYING(100) NOT NULL,
    "sender_id" CHARACTER VARYING(100) NOT NULL,
    "sender_role" CHARACTER VARYING(50) DEFAULT 'user'::character varying,
    "sender_name" TEXT,
    "text" TEXT NOT NULL,
    "read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.news (Rows: 0)
CREATE TABLE IF NOT EXISTS public."news" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "content" TEXT NOT NULL,
    "author" TEXT DEFAULT 'Admin TREXIO'::text,
    "category" CHARACTER VARYING(50) DEFAULT 'Umum'::character varying,
    "published" BOOLEAN DEFAULT true,
    "published_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.notifications (Rows: 0)
CREATE TABLE IF NOT EXISTS public."notifications" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "recipient_id" CHARACTER VARYING(100) NOT NULL,
    "recipient_role" CHARACTER VARYING(50) DEFAULT 'user'::character varying,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" CHARACTER VARYING(50) DEFAULT 'info'::character varying,
    "read" BOOLEAN DEFAULT false,
    "link" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.payment_transactions (Rows: 0)
CREATE TABLE IF NOT EXISTS public."payment_transactions" (
    "id" INTEGER NOT NULL DEFAULT nextval('payment_transactions_id_seq'::regclass),
    "tx_id" TEXT NOT NULL,
    "booking_code" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "status" TEXT DEFAULT 'pending'::text,
    "payment_type" TEXT,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.rides (Rows: 0)
CREATE TABLE IF NOT EXISTS public."rides" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "creator_id" CHARACTER VARYING(100) NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departure_time" TIMESTAMP WITHOUT TIME ZONE,
    "total_seats" INTEGER DEFAULT 4,
    "available_seats" INTEGER DEFAULT 4,
    "price_per_seat" NUMERIC DEFAULT 0,
    "status" CHARACTER VARYING(50) DEFAULT 'active'::character varying,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.travel_intents (Rows: 0)
CREATE TABLE IF NOT EXISTS public."travel_intents" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "user_id" CHARACTER VARYING(100) NOT NULL,
    "destination" TEXT NOT NULL,
    "travel_date" DATE,
    "budget" NUMERIC,
    "activities" ARRAY,
    "status" CHARACTER VARYING(50) DEFAULT 'active'::character varying,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.trips (Rows: 0)
CREATE TABLE IF NOT EXISTS public."trips" (
    "id" INTEGER NOT NULL DEFAULT nextval('trips_id_seq'::regclass),
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "price" NUMERIC NOT NULL,
    "duration_days" INTEGER DEFAULT 1,
    "available_seats" INTEGER DEFAULT 10,
    "category" TEXT,
    "vendor_id" CHARACTER VARYING(100),
    "slug" TEXT,
    "status" CHARACTER VARYING(50) DEFAULT 'published'::character varying,
    "cover_image" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.users (Rows: 13)
CREATE TABLE IF NOT EXISTS public."users" (
    "id" INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT DEFAULT 'user'::text,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "supabase_uid" TEXT,
    "data" JSONB DEFAULT '{}'::jsonb,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Table: public.vendors (Rows: 0)
CREATE TABLE IF NOT EXISTS public."vendors" (
    "id" CHARACTER VARYING(100) NOT NULL,
    "user_id" CHARACTER VARYING(100),
    "brand_name" TEXT NOT NULL,
    "slug" TEXT,
    "status" CHARACTER VARYING(50) DEFAULT 'active'::character varying,
    "rating" NUMERIC DEFAULT 5.0,
    "total_trips" INTEGER DEFAULT 0,
    "documents" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);
