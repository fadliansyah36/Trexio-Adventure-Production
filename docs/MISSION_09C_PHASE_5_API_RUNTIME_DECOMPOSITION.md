# Mission 09C Phase 5 — API Runtime Decomposition & Route Module Extraction

**Status:** IN PROGRESS

## Objective
Continue the dependency-safe decomposition of the Trexio API runtime by moving route registration out of the monolithic `apps/api/server.js` into explicit module boundaries.

## Extracted in this phase
- `apps/api/modules/routes/uploadRoutes.js`
  - `POST /api/upload`
  - `POST /api/upload/avatar`
  - dependencies are injected: `api`, `requireAuth`, `upload`
- `apps/api/modules/routes/backpackerRoutes.js`
  - `GET /api/backpacker/routes`
  - `GET /api/backpacker/routes/search`
  - dependencies are injected: `api`, `requireAuth`, `trips`

The root `server.js` remains a compatibility entrypoint to `apps/api/server.js`.

## Dependency rule
Route modules may consume runtime/domain dependencies through explicit injection. They must not reach into global server state or instantiate their own database connections.

Current direction:
`route module -> injected application/domain dependency -> repository/persistence boundary`

## Safety result
- No database schema or migration changed
- No API path was intentionally renamed
- No business logic was intentionally changed
- Upload storage remains rooted at the repository-level `uploads/` directory
- Backpacker routes continue to use the canonical relational trip read model already hydrated by the API runtime
- Legacy inline route blocks were removed from `apps/api/server.js` after extraction

## Remaining decomposition
The API runtime still contains a large number of inline route families and shared mutable read models. Further extraction must be grouped by domain and dependency graph rather than by arbitrary file size.

Priority candidates:
1. Authentication/profile routes
2. Marketplace/discovery routes
3. Booking/payment routes
4. Vendor routes
5. Admin/super-admin routes
6. SEO/public routes
7. Community/backpacker domain routes
8. AI integration routes

## Gate
Phase 5 is not considered complete until extracted route modules have standalone syntax/load verification and the remaining route families have explicit ownership boundaries.

Next: continue domain-oriented route extraction with dependency verification before deleting any legacy inline route block.