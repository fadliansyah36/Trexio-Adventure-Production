# Mission 09C — Standalone Build Gate

**Status:** IN PROGRESS / GATED

This gate defines what “standalone” means for `apps/web` and `apps/admin`.

## Required conditions

Each application must:

1. own its own `package.json`;
2. own its source tree under its application boundary;
3. expose its own `build` script;
4. not reference the legacy `frontend/` source tree;
5. not import backend persistence modules;
6. build from its own working directory without relying on the legacy frontend package.

Verification command:

`npm run verify:standalone-apps`

## Important architectural rule

A wrapper such as `npm --prefix ../../frontend run build` does **not** qualify as standalone.

Likewise, symlinking or importing `frontend/src` into `apps/web` or `apps/admin` is not considered extraction.

## Current migration state

The API boundary and route/domain decomposition are already physically under `apps/api`. Shared API contracts are under `packages/*`.

The remaining frontend migration must physically separate:

- public/customer PWA -> `apps/web`
- tenant/admin application -> `apps/admin`

The existing CRA/CRACO application under `frontend/` remains the source of truth until its source is copied/moved into the two target applications and all imports are rewritten.

## Gate policy

The verifier intentionally fails while either application is only a scaffold. This prevents a false green “standalone” status.

Only after the source trees are physically independent should the legacy `frontend/` location be retired.
