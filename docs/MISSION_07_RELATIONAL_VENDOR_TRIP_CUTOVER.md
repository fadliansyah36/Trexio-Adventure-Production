# MISSION 07 — Relational Vendor & Trip Cutover

## Status

**IMPLEMENTED — main**

Mission 06 baseline:
`07a0f744889ccf9fb91bfff6eb850c48148468d9`

Current Mission 07 HEAD:
to be resolved after this documentation commit.

## Objective

Move the Vendor and Trip domains from the transitional PostgreSQL JSONB `app_*` store to the canonical relational PostgreSQL tables while preserving existing Trexio API IDs and response shapes.

Payment/Midtrans and Booking persistence were intentionally left outside this cutover.

## Architecture Change

### Before

```
server.js
   |
   v
in-memory vendors/trips
   |
   v
appDocumentRepository
   |
   v
app_vendors / app_trips
```

### After

```
server.js
   |
   +--> vendorRepository --> public.vendors
   |
   +--> tripRepository   --> public.trips
```

The in-memory arrays remain as a transitional compatibility/read model for the existing Express route contracts, but their source of truth for Vendor and Trip is now the relational repository.

## 1. Relational Migration

Added:

`supabase/migrations/20260929000000_MISSION_07_relational_vendor_trip_cutover.sql`

Changes:

### vendors

Adds:

- `data JSONB`

Existing canonical columns remain first-class:

- `id`
- `user_id`
- `brand_name`
- `slug`
- `status`
- `rating`
- `total_trips`
- `documents`

### trips

Adds:

- `external_id TEXT UNIQUE`
- `data JSONB`

The PostgreSQL `SERIAL id` remains the internal database identifier.

Trexio's existing public/API identifier is stored in `external_id`.

This avoids changing existing PWA/API IDs such as `trip_<uuid>` and avoids prematurely changing Booking's current integer `trip_id` model.

## 2. Backfill

The migration backfills:

```
app_vendors -> vendors
app_trips   -> trips
```

The backfill is idempotent through `ON CONFLICT`.

Core fields are promoted into relational columns while the complete legacy document is retained in the relational table's `data` JSONB field.

This gives the domain a relational source of truth without discarding marketplace-specific fields that are not yet normalized.

## 3. Vendor Repository

`src/repositories/vendorRepository.js`

Now executes direct PostgreSQL queries for:

- `list()`
- `findById(id)`
- `findByUserId(userId)`
- `save(vendor)`
- `remove(id)`

It no longer calls `appDocumentRepository`.

## 4. Trip Repository

`src/repositories/tripRepository.js`

Now executes direct PostgreSQL queries for:

- `list()`
- `findById(id)`
- `save(trip)`
- `remove(id)`

It no longer calls `appDocumentRepository`.

Trip API identity is resolved through `external_id`.

## 5. Runtime Hydration

`server.js` now hydrates Vendor and Trip through:

```
vendorRepository.list()
tripRepository.list()
```

Vendor and Trip were removed from the legacy `ALL_SYNC_COLLECTIONS` JSONB hydration list.

They are therefore no longer hydrated from:

- `app_vendors`
- `app_trips`

## 6. Runtime Persistence

Existing mutation paths already introduced in Mission 05 continue using:

```
persistVendorRecord()
persistTripRecord()
removeTripRecord()
```

These now reach the relational repositories directly.

There is no active:

```
persistCollection('vendors')
persistCollection('trips')
```

path.

## 7. Non-Destructive Verification Gate

Added:

`scripts/verify-relational-cutover.js`

Command:

```
npm run db:verify-relational-cutover
```

The verification compares legacy and relational stores for:

### Vendor

- ID
- user ID
- brand name
- slug
- status

### Trip

- public ID
- title
- destination
- vendor ID
- status

The script performs **read-only verification** and exits non-zero if required relational rows/core fields are missing or changed.

It does not delete or modify either store.

## 8. Compatibility Tables

`app_vendors` and `app_trips` are **not deleted in Mission 07**.

Reason:

- production database state has not been runtime-verified from this execution environment;
- a non-destructive comparison gate must pass first;
- existing application data must be verified before destructive cleanup.

They are now compatibility/verification tables, not active Vendor/Trip persistence paths.

Mission 08 can retire them after the relational verification gate passes in the target Supabase environment.

## 9. Schema Snapshot

Updated:

`supabase/schema.sql`

to include:

- `vendors.data`
- `trips.external_id`
- `trips.data`
- corresponding timestamp fields

The versioned migration remains the authoritative schema-change mechanism.

## 10. Static Verification

Verified through repository state:

- Vendor repository JavaScript syntax: OK
- Trip repository JavaScript syntax: OK
- relational verification script JavaScript syntax: OK
- server.js JavaScript syntax: OK
- no active `persistCollection('vendors')`
- no active `persistCollection('trips')`
- no active `appDocumentRepository.list('vendors')`
- no active `appDocumentRepository.list('trips')`

## Runtime Verification Limitation

A live database migration and relational verification were not executed from this environment because the project's Supabase database credentials/runtime connection are not available here.

Therefore this mission does **not** claim that production data has already been migrated successfully.

Before retiring compatibility tables, execute in the target environment:

```
npm run verify-integrity
npm run security-scan
npm run db:push
npm run db:verify-relational-cutover
npm start
```

Expected cutover verification:

```
[Relational Cutover] vendors: legacy=N, relational=N, missing=0, extra=0, changed=0
[Relational Cutover] trips: legacy=N, relational=N, missing=0, extra=0, changed=0
[Relational Cutover] PASSED
```

## Next Mission

### MISSION 08 — Compatibility Store Retirement

Only after the verification gate passes:

1. stop all remaining references to `app_vendors` / `app_trips`;
2. remove their entries from `APP_DOC_TABLES`;
3. remove corresponding legacy persistence helpers;
4. add migration to retire/drop the compatibility tables;
5. migrate remaining direct in-memory reads toward repository/service boundaries;
6. begin the same relational cutover pattern for the next domain.

Booking/Payment should remain isolated until their transactional and Midtrans consistency model is explicitly verified.
