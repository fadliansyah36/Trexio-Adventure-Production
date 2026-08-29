-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "app_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" varchar(100),
	"brand_name" text NOT NULL,
	"slug" text,
	"status" varchar(50) DEFAULT 'active',
	"rating" numeric DEFAULT '5.0',
	"total_trips" integer DEFAULT 0,
	"documents" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"supabase_uid" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_key" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"destination" text NOT NULL,
	"price" numeric NOT NULL,
	"duration_days" integer DEFAULT 1,
	"available_seats" integer DEFAULT 10,
	"category" text,
	"vendor_id" varchar(100),
	"slug" text,
	"status" varchar(50) DEFAULT 'published',
	"cover_image" text,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_code" text NOT NULL,
	"user_id" integer,
	"vendor_id" varchar(100),
	"trip_id" integer,
	"total_amount" numeric NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"booking_status" text DEFAULT 'pending_payment',
	"payment_method" text,
	"payment_channel" text,
	"midtrans_order_id" text,
	"midtrans_token" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bookings_booking_code_key" UNIQUE("booking_code")
);
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_id" text NOT NULL,
	"booking_code" text NOT NULL,
	"order_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_type" text,
	"transaction_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_transactions_tx_id_key" UNIQUE("tx_id")
);
--> statement-breakpoint
ALTER TABLE "payment_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"user_name" text,
	"vendor_id" varchar(100) NOT NULL,
	"vendor_name" text,
	"product_id" text,
	"product_title" text,
	"booking_id" text,
	"booking_code" text,
	"last_message" text,
	"status" varchar(50) DEFAULT 'active',
	"unread_user_count" integer DEFAULT 0,
	"unread_vendor_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(100) NOT NULL,
	"sender_id" varchar(100) NOT NULL,
	"sender_role" varchar(50) DEFAULT 'user',
	"sender_name" text,
	"text" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"recipient_id" varchar(100) NOT NULL,
	"recipient_role" varchar(50) DEFAULT 'user',
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'info',
	"read" boolean DEFAULT false,
	"link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "news" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"content" text NOT NULL,
	"author" text DEFAULT 'Admin TREXIO',
	"category" varchar(50) DEFAULT 'Umum',
	"published" boolean DEFAULT true,
	"published_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "news" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "travel_intents" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"destination" text NOT NULL,
	"travel_date" date,
	"budget" numeric,
	"activities" text[],
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "travel_intents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"creator_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"destination" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "journeys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rides" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"creator_id" varchar(100) NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"departure_time" timestamp,
	"total_seats" integer DEFAULT 4,
	"available_seats" integer DEFAULT 4,
	"price_per_seat" numeric DEFAULT '0',
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_trips" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_trips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_billing_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_billing_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_rentals" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_rentals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_destinations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_communities" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_communities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_coupons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_announcements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_advertising_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_advertising_packages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_subscription_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_tenant_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_tenant_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_advertising_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_advertising_campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_incidents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_homepage_config" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_homepage_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_master_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_master_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_master_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_master_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_master_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_master_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
*/