# Mission 09D — API Contract Isolation

**Status:** IMPLEMENTED — CI ENFORCED

Mission 09C Phase 6 established shared contract packages and the API client boundary. Mission 09D now makes the dependency direction enforceable.

## Locked dependency direction

`web/admin -> packages -> API -> repositories -> Supabase PostgreSQL`

### Forbidden dependencies

- `packages/*` must not import Supabase SDKs or open database connections
- `apps/web` and `apps/admin` must not import PostgreSQL/SQLite/ORM drivers
- `apps/web` and `apps/admin` must not import backend `src/db` or `src/repositories` directly

## Verification

Run:

`npm run verify:api-contracts`

The verifier scans source files under `apps/web`, `apps/admin`, and `packages` and fails on the forbidden dependency patterns above.

## Current state

The shared contract packages are intentionally small. Contracts are added only when a shape is proven to cross an application boundary. No speculative domain model duplication is introduced.

The existing API runtime remains the authoritative server boundary at `apps/api/server.js`.

## Next

After the contract guard is green, proceed to standalone application build verification and then the 09C/09D integration gates before retiring legacy root locations.

## Dependency Decoupling Gate

**Status:** IMPLEMENTED — CI ENFORCED

Added `scripts/verify-09d-dependency-decoupling.js` to enforce:

- no direct Supabase SDK usage from `apps/web`, `apps/admin`, or `packages/*`;
- no PostgreSQL/SQLite/ORM imports from web/admin;
- no direct backend `src/db` or `src/repositories` imports from web/admin;
- no direct backend server imports from web/admin;
- no legacy frontend import from the API runtime;
- required standalone manifests remain present.

The root command is:

`npm run verify:09d-dependencies`

A dedicated workflow, `.github/workflows/09d-api-contract-isolation.yml`, now runs the contract gates first and then independently installs/builds `apps/api`, `apps/web`, and `apps/admin`.

### Gate semantics

A Git commit is not considered 09D-green merely because the verifier scripts exist. The authoritative completion condition is a successful CI run for:

1. API contract verification;
2. dependency decoupling verification;
3. API module graph verification;
4. standalone `apps/api` build;
5. standalone `apps/web` build;
6. standalone `apps/admin` build.

Local/container execution is not treated as a substitute for the GitHub Actions build result.
