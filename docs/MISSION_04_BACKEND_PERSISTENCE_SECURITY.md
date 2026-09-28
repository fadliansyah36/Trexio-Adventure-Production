# MISSION 04 — Backend Persistence Boundary & Security Hardening

Status: **Implemented**
Branch: `main`

## Objective

Mission 04 begins the incremental backend consolidation without a big-bang rewrite of the existing Express API or PWA.

The implementation priorities are:

1. Remove confirmed security exposures immediately
2. Stop destructive background memory-to-PostgreSQL reconciliation
3. Establish a repository boundary for the transitional JSONB application store
4. Strengthen the security scanner so the same classes of defects are caught earlier
5. Preserve existing API contracts while preparing domain-by-domain migration

## Implemented

### 1. Embedded credential removal

Removed source-code fallback values for:

- JWT secret
- Initial admin password

Production now refuses to start when `JWT_SECRET` or `SEED_ADMIN_PASSWORD` is not configured appropriately.

Development uses ephemeral generated values instead of repository-stored credentials.

### 2. Sensitive browser logging removal

Removed client-side logging of:

- Axios `fullConfig`
- booking request DTO/body
- raw server response body

These structures may contain authorization headers, cookies, personal information, or payment-related data.

The remaining diagnostic log contains only endpoint, method, HTTP status, error code, and a sanitized message.

### 3. Production CORS tightening

Preview infrastructure domains such as:

- `*.run.app`
- `*.emergentagent.com`
- `*.emergent.host`

are now accepted only outside production.

Production keeps explicit configured origins and `*.trexio.id`.

### 4. Destructive periodic mirror removed

Removed the 20-second `startPostgresMirror()` mechanism.

The previous mechanism periodically treated the in-memory arrays as the complete database snapshot and could delete PostgreSQL rows that were absent from memory.

Persistence is now explicit through mutation-triggered persistence calls.

This is a transitional step: the in-memory compatibility layer still exists, but there is no longer a periodic destructive reconciliation process.

### 5. Repository boundary introduced

Added:

`src/repositories/appDocumentRepository.js`

It provides a controlled boundary for:

- list
- save
- remove
- replace (legacy transitional bulk persistence)

The Express runtime now accesses application-document hydration/persistence through this repository boundary.

New domain code should prefer single-document save/remove operations rather than bulk replacement.

### 6. Security scanner strengthened

`scripts/security-scan.js` now checks for:

- embedded credential/private-key material
- sensitive request configuration/body logging in frontend code

This extends the existing SAST gate.

## Dead-code policy

Confirmed obsolete Mission 04 code was removed:

- periodic mirror timer
- periodic mirror function/call
- embedded credential fallback branches

No other module was deleted solely based on naming or age; unreferenced status must be verified before deletion to avoid breaking the existing 500+ route surface.

## Not changed intentionally

- Existing Express runtime remains active
- Existing API contracts remain intact
- PostgreSQL remains the canonical production database direction
- Core relational migration is not performed as a big-bang change
- Payment flow was not rewritten in this mission
- Existing TypeORM/NestJS legacy stack was not deleted yet because Mission 03 identified it as a broader migration task

## Verification

Repository-level static verification performed after the changes:

- Confirmed embedded JWT fallback value is absent
- Confirmed embedded admin password fallback is absent
- Confirmed periodic mirror function/timer is absent
- Confirmed legacy direct `loadAppDocs()` / `replaceAppCollection()` calls are absent from `server.js`
- Confirmed repository boundary is wired into `server.js`

The runtime test suite was **not executed in this connector session**. Therefore this mission does not claim a successful live application test/build.

## Next Mission

Mission 05 should focus on **Core Domain Repository Migration**, starting with low-risk read/write domains and preserving endpoint compatibility:

1. Vendors
2. Trips
3. Bookings
4. Payments
5. Users/auth persistence

Each domain should move from:

`route → in-memory array → mirror`

toward:

`route → service → repository → PostgreSQL`

with explicit read/write ownership and verification before the next domain is migrated.
