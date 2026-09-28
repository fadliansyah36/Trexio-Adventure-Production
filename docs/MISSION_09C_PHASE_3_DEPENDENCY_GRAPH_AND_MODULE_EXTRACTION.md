# Mission 09C Phase 3 — Dependency Graph & Module Extraction

**Status:** COMPLETE — Extraction Wave 1

## Objective

Convert the API target boundary from a physical scaffold into a dependency-safe module boundary, without changing the external API contract or database behavior.

## Dependency graph established

```text
root server.js
  -> apps/api/server.js
      -> apps/api/modules/auth/*
      -> apps/api/modules/persistence/*
      -> apps/api/modules/repositories/*
      -> existing API-local runtime/domain logic
      -> Supabase PostgreSQL
```

The root `server.js` remains a compatibility entrypoint only. The production runtime is `apps/api/server.js`.

### Extracted modules

| Legacy location | New API boundary |
|---|---|
| `src/auth/supabaseAuth.js` | `apps/api/modules/auth/supabaseAuth.js` |
| `src/db/supabasePostgres.js` | `apps/api/modules/persistence/supabasePostgres.js` |
| `src/repositories/appDocumentRepository.js` | `apps/api/modules/repositories/appDocumentRepository.js` |
| `src/repositories/vendorRepository.js` | `apps/api/modules/repositories/vendorRepository.js` |
| `src/repositories/tripRepository.js` | `apps/api/modules/repositories/tripRepository.js` |
| `src/repositories/bookingRepository.js` | `apps/api/modules/repositories/bookingRepository.js` |
| `src/repositories/paymentRepository.js` | `apps/api/modules/repositories/paymentRepository.js` |

The seven legacy locations were retired only after the API runtime imports were rewired.

## Dependency direction

The extracted API modules follow this direction:

```text
API runtime
  -> auth
  -> domain repositories
  -> persistence
  -> PostgreSQL

API runtime
  -> does NOT import retired src/auth, src/db, or src/repositories paths
```

The repository modules depend on the extracted persistence boundary rather than directly depending on a legacy path.

## Verification

Added:

- `scripts/verify-api-module-graph.js`
- `npm run api:verify-module-graph`

The verifier is intentionally static and side-effect free. It checks:

1. all extracted modules exist;
2. all seven retired source locations are absent;
3. `apps/api/server.js` no longer imports the retired paths;
4. extracted modules do not re-import the legacy `src` runtime boundary.

It does not start Express and does not connect to PostgreSQL.

## Safety boundary

This phase deliberately did **not**:

- rewrite business routes;
- change API URLs;
- change database schemas;
- change Supabase migration authority;
- extract the large route/business logic body from `apps/api/server.js`;
- move the AI, Backpacker, or remaining domain modules blindly.

Those are separate extraction waves because their dependency graphs are materially larger.

## Result

**PASS — API Extraction Wave 1**

The repository now has a real API module boundary for authentication and persistence/repository infrastructure, while the root compatibility entrypoint remains intact.

Next: **Mission 09C Phase 4 — Domain/AI Module Extraction & API Runtime Decomposition**.
