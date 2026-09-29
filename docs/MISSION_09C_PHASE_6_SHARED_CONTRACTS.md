# Mission 09C Phase 6 — Shared Contracts / API Contract Isolation & Standalone Build Verification

**Status:** IN PROGRESS

## Completed in this phase

- Established explicit shared package boundaries under `packages/`.
- Added a minimal API error/response type contract under `@trexio/types`.
- Added an API client boundary with no Supabase/database dependency.
- Added a config boundary for API base URL resolution.
- Kept validation package intentionally empty until a schema is proven to be shared.

## Dependency rules

```
apps/web   ─┐
apps/admin ─┼─> packages/* ─> API HTTP contract
            │
            └──────────────X────────> Supabase/PostgreSQL

apps/api -> repositories -> Supabase/PostgreSQL
```

Shared packages must not import database clients, service-role credentials, Express runtime state, or server-only modules.

## Standalone build gate

This phase cannot be marked complete yet because `apps/web` and `apps/admin` are boundary scaffolds, not standalone buildable applications. The current production frontend remains `frontend/` (CRA/CRACO).

Required before closing Phase 6:

1. extract `frontend/` into `apps/web/` without changing runtime behavior;
2. establish `apps/admin/package.json` and an independent admin build boundary;
3. make both apps consume only API contracts/API client for backend access;
4. install/build each workspace independently from its own package manifest;
5. verify the API runtime independently from either UI application;
6. verify there are no frontend/admin direct Supabase persistence imports;
7. retire the legacy frontend boundary only after successful verification.

## Result

Shared contract isolation is structurally established. Full standalone build verification remains blocked by the pending Web/Admin extraction.
