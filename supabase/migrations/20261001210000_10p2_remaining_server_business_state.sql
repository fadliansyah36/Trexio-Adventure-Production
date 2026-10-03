CREATE TABLE IF NOT EXISTS public.app_feature_flags (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_feature_flags_updated_at_idx ON public.app_feature_flags(updated_at);
ALTER TABLE public.app_feature_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_feature_flags FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_tenant_domains (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_tenant_domains_updated_at_idx ON public.app_tenant_domains(updated_at);
ALTER TABLE public.app_tenant_domains ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_tenant_domains FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_categories (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_categories_updated_at_idx ON public.app_community_categories(updated_at);
ALTER TABLE public.app_community_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_categories FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_members (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_members_updated_at_idx ON public.app_community_members(updated_at);
ALTER TABLE public.app_community_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_members FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_posts (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_posts_updated_at_idx ON public.app_community_posts(updated_at);
ALTER TABLE public.app_community_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_posts FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_comments (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_comments_updated_at_idx ON public.app_community_comments(updated_at);
ALTER TABLE public.app_community_comments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_comments FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_events (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_events_updated_at_idx ON public.app_community_events(updated_at);
ALTER TABLE public.app_community_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_events FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_bookmarks (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_bookmarks_updated_at_idx ON public.app_community_bookmarks(updated_at);
ALTER TABLE public.app_community_bookmarks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_bookmarks FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_reports (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_reports_updated_at_idx ON public.app_community_reports(updated_at);
ALTER TABLE public.app_community_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_reports FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_moderation_logs (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_moderation_logs_updated_at_idx ON public.app_community_moderation_logs(updated_at);
ALTER TABLE public.app_community_moderation_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_moderation_logs FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_community_suspended_users (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_community_suspended_users_updated_at_idx ON public.app_community_suspended_users(updated_at);
ALTER TABLE public.app_community_suspended_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_community_suspended_users FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_rental_orders (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_rental_orders_updated_at_idx ON public.app_rental_orders(updated_at);
ALTER TABLE public.app_rental_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_rental_orders FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_wallets (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_wallets_updated_at_idx ON public.app_wallets(updated_at);
ALTER TABLE public.app_wallets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_wallets FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_support_tickets (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_support_tickets_updated_at_idx ON public.app_support_tickets(updated_at);
ALTER TABLE public.app_support_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_support_tickets FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_platform_disputes (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_platform_disputes_updated_at_idx ON public.app_platform_disputes(updated_at);
ALTER TABLE public.app_platform_disputes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_platform_disputes FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public.app_cs_config (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS app_cs_config_updated_at_idx ON public.app_cs_config(updated_at);
ALTER TABLE public.app_cs_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_cs_config FROM anon, authenticated;
