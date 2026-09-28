# MISSION 05 — Core Domain Repository Migration

Status: **Implemented — incremental cut-over**
Database authority: **Supabase PostgreSQL only**

## Non-negotiable architecture

Trexio backend persistence is PostgreSQL on Supabase.

- No Firebase
- No Firestore
- No Cloud SQL
- No SQL_HOST / SQL_USER / SQL_PASSWORD / SQL_DB_NAME fallback
- Production requires `DATABASE_URL`
- Production rejects a `DATABASE_URL` whose hostname is not a Supabase PostgreSQL endpoint

Supabase Auth remains the authentication provider.

## What changed

### 1. Explicit Supabase PostgreSQL adapter

Legacy `src/db/cloudSqlSync.js` was replaced with `src/db/supabasePostgres.js`.

The adapter now uses only `DATABASE_URL` and PostgreSQL `pg` pooling.

The old CloudSQL naming and adapter file were removed.

### 2. Core repositories added

Created:
- `src/repositories/vendorRepository.js`
- `src/repositories/tripRepository.js`
- `src/repositories/bookingRepository.js`
- `src/repositories/paymentRepository.js`

They all persist through the PostgreSQL application-document repository boundary.

### 3. Vendor write migration

Vendor creation and vendor persistence paths now use:

`route → vendorRepository → appDocumentRepository → Supabase PostgreSQL`

The existing in-memory array remains as a transitional compatibility/read model.

### 4. Trip write migration

Admin and vendor trip create/update/delete paths now use:

`route → tripRepository → appDocumentRepository → Supabase PostgreSQL`

Delete operations explicitly delete the corresponding PostgreSQL document rather than rebuilding the whole collection from memory.

### 5. Booking persistence migration

Booking persistence no longer calls the legacy database sync function directly.

It now uses:

`route/business logic → bookingRepository → Supabase PostgreSQL`

Payment behavior and Midtrans status logic were intentionally left unchanged.

### 6. Payment persistence migration

Payment transaction persistence now uses:

`paymentRepository → Supabase PostgreSQL`

Midtrans integration, webhook behavior, signature verification, and payment-state transitions were not rewritten in this mission.

### 7. Legacy dead-code cleanup

Removed from the database adapter:
- Vendor legacy sync function
- Trip legacy sync function
- Booking legacy sync function
- Payment legacy sync function
- Conversation legacy sync function
- Message legacy sync function
- Notification legacy sync function

Removed corresponding obsolete imports from the active server.

### 8. Governance hardening

`verify-repo-integrity.js` now requires `DATABASE_URL` in the documented production environment contract.

The repository was also checked for legacy references to CloudSQL, cloudSqlSync, Firebase, Firestore, SQL_HOST, SQL_USER, and SQL_PASSWORD. No remaining active references were found during repository inspection.

## Why JSONB remains temporarily

The canonical Supabase PostgreSQL schema already contains relational tables for users, vendors, trips, bookings, and payment_transactions.

However, the current Trexio marketplace objects contain substantially more fields than the existing relational columns.

A forced partial mapping would risk silently losing marketplace data.

Therefore Mission 05 establishes repository ownership first while preserving complete application objects in the existing PostgreSQL JSONB compatibility tables.

The next schema phase can introduce complete relational domain models and migrate data without changing the public API contract.

## Architecture after Mission 05

Current transitional flow:
`Route → Business Logic → Domain Repository → App Document Repository → Supabase PostgreSQL`

Target:
`Route → Service → Domain Repository → Relational Supabase PostgreSQL`

The target is intentionally not implemented as a big-bang rewrite.

## Intentionally deferred

- Full relational cut-over of trips
- Full relational cut-over of vendors
- Full relational cut-over of bookings
- Payment transaction relational cut-over
- User/Auth repository migration
- Removal of all in-memory compatibility arrays
- Removal of the legacy bulk `replace()` compatibility operation

These require schema/data reconciliation and production verification before destructive cleanup.

## Verification status

Static repository verification performed:
- CloudSQL adapter filename removed
- CloudSQL legacy references removed
- Firebase/Firestore references absent
- SQL_HOST / SQL_USER / SQL_PASSWORD fallback removed
- Core legacy sync functions removed
- Trip/Vendor/Booking/Payment repositories present
- Production Supabase endpoint guard present
- `DATABASE_URL` added to architecture integrity requirements

A live application test/build was not executed because this connector session cannot reach the GitHub repository filesystem or the user's runtime environment.

## Next Mission

Mission 06 should address **Schema & Service Layer Consolidation**:

1. Remove runtime DDL from application startup
2. Make versioned Supabase migrations the only schema authority
3. Design complete relational models for Vendor and Trip
4. Add service layer between routes and repositories
5. Begin dual-read verification between JSONB compatibility data and relational data
6. Only after verification, migrate production reads domain-by-domain