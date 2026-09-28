# TREXIO — MISSION 03: Database & Data Source Reconciliation

Status: COMPLETED — reconciliation baseline
Repository: fadliansyah36/Trexio-Adventure-Production
HEAD audited: 677100d85829f7cf329004766723301fb53ecaf1

> Based on checked-in repository artifacts and schema snapshot. This is not a fresh live production DB inspection beyond what supabase/schema.sql records.

## 1. Executive Decision

Canonical production database: Supabase PostgreSQL.

Canonical migration authority: versioned SQL under supabase/migrations.

Drizzle: typed PostgreSQL schema representation. It should not become a second independent migration authority unless deliberately adopted later.

app_* JSONB tables: retain temporarily because active Express runtime still consumes them.

TypeORM/SQLite: isolate as legacy/non-production architecture until deliberately migrated.

## 2. Database Inventory

Checked-in supabase/schema.sql contains 38 tables.

One is _supabase_migrations. The remaining 37 are application tables.

Relational core:
- users
- vendors
- trips
- bookings
- payment_transactions
- conversations
- messages
- notifications
- news
- travel_intents
- journeys
- rides

JSONB application tables include app_trips, app_vendors, app_bookings, app_payments, app_rentals, app_destinations, app_communities, app_coupons, app_tenants, app_announcements, app_conversations, app_messages, app_advertising_packages, app_advertising_campaigns, app_billing_transactions, app_subscription_plans, app_tenant_subscriptions, app_audit_logs, app_incidents, app_reviews, app_articles, app_homepage_config, app_master_categories, app_master_locations and app_master_roles.

## 3. Migration vs Snapshot Drift

The V3 migration defines 37 application tables. The schema snapshot has 38 because it also contains _supabase_migrations.

Detected column drift:

- bookings: migration contains ticket_token, checked_in, checkin_time; snapshot does not.
- payment_transactions: migration contains signature_key, raw_response; snapshot does not.
- news: migration contains updated_at; snapshot does not.
- trips: migration contains updated_at; snapshot does not.
- vendors: migration contains updated_at; snapshot does not.

These differences must be reconciled before destructive schema cleanup.

## 4. Drizzle Reconciliation

drizzle/schema.ts defines 37 application tables and closely corresponds to the V3 PostgreSQL schema, including the app_* JSONB tables.

Drizzle is not currently the active request-time persistence layer. Express uses pg through src/db/cloudSqlSync.js.

Decision: do not introduce Drizzle into the live request path during this mission.

## 5. Critical Source-of-Truth Contradiction

server.js comments describe PostgreSQL as the source of truth, but cloudSqlSync contains replaceAppCollection().

That function explicitly mirrors the in-memory array into PostgreSQL and deletes rows absent from memory.

Actual behavior is therefore closer to:

PostgreSQL -> hydration -> in-memory arrays -> application mutation -> replaceAppCollection -> PostgreSQL

rather than:

PostgreSQL -> repository -> service -> API, with memory as an optional cache.

Severity: CRITICAL.

If hydration is incomplete or stale, the mirror can potentially remove rows from app_* tables. replaceAppCollection must not remain the long-term source-of-truth mechanism.

## 6. Core Domain Duplication

Duplicated domains:

| Domain | Relational | JSONB | Target |
|---|---|---|---|
| Vendors | vendors | app_vendors | relational canonical |
| Trips | trips | app_trips | relational canonical |
| Bookings | bookings | app_bookings | relational canonical |
| Payments | payment_transactions | app_payments | relational canonical |
| Conversations | conversations | app_conversations | relational canonical |
| Messages | messages | app_messages | relational canonical |

These app_* duplicates should be treated as transitional legacy mirrors, not independent sources of truth.

Flexible JSONB domains such as rentals, destinations, communities, coupons, tenants, advertising, audit logs, articles and homepage configuration may remain JSONB until their query/transaction requirements justify relational models.

## 7. TypeORM / SQLite Reconciliation

NestJS DatabaseModule uses TypeORM with SQLite database ./trexio_database.sqlite by default.

Its entities do not match the canonical PostgreSQL structures.

Examples:

Trip TypeORM expects string id, rating, image and featured fields, while PostgreSQL trips uses serial id, available_seats, category, status and cover_image.

Booking TypeORM expects trip_title, participants_count, total_price and payment_proof, while PostgreSQL bookings uses booking_code, total_amount, payment_status, booking_status and Midtrans fields.

Conclusion: SQLite/TypeORM is not compatible with the current production schema and must not become production runtime accidentally.

## 8. TypeORM Seed

NestJS DatabaseService invokes resetAndSeedDatabase(). It avoids destructive reset in production or when existing data is detected, but it remains part of the non-active NestJS database architecture.

Decision: do not connect this module to production until it is rewritten against the canonical PostgreSQL model.

## 9. Database Push/Pull

scripts/db-push.js applies SQL files from supabase/migrations and records versions in _supabase_migrations.

scripts/db-pull.js introspects PostgreSQL and regenerates supabase/schema.sql.

Recommended model:

Migration authority = supabase/migrations
Schema snapshot = supabase/schema.sql
Typed schema = drizzle/schema.ts
Runtime database access = pg/repository layer

## 10. Runtime DDL

cloudSqlSync.initCloudSqlSchema() also contains CREATE TABLE IF NOT EXISTS statements.

This creates a second schema provisioning path outside versioned migrations.

Decision: retain temporarily for compatibility, then remove after migration coverage and production schema verification are complete.

## 11. RLS

Both relational and JSONB tables have RLS enabled in the checked-in schema/migration.

Service-role policies provide backend access. Application authorization must still enforce JWT validation, ownership, roles and tenant boundaries.

## 12. Canonical Ownership

Tier A — relational canonical:
users, vendors, trips, bookings, payment_transactions, conversations, messages, notifications, news, travel_intents, journeys, rides.

Tier B — flexible JSONB:
rentals, destinations, communities, coupons, tenants, subscriptions, advertising, billing, audit logs, incidents, reviews, articles, homepage configuration, master categories, master locations and master roles.

Tier C — transitional duplicate:
app_trips, app_vendors, app_bookings, app_payments, app_conversations, app_messages.

## 13. Safe Migration Strategy

Phase A — freeze: do not delete tables, rename IDs, change PK types or switch runtime.

Phase B — reconcile schema drift and regenerate the snapshot.

Phase C — introduce PostgreSQL repositories for core domains.

Phase D — compare relational core data with app_* duplicates without destructive overwrite.

Phase E — cut over one domain at a time: users, trips, vendors, bookings, payments, conversations, messages.

Phase F — after zero consumers remain, stop app_* writes, retain backup, monitor, then archive/drop.

## 14. Findings

F-03.01 — PostgreSQL canonical ownership is not consistently enforced. Severity: CRITICAL.
F-03.02 — Core domains exist in relational and JSONB forms. Severity: HIGH.
F-03.03 — Runtime DDL exists alongside migrations. Severity: HIGH.
F-03.04 — Migration and checked-in schema snapshot have column drift. Severity: HIGH.
F-03.05 — TypeORM SQLite schema is incompatible with PostgreSQL production model. Severity: HIGH.
F-03.06 — Express uses hydrated in-memory arrays as an operational data layer. Severity: HIGH.
F-03.07 — Drizzle is not integrated into the active runtime. Severity: MEDIUM.
F-03.08 — Migration tooling and runtime schema provisioning are split. Severity: MEDIUM.

## 15. Target Architecture

API -> Controllers -> Services -> Repositories -> Supabase PostgreSQL

PostgreSQL relational core becomes authoritative.
JSONB remains for flexible domains where appropriate.
In-memory state becomes cache/read-model only.
Drizzle represents the PostgreSQL schema.
TypeORM/SQLite remains isolated until an intentional backend migration.

## 16. Mission 03 Decision

Canonical production data store: Supabase PostgreSQL.
Canonical migration mechanism: versioned SQL in supabase/migrations.
Drizzle: typed schema representation.
TypeORM SQLite: legacy/NestJS isolated architecture.
In-memory arrays: transitional cache/read model.
Core app_* duplicates: transitional legacy storage.

## 17. Next Mission

MISSION 04 — Backend Architecture Consolidation.

Primary objectives:
- introduce repository/service boundaries
- extract business logic from server.js
- preserve existing API contracts
- move core reads/writes to PostgreSQL
- eliminate destructive memory-to-DB mirroring
- prepare modular backend transition
- keep the PWA stable