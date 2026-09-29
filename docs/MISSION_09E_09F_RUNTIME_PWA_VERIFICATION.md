# Mission 09E / 09F — Runtime & PWA Verification

**Status: VERIFICATION GATE ACTIVE**

## Scope

This gate follows the physical extraction of:

- `frontend/src` -> `apps/web/src`
- `frontend/src/pages/admin` + `frontend/src/pages/super` -> `apps/admin/src`
- API runtime -> `apps/api`

## Verification order

1. Post-extraction integrity
2. API contract isolation
3. Dependency decoupling
4. API standalone syntax/build
5. API runtime smoke
6. Web standalone build
7. Admin standalone build
8. Web/admin build artifact existence

Workflow:

`.github/workflows/09e-09f-runtime-pwa.yml`

## API runtime smoke

The CI starts `apps/api/server.js` with non-production test credentials and verifies that the HTTP runtime responds with the expected structured API 404 response. This proves the extracted API process can start independently of the legacy frontend server.

No production credentials are used.

## PWA gate

`apps/web` is built independently from its own package boundary. The gate requires a non-empty `build/index.html`.

`apps/admin` is built independently from its own package boundary and has the same artifact requirement.

## Legacy frontend retirement gate

The `frontend/` directory is still retained as a rollback/reference copy until the CI verification above is green.

It must not be used by:

- `apps/api`
- `apps/web`
- `apps/admin`

The root `server.js` is only a compatibility entrypoint to `apps/api/server.js`.

After a successful CI verification run, the next destructive step is a separate retirement commit that removes the legacy `frontend/` boundary and removes its root workspace/build dependency. That deletion must not be combined with the verification change.

## Important

Repository presence of the workflow or verifier scripts is **not** considered proof of completion. Completion requires a successful GitHub Actions run for the current main revision.

