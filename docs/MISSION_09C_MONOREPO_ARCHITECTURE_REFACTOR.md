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

Next: **09C Phase 2 — Dependency-Safe API Boundary Extraction**.