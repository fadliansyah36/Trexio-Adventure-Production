# MISSION 06 — Migration Authority & Legacy Backend Cleanup

## Status

**COMPLETED — committed to `main`**

Baseline Mission 05:
`078eeded6deba5fe94ef12df3f222f6bddc5129c`

Mission 06 final HEAD:
`5dc57b7e5c9fd5dd2c0bc76a336d7c2bf896a496`

The repository is 7 commits ahead of the Mission 05 baseline.

## Objectives

1. Make versioned Supabase PostgreSQL migrations the only schema-authority path.
2. Remove runtime database DDL from application startup.
3. Repair database migration/pull scripts that still referenced the retired Cloud SQL adapter.
4. Remove confirmed inactive NestJS + TypeORM + SQLite backend stack.
5. Prevent the removed architecture from being reintroduced accidentally.
6. Remove obsolete SQLite seed environment variables.

## Completed Changes

### 1. Runtime DDL removed

`src/db/supabasePostgres.js` no longer creates tables during application startup.

The former `initSupabasePostgresSchema()` is now a schema verification routine:

- checks required relational tables;
- checks `_supabase_migrations`;
- checks all `app_*` compatibility tables;
- fails with an actionable message when schema is incomplete;
- does not execute `CREATE TABLE`, `ALTER TABLE`, or other schema mutations.

Architecture is now:

```
supabase/migrations/*.sql
        |
        v
npm run db:push
        |
        v
Supabase PostgreSQL
        |
        v
server.js -> schema verification only
```

This establishes migration files as the authoritative schema-change mechanism.

### 2. Migration coverage verified

Migration:

`supabase/migrations/20260829000000_V3_trexio_migration.sql`

covers the relational tables previously created by runtime DDL:

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

It also defines the `app_*` JSONB compatibility tables required by the current transitional repositories.

### 3. Cloud SQL adapter references eliminated

Both database utilities were corrected:

- `scripts/db-push.js`
- `scripts/db-pull.js`

They now import:

```
src/db/supabasePostgres
```

instead of the retired:

```
src/db/cloudSqlSync
```

### 4. Confirmed dead code removed

Removed the inactive NestJS backend tree because the production runtime is `server.js`, while `src/main.ts` was not part of the active start/dev path.

Removed:

- `src/main.ts`
- `src/app.module.ts`
- `src/database/**`
- `src/modules/auth/**`
- `src/modules/bookings/**`
- `src/modules/chat/**`
- `src/modules/health/**`
- `src/modules/trips/**`
- inactive NestJS logging interceptor

This also removed the legacy TypeORM SQLite database path.

### 5. Legacy dependencies removed

Removed from `package.json`:

- NestJS runtime packages
- NestJS TypeORM integration
- TypeORM
- Passport / Passport-JWT packages used only by the removed NestJS stack
- reflect-metadata
- rxjs

No root `package-lock.json` is present, so there was no lockfile requiring synchronization.

### 6. Integrity gate hardened

`scripts/verify-repo-integrity.js` now blocks reintroduction of:

- TypeORM
- NestJS backend packages
- local database configuration via `DATABASE_FILE`
- `trexio_database.sqlite`
- NestJS imports
- TypeORM imports
- existing forbidden SQLite patterns

This turns the architecture rule into an automated repository guard.

### 7. Environment cleanup

Removed obsolete variables from `.env.example`:

- `SEED_DEMO_PASSWORD`
- `SEED_VENDOR_PASSWORD`

The active production database configuration remains Supabase PostgreSQL through `DATABASE_URL`.

## Security / Architecture Result

Current backend database direction:

**Supabase PostgreSQL only**

Authentication:

**Supabase Auth + active Express/JWT runtime**

Payment:

**Midtrans**

Legacy Firebase / Firestore / Cloud SQL database paths were not reintroduced.

The application startup no longer mutates database schema.

## Verification Performed

Repository-level verification confirmed:

- no `src/database/**` remains;
- no `src/modules/**` NestJS backend remains;
- no `src/main.ts`;
- no `src/app.module.ts`;
- database migration scripts point to `supabasePostgres`;
- package dependencies no longer contain the removed NestJS/TypeORM stack;
- Mission 05 baseline → Mission 06 HEAD = 7 commits ahead, 0 behind.

## Runtime Verification Limitation

A live `npm run db:push`, `npm test`, or production boot test was **not claimed as successful** because this execution environment does not have the project's Supabase database credentials/runtime network access.

The next deployment/runtime verification should execute:

```
npm run verify-integrity
npm run security-scan
npm run db:push
npm start
```

and verify that startup reports:

```
Schema verification passed. Runtime DDL is disabled; migrations are authoritative.
```

## Next Mission Candidate

Mission 07 should focus on the next architectural boundary:

**Relational repository cutover**

Priority order:

1. Vendor repository → canonical `vendors` table
2. Trip repository → canonical `trips` table
3. Direct SQL reads by ID instead of loading the full JSONB collection
4. Dual-read consistency verification
5. Only after validation, retire corresponding `app_vendors` / `app_trips` compatibility paths

Payment/booking transactional cutover should remain isolated because Midtrans webhook and payment-state transitions are higher-risk.

