# Mission 09D — API Contract Isolation

**Status:** IN PROGRESS

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
