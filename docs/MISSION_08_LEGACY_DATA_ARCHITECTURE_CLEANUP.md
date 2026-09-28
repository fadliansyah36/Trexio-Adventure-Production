# Mission 08 — Legacy Data & Architecture Cleanup

## Scope

Mission 08 begins the retirement of legacy JSONB compatibility paths without deleting data that may still be required for rollback, verification, or domains that have not yet migrated.

## Mission 07 carry-over

Vendor and Trip are now canonical relational domains.

- Runtime hydration uses `vendorRepository` and `tripRepository`
- Vendor and Trip writes use their relational repositories
- `app_vendors` and `app_trips` are no longer runtime source-of-truth tables
- Mission 07 relational verification is green: Vendor 8/8 and Trip 11/11 with missing=0, extra=0, changed=0

## Audit result

### Confirmed inactive runtime compatibility tables

The runtime compatibility registry no longer needs:

- `app_vendors`
- `app_trips`

These tables remain physically preserved in PostgreSQL because they are still useful as legacy verification/rollback data. They are not dropped by this mission.

The runtime registry in `src/db/supabasePostgres.js` was updated so these two tables cannot accidentally become available through the generic application-document repository.

### Active transitional compatibility domains

The following domains still use the generic JSONB compatibility repository and were therefore intentionally retained:

- bookings
- payments
- rentals
- destinations
- communities
- coupons
- tenants
- articles
- reviews
- announcements
- conversations
- messages
- subscription_plans
- tenant_subscriptions
- advertising_packages
- advertising_campaigns
- billing_transactions
- audit_logs
- incidents
- homepage_config
- master_categories
- master_locations
- master_roles

These are not deleted merely because they are legacy-shaped. Their runtime dependencies must be migrated and verified domain-by-domain first.

## Repository boundary

`src/repositories/appDocumentRepository.js` remains a transitional boundary for the domains above.

- `list` is still used during boot hydration
- `replace` is still used by the existing in-memory compatibility persistence layer
- `save` and `remove` remain required by the current Booking and Payment repositories

Therefore those generic repository capabilities are retained for now.

## Safety rule

Mission 08 does **not** drop legacy database tables merely because their names are legacy.

A table can be removed only after:

1. runtime references are audited,
2. replacement repository behavior is implemented,
3. data parity is verified,
4. CI/security/PWA checks are green,
5. a dedicated database migration removes the table.

## Next cleanup phase

The next phase should migrate the remaining highest-value domains away from `replaceAppCollection` and the in-memory read/write compatibility layer, then retire their corresponding `app_*` tables through explicit versioned migrations.


## Mission 08C — Legacy Booking/Payment Runtime Dependency Audit

Audit completed against the active Express runtime on 2026-09-29.

### Findings

- `bookings` and `payment_transactions` hydrate directly through their relational repositories.
- `bookingRepository` reads/writes `public.bookings`; `paymentRepository` reads/writes `public.payment_transactions`.
- `bookings` and `payments` are not members of `ALL_SYNC_COLLECTIONS`.
- No active runtime calls were found for `appDocumentRepository.list/save/remove/replace` against the booking or payment collections.
- `saveBookingsToDisk()` and `savePaymentsDataToDisk()` retain their historical names, but their implementations now delegate to the relational repositories rather than legacy `app_*` tables.
- The generic `APP_DOC_TABLES` registry no longer exposes `app_bookings` or `app_payments`, preventing accidental future runtime use through the compatibility repository.

### Legacy data disposition

The physical `app_bookings` and `app_payments` tables are preserved for reconciliation, audit, and rollback evidence. They are not runtime sources of truth and were not dropped during Mission 08C.

Production reconciliation state after Mission 08B:

- relational bookings: 46
- legacy app_bookings: 32
- relational payment transactions: 37
- legacy app_payments: 37
- booking reconciliation audit: 46 rows
- destructive deletes performed: 0

### Decision gate

Mission 08C establishes the runtime dependency boundary. Retirement of the physical legacy tables remains a separate database-lifecycle operation and should only occur after the retained audit/rollback requirements are explicitly closed.


## Mission 08D — Legacy Booking/Payment Table Retirement Gate

The retirement gate was executed against production Supabase on 2026-09-29 using read-only dependency/parity checks plus a non-destructive gate record.

### Gate evidence

- `public.bookings`: 46 rows
- `public.app_bookings`: 32 rows
- All 32 legacy booking rows match the relational domain by booking code/external ID; unmatched legacy bookings: 0
- `public.payment_transactions`: 37 rows
- `public.app_payments`: 37 rows
- All 37 legacy payment rows match the relational domain by transaction identity; unmatched legacy payments: 0
- No public views or public routines were found whose definitions reference `app_bookings` or `app_payments`
- PostgreSQL dependency inspection found only internal TOAST dependencies for the legacy tables; no external application object dependency was found

### Gate decision

**RETIREMENT STATUS: BLOCKED**

The gate intentionally blocks physical table retirement because `app_bookings` and `app_payments` still contain retained legacy rows. The rows are fully matched to the relational stores, but they remain historical/rollback evidence and have not been explicitly archived or released for destruction.

No legacy rows were deleted.

A new audit table, `public.legacy_booking_payment_retirement_gate`, records the gate result and evidence. The migration is non-destructive and does not drop either legacy table.

### Required conditions before physical retirement

1. Confirm the retained legacy copies are no longer required for rollback/audit.
2. Create an explicit archive/retention decision if the data must be preserved outside the live compatibility tables.
3. Re-run parity verification immediately before retirement.
4. Re-run repository/runtime dependency audit.
5. Execute a separate versioned destructive migration only after the retirement decision is explicitly authorized.

Mission 08D therefore closes the **runtime retirement gate**, but deliberately does not perform the physical table drop.


## Mission 08E — Legacy Archive & Final Retirement Preparation

Completed as a non-destructive archive preparation step.

### Production archive evidence

- `archive_app_bookings`: 32 rows
- `app_bookings`: 32 rows
- Exact booking ID + JSON payload matches: 32/32
- `archive_app_payments`: 37 rows
- `app_payments`: 37 rows
- Exact payment ID + JSON payload matches: 37/37
- Archive tables have RLS enabled.
- Live legacy tables were not deleted or modified destructively.

### Retirement preparation status

**ARCHIVE_READY** — the retained legacy copies have a verified archive representation.

Physical retirement of `app_bookings` and `app_payments` is still a separate destructive operation. Before that operation, the final gate must verify runtime dependency status, archive parity, relational parity, and any required retention/rollback approval. Mission 08E does not drop the source legacy tables.

Production archive gate: `public.legacy_archive_retirement_gate`.


## Mission 08F — Final Legacy Retirement Verification

Final verification completed without dropping legacy tables.

### Verification results

- Runtime source audit: **PASS** — no `app_bookings` / `app_payments` references in the audited runtime/repository files.
- Legacy booking archive parity: **PASS** — 32 legacy rows, 32 archive rows, 32 exact ID+JSON matches.
- Legacy payment archive parity: **PASS** — 37 legacy rows, 37 archive rows, 37 exact ID+JSON matches.
- Relational booking population: 46 rows.
- Relational payment population: 37 rows.
- External database dependency audit: **PASS** — remaining PostgreSQL dependencies are internal table-owned policies/constraints/defaults, not external application objects.
- Public view references: **PASS** — none found.
- Public function references: **PASS** — none found among ordinary functions.
- Migration history: **PASS** — Mission 08E migrations are recorded in Supabase migration history.
- Final gate: **READY_FOR_DESTRUCTIVE_RETIREMENT**.

### Security hardening performed

- Archive tables use RLS with service-role-only policies.
- Final verification gate uses RLS with service-role-only policy.
- `public.rls_auto_enable()` EXECUTE was explicitly revoked from `anon` and `authenticated` again during final verification.

The remaining Supabase security advisory is the Auth leaked-password-protection setting, which is independent of the legacy booking/payment retirement path and remains a separate platform configuration item.

### Important boundary

**READY_FOR_DESTRUCTIVE_RETIREMENT does not itself execute destructive retirement.** The next destructive migration must be separately authorized and versioned. It should re-run the final verification immediately before dropping `public.app_bookings` and `public.app_payments`.

Verification command:

```bash
npm run db:verify-legacy-retirement
```
