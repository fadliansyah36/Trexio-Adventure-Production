# Mission 09E — Frontend Independence & Legacy Retirement

**Status:** GATE RUNNING

## Scope

Mission 09E closes the physical frontend separation after 09C/09D:

- `apps/web` is the canonical public PWA source/build boundary.
- `apps/admin` is the canonical tenant/admin + super-admin source/build boundary.
- `apps/api` is the backend runtime boundary.
- legacy `frontend/` has been physically retired.
- root `server.js` remains only as a compatibility entrypoint to `apps/api/server.js`.
- frontend applications do not access Supabase persistence directly.

## Retirement

The legacy `frontend/` tree was removed only after the standalone build gate had passed on the preceding extraction revision.

## Runtime Gate

The authoritative post-retirement gate is:

- `09C Standalone Build Gate`
- `09E-09F Runtime and PWA Verification`
- `PWA Build Verification`
- `API Syntax Verification`
- `Trexio Security & SAST Gate`

The latest 09E runtime gate initially failed only in the API runtime smoke job. The `apps/web` and `apps/admin` builds and structural checks passed. Investigation found legacy Cloud SQL/Firebase diagnostic imports from `apps/api/server.js` into retired root `src/db/*` modules.

Those imports were removed because the current API persistence authority is Supabase PostgreSQL and the legacy diagnostic modules were no longer valid standalone runtime dependencies.

## Closure condition

09E is GREEN only after the post-fix `09E-09F Runtime and PWA Verification` and standalone gates complete successfully on the current main revision.

No legacy `frontend/` rollback copy is retained.
