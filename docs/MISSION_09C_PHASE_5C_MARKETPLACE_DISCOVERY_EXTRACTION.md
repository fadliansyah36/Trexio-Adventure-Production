# Mission 09C Phase 5C — Marketplace & Discovery Route Extraction

**Status:** IMPLEMENTED — API syntax CI verified

## Objective

Extract the public Marketplace / Discovery route registration from the large `apps/api/server.js` runtime while preserving endpoint contracts, middleware behavior, compatibility aliases, and existing service dependencies.

## Extracted module

`apps/api/modules/routes/marketplace.js`

The module exposes an explicit registration boundary:

`registerMarketplaceRoutes({ ...dependencies })`

It owns the following HTTP routes:

- `GET /categories/:slug`
- `GET /destinations`
- `GET /trips`
- `GET /trips/featured`
- `GET /trips/:trip_id`
- `GET /search/suggestions`
- `POST /search/smart`
- `GET /search/smart`
- `POST /search/discovery`
- compatibility aliases under `/api/search/*`

## Dependency boundary

The route module receives:

- Express routers / app
- marketplace read-model arrays
- category catalog data
- `enrichTripWithVendor`
- `findProduct`
- AI Smart Search service
- existing rate limiter

The module does not:

- open database connections
- import Supabase persistence code
- own repositories
- mutate the frontend
- introduce a database migration

This keeps the dependency direction aligned with:

`web/admin -> API route modules -> application services -> repositories -> Supabase`

## Runtime repair discovered during verification

Phase 5B had left the `GET /chat/conversations` handler body in `apps/api/server.js` without its original route wrapper. That created an unmatched `});` and made the API runtime syntactically invalid.

The original boundary was restored:

`api.get('/chat/conversations', requireAuth, ...)`

No chat behavior was redesigned; this was a boundary-integrity repair required before continuing decomposition.

## Verification

A dedicated GitHub Actions workflow was added:

`.github/workflows/api-syntax-verification.yml`

It executes:

- `node --check apps/api/server.js`
- `node --check apps/api/modules/routes/marketplace.js`

Result for commit `6882f1fe4e993393b746d5f1cad5a18090f2c533`:

**PASS**

The broader PWA and Security/SAST workflows were also triggered from the same commit.

## Result

The production API keeps the same public Marketplace / Discovery route surface while reducing the composition-root responsibility of `apps/api/server.js`.

No legacy persistence boundary was deleted as part of this phase.

## Next

Continue extracting the next business-domain route boundary, with Booking / Payment and remaining Vendor / Admin / Super Admin routes handled separately so domain ownership remains explicit.
