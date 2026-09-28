# MISSION 07 — Verification & Relational Vendor/Trip Cutover

## Final Status

**IMPLEMENTATION COMPLETE — STATIC VERIFICATION PASSED — LIVE DATABASE VERIFICATION PENDING**

Mission 07 moves Vendor and Trip persistence from the transitional JSONB repositories to canonical relational Supabase PostgreSQL repositories.

## Verified Architecture

### Vendor

`src/repositories/vendorRepository.js`

- Uses `getPool()`
- Reads directly from `public.vendors`
- `list()` performs SQL query
- `findById()` performs SQL lookup
- `findByUserId()` performs SQL lookup
- `save()` performs PostgreSQL UPSERT
- `remove()` performs PostgreSQL DELETE
- Does not import or reference `app_vendors`

### Trip

`src/repositories/tripRepository.js`

- Uses `getPool()`
- Reads directly from `public.trips`
- `external_id` preserves the existing Trexio public/API ID
- `list()` performs SQL query
- `findById()` resolves by `external_id`
- `save()` performs PostgreSQL UPSERT
- `remove()` deletes by `external_id`
- Does not import or reference `app_trips`

## Server Hydration

The active `server.js` startup flow now:

1. verifies Supabase PostgreSQL schema;
2. hydrates users;
3. hydrates Vendor/Trip from relational repositories;
4. hydrates remaining transitional domains from JSONB `app_*` collections.

Vendor and Trip were removed from `ALL_SYNC_COLLECTIONS`.

Therefore `persistCollection()` can no longer write Vendor or Trip data into the legacy compatibility tables.

## Migration

Migration:

`supabase/migrations/20260929000000_MISSION_07_relational_vendor_trip_cutover.sql`

adds:

- `vendors.data JSONB`
- `trips.external_id TEXT UNIQUE`
- `trips.data JSONB`
- GIN indexes for flexible marketplace data
- relational backfill from `app_vendors`
- relational backfill from `app_trips`

The migration intentionally retains `app_vendors` and `app_trips` as temporary compatibility/reference data. They are **not** deleted in Mission 07.

## Public ID Compatibility

The application previously used IDs such as:

`vendor_xxxxxxxx`

and:

`trip_xxxxxxxx`

The PostgreSQL `trips.id` column is an internal SERIAL key. Mission 07 therefore introduces:

`trips.external_id`

The repository returns `external_id` as the application's public `id`.

This avoids changing existing booking/API/PWA identifiers during the database cutover.

## Non-Destructive Verification

Added:

`scripts/verify-relational-cutover.js`

Run with:

```
npm run db:verify-relational-cutover
```

It compares legacy and relational stores for core fields:

### Vendor

- id
- user_id
- brand_name
- slug
- status

### Trip

- id / external_id
- title
- destination
- vendor_id
- status

The verification performs **read-only queries** and never modifies or deletes data.

## Static Verification Results

| Check | Result |
|---|---|
| Vendor repository JavaScript syntax | PASS |
| Trip repository JavaScript syntax | PASS |
| server.js JavaScript syntax | PASS |
| Vendor repository references app_vendors | PASS — none |
| Trip repository references app_trips | PASS — none |
| server.js legacy Vendor/Trip JSONB hydration | PASS — none |
| server.js legacy Vendor/Trip persistCollection path | PASS — none |
| Runtime DDL in active repository/server | PASS — none |
| Migration contains backfill | PASS |
| Non-destructive verification script | PASS |
| Mission 07 package script registered | PASS |

## Why app_* Has Not Been Deleted

Deletion is intentionally deferred until live verification proves:

1. every legacy Vendor row exists in relational `vendors`;
2. every legacy Trip row exists in relational `trips`;
3. core fields match;
4. production startup can hydrate successfully from relational tables;
5. create/update/delete operations work against relational tables;
6. booking references remain valid.

Deleting `app_vendors` or `app_trips` before these checks would remove the rollback/reference safety net without evidence.

## Live Verification Required

The following command must be executed in an environment with valid Supabase `DATABASE_URL`:

```
npm run db:push
npm run db:verify-relational-cutover
npm run verify-integrity
npm run security-scan
npm test
npm run build
```

Expected cutover verification:

```
[Relational Cutover] vendors: ... missing=0, changed=0
[Relational Cutover] trips: ... missing=0, changed=0
[Relational Cutover] PASSED
```

This execution environment does not have the project's live Supabase credentials, so **a PASS is not fabricated**.

## Mission 08 Recommendation

After live verification passes:

1. perform controlled dual-read observation;
2. remove `app_vendors` and `app_trips` write compatibility completely;
3. archive/remove those two compatibility tables through a versioned migration;
4. move additional core domains toward relational repositories;
5. prioritize Booking/Payment separately because Midtrans transaction state is higher risk.

**Mission 07 should be considered technically implemented and statically verified, but not production-certified until the live Supabase verification command passes.**
