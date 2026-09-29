# Mission 09C — Monorepo Architecture Refactor

## Phase 1 — Target Boundary Scaffold

**Status:** IN PROGRESS

This phase establishes the physical target boundaries without moving production source files prematurely.

### Established

- `apps/web/`
- `apps/admin/`
- `apps/api/`
- `packages/types/`
- `packages/validation/`
- `packages/api-client/`
- `packages/ui/`
- `packages/config/`

### Current runtime remains unchanged

- Frontend runtime source: `frontend/`
- Backend runtime: `server.js`
- Backend modules: `src/`
- Database authority: `supabase/`

### Why source is not moved yet

The current frontend is a CRA/CRACO application and the backend is a large Express runtime whose relative paths, static build path, uploads path, aliases, environment handling, route imports, and CI scripts depend on the existing layout. A blind filesystem move would create a runtime regression.

Mission 09C therefore uses dependency-safe extraction gates:

1. establish target boundaries;
2. inventory path/import/build/runtime dependencies;
3. extract API boundary;
4. extract web boundary;
5. extract admin boundary;
6. introduce shared packages only where contracts are proven;
7. verify standalone builds;
8. verify API and PWA runtime behavior;
9. only then retire legacy root locations.

### Locked dependency direction

`web/admin -> packages -> API -> repositories -> Supabase`

No frontend or shared package may access Supabase persistence directly.

### Phase 1 Result

Target monorepo boundaries are now represented physically in Git. Production behavior has intentionally not been changed yet.

Next: continue **09C API Runtime Decomposition** through domain-specific route extraction.

## Phase 5C — Marketplace & Discovery Route Extraction

**Status:** IMPLEMENTED — API syntax CI verified

Extracted public Marketplace / Discovery HTTP registration into:

- `apps/api/modules/routes/marketplace.js`

The module now owns:

- `/categories/:slug`
- `/destinations`
- `/trips`
- `/trips/featured`
- `/trips/:trip_id`
- `/search/suggestions`
- `/search/smart`
- `/search/discovery`
- existing direct `/api/search/*` compatibility aliases

The module receives runtime state and service dependencies explicitly from `apps/api/server.js`. It does not create a database connection or access Supabase persistence directly.

During verification, Phase 5B also exposed an orphaned chat route boundary left in `apps/api/server.js`. The original `GET /chat/conversations` route wrapper was restored before Phase 5C was considered complete.

Verification:

- `API Syntax Verification` — PASS on commit `6882f1fe4e993393b746d5f1cad5a18090f2c533`
- `node --check apps/api/server.js` — PASS
- `node --check apps/api/modules/routes/marketplace.js` — PASS
- PWA and Security/SAST workflows were triggered for the same commit and remained the broader repository gates.

Next: continue API route decomposition by business domain without moving persistence boundaries prematurely.

## Phase 5C — Marketplace & Discovery Route Extraction

**Status:** COMPLETE

The public marketplace/discovery HTTP route registration has been extracted from the monolithic API runtime into:

- `apps/api/modules/routes/marketplaceDiscoveryRoutes.js`

The module owns route wiring for:

- homepage configuration;
- Explore article discovery and sources;
- rental listing/detail discovery;
- public storefront/vendor discovery;
- public vendor product filtering/sorting;
- public vendor reviews;
- advertising package discovery;
- active sponsored placement discovery.

Public storefront compatibility aliases were retained, including the existing `/vendor/public/*` and `/api/public/vendors/*` forms.

### Dependency boundary

The route module receives business state and domain helpers through explicit dependency injection from `apps/api/server.js`. It does not open database connections, read environment secrets, or import repositories directly.

Current direction remains:

`web/admin -> API route boundary -> domain/application helpers -> repositories -> Supabase PostgreSQL`

### Phase 5C safety result

- No database schema changes
- No data migration
- No route contract intentionally removed
- Existing public route aliases preserved
- Legacy root `server.js` remains a compatibility entrypoint
- API runtime remains `apps/api/server.js`
- Marketplace/discovery route registration is now physically isolated from the API composition root

Next logical step: **Mission 09C Phase 6 — Shared Contracts / API Contract Isolation & Standalone Build Verification**.


## Phase 7 — Physical Web/Admin Extraction & Standalone Build Gate

**Status:** BUILD VERIFICATION IN PROGRESS

### Extraction completed

- `frontend/src` storefront/runtime source was physically extracted to `apps/web/src`.
- `frontend/src/pages/admin` and `frontend/src/pages/super` were physically extracted to `apps/admin/src/pages`.
- Shared frontend runtime dependencies required by the admin/super surfaces were copied into `apps/admin/src` so the admin application has an independent source boundary.
- `frontend/public` and CRA/CRACO build configuration were extracted into both application boundaries.
- `apps/web` and `apps/admin` now own independent package manifests.
- Direct `@supabase/supabase-js` dependency was removed from both frontend applications; persistence remains API-owned.
- `apps/api` no longer serves the frontend SPA and now has an explicit standalone runtime dependency manifest.
- Root `server.js` remains only a compatibility entrypoint to `apps/api/server.js`.

### Build gate

`.github/workflows/09c-standalone-build.yml` verifies independently:

1. `apps/api` — `node --check server.js`
2. `apps/web` — isolated `npm install` + `npm run build`
3. `apps/admin` — isolated `npm install` + `npm run build`

The gate must pass before Mission 09C is declared complete.

### Legacy retirement rule

The old `frontend/` source/build boundary has been removed from the repository. No API runtime may reintroduce frontend static serving.