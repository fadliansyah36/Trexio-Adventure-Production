# Mission 09C — Final Closure Gate

## Status: BLOCKED — CI standalone build evidence required

The physical extraction is present:

- `apps/web`
- `apps/admin`
- `apps/api`

The legacy root `server.js` is a compatibility entrypoint to `apps/api/server.js`.

The legacy `frontend/` tree is intentionally **not retired yet**.

### Closure gates

1. **Target boundaries present** — PASS
2. **Standalone package manifests** — PASS
3. **API runtime decoupled from frontend serving** — PASS
4. **Web/Admin physical extraction** — PASS
5. **Static provenance/dependency audit** — available via `node scripts/verify-09c-closure.js`
6. **Standalone CI build gate (API/Web/Admin)** — NOT VERIFIED from available GitHub workflow-run evidence
7. **Legacy frontend retirement** — BLOCKED until #6 is green

### Required standalone gate

`.github/workflows/09c-standalone-build.yml` independently runs:

- `apps/api: npm install && npm run build`
- `apps/web: npm install && npm run build`
- `apps/admin: npm install && npm run build`

No retirement commit should delete `frontend/` until that workflow has a successful run for the current extraction state.

### Decision

**Do not delete `frontend/` yet.**

This is a deliberate safety gate, not a failed extraction. The source boundaries have been materially extracted, but a closure claim requires observable green build evidence for the current tree.

After the workflow is green, the final retirement sequence is:

1. rerun provenance audit;
2. confirm no runtime/CI references to `frontend/`;
3. delete legacy `frontend/`;
4. rerun standalone build gate;
5. run API/PWA/security gates;
6. mark Mission 09C COMPLETE.
