# MISSION 08 — Compatibility Store Retirement

## Phase A — Safe Preparation

**Status: COMPLETED on `main`**

Mission 08 continues the Vendor/Trip relational cutover from Mission 07. The live Supabase verification gate remains the safety boundary for destructive compatibility-table retirement.

### Completed in Phase A

1. Repository documentation was reconciled from the retired Cloud SQL/Firebase architecture to the active Supabase PostgreSQL + Supabase Auth architecture.
2. The README no longer publishes a fixed production database endpoint and now requires the connection string to come from environment/CI secrets.
3. Architecture Decision Register, Technical Debt Register, Deprecation Register, and Database Governance were updated to reflect the active architecture.
4. `frontend/src/lib/firebase.js` was removed after repository code search found no active imports/references. The frontend authentication path uses Supabase Auth.
5. No `app_vendors` or `app_trips` compatibility table was deleted or structurally changed in this phase.

## Phase B — Live-Gated Retirement

### Mission 07 migration application

The verification workflow is intentionally read-only. A separate manual GitHub Actions workflow, `Mission 07 - Apply Relational Cutover`, now applies only `20260929000000_MISSION_07_relational_vendor_trip_cutover.sql` inside a PostgreSQL transaction and verifies the three new columns before committing. This avoids using the generic migration runner for a high-risk production cutover.

**Status: PENDING live Supabase verification**

After `npm run db:verify-relational-cutover` passes against the active Supabase database, execute the remaining retirement work:

1. Remove `app_vendors` / `app_trips` from active compatibility configuration.
2. Remove any remaining runtime compatibility helpers that are proven unused.
3. Add a versioned migration to retire the two compatibility tables.
4. Verify application startup and Vendor/Trip CRUD against the relational tables.
5. Begin the next relational domain only after Vendor/Trip retirement is certified.

### Safety rule

Do **not** drop or truncate `app_vendors` or `app_trips` before the live verification gate passes. The tables remain the rollback/reference safety net until the relational data and CRUD paths are proven in the target Supabase environment.

## Verification

The target workflow remains:

```text
npm run db:verify-relational-cutover
npm run verify-integrity
npm run security-scan
```

The workflow does not apply migrations automatically; `npm run db:push` must be executed deliberately in the target environment when pending migrations need to be applied.
