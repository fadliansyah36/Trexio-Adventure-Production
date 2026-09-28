# Mission 09C Phase 2 — Dependency-Safe API Boundary Extraction

Status: **COMPLETE — Phase 2**

Date: 2026-09-29

## Objective

Move the active production API runtime boundary from the repository root into
`apps/api` without changing business logic, database authority, route contracts,
or runtime asset locations.

This phase is an **extraction boundary**, not the final standalone API
repository. The legacy `src/` tree remains in place intentionally until the
dependency graph is mapped and extracted in later 09C phases.

## Baseline

Phase 1 completed at:

`fa7e4edd64e80429439fac142374cd95e27f31be`

Phase 2 ends at the current `main` head.

## Changes executed

### 1. API runtime extracted

The former 13k+ line root `server.js` runtime was copied to:

`apps/api/server.js`

The target runtime now:

- declares `ROOT_DIR = path.resolve(__dirname, '..', '..')`
- resolves repository-owned runtime assets through `ROOT_DIR`
- resolves transitional backend modules through explicit `../../src/*` imports
- preserves existing Express routes, middleware, auth, repositories, AI, and
  Supabase/PostgreSQL runtime behavior
- removes the unused `child_process.execSync` import verified during extraction

### 2. Root compatibility entrypoint

Root `server.js` is now only:

`require('./apps/api/server');`

This prevents two competing API implementations from remaining active while
preserving compatibility for tooling or operators that still invoke
`node server.js`.

### 3. Runtime scripts redirected

Root `package.json` now routes:

- `npm run dev` -> `node apps/api/server.js`
- `npm start` -> `node apps/api/server.js`

No dependency lockfile was changed because root dependency installation remains
the current dependency provider during this transitional extraction.

### 4. API package boundary created

`apps/api/package.json` establishes the future API application package.

It is intentionally marked transitional. It does **not** claim independent
installation yet because runtime dependencies still resolve from the repository
root and backend source modules remain under `src/`.

### 5. Structural verification added

New verifier:

`scripts/verify-api-boundary.js`

New command:

`npm run verify:api-boundary`

The verifier checks:

- API runtime exists at `apps/api/server.js`
- root `server.js` is only a compatibility delegate
- root `dev/start` scripts point to `apps/api/server.js`
- API runtime has an explicit repository-root boundary
- frontend build and uploads resolve from the repository root
- no unsafe legacy `./src/*` import remains inside the extracted runtime
- transitional `../../src/*` dependency is explicit

## Dependency boundary after Phase 2

Current direction:

```
apps/api/server.js
       |
       +--> ../../src/auth
       +--> ../../src/db
       +--> ../../src/repositories
       +--> ../../src/ai
       +--> ../../src/backpacker
       |
       +--> ROOT_DIR/frontend/build
       +--> ROOT_DIR/uploads
       +--> ROOT_DIR/backend/uploads (legacy compatibility)
```

This is deliberate. Moving `src/` before its consumers are mapped would
create broken relative imports and make it harder to distinguish true
dependencies from residual code.

## What was NOT changed

- No database schema or migration was changed
- No API route contract was intentionally changed
- No Supabase table was changed
- No `src/` module was moved or deleted
- No `frontend/` source was moved
- No `backend/` residual directory was deleted
- No `drizzle/` artifact was deleted
- No legacy booking/payment data was deleted
- No new database persistence path was introduced

## Verification result

Structural verification passed before this document was written:

- target runtime exists
- explicit `ROOT_DIR` exists
- target runtime uses explicit transitional `../../src/*` imports
- root-relative frontend/upload paths are preserved
- root server is a compatibility shim
- root start/dev scripts target `apps/api/server.js`

The repository compare from Phase 1 to Phase 2 contains six commits and the
expected boundary changes only.

## Exit criteria

| Gate | Result |
|---|---|
| API target boundary created | PASS |
| Runtime logic transferred without intentional business-logic rewrite | PASS |
| Root runtime converted to compatibility entrypoint | PASS |
| Asset paths made location-independent | PASS |
| Legacy relative `./src` imports removed from target | PASS |
| Root start/dev scripts redirected | PASS |
| Structural verifier added | PASS |
| Database/runtime contract intentionally unchanged | PASS |
| Fully standalone API dependency installation | DEFERRED |
| `src/` physical extraction | DEFERRED |

## Next

**Mission 09C Phase 3 — Dependency Graph & Module Extraction**

The next phase should map and extract the modules currently reached through
`apps/api/server.js`, starting with:

1. `src/auth`
2. `src/db`
3. `src/repositories`
4. `src/ai`
5. `src/backpacker`
6. remaining root-level runtime helpers

No module should be moved or deleted until its imports, consumers, environment
requirements, and runtime side effects are verified.
