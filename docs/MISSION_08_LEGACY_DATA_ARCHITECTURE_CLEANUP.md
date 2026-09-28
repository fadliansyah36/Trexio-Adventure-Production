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
