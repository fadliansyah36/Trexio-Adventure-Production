# Mission 09A — Current Repository Architecture Discovery

## Scope

This mission inventories the current monorepo before structural refactoring. No application source files are moved or deleted in Mission 09A.

## Current top-level architecture

Observed on `main`:

- `frontend/` — active React frontend application boundary
- `server.js` — active Node/Express production runtime entry point
- `src/` — backend support/domain code currently shared by the Node runtime
- `supabase/` — database migrations and schema artifacts
- `scripts/` — migration, verification, security and repository automation
- `docs/` — architecture, migration, security and operational documentation
- `tests/` / `test_reports/` and root-level test artifacts — mixed historical/current verification assets
- `backend/` — residual directory containing tests; requires provenance/usage verification before relocation or deletion
- `drizzle/` — typed schema representation / historical ORM artifacts; not the production migration authority
- `public/` and `uploads/` — runtime/static asset areas requiring deployment-boundary review
- root-level generated/audit/design artifacts also exist and require classification before final separation

## Current backend structure

```
server.js
src/
├── ai/
├── auth/
├── backpacker/
├── core/
├── db/
├── middleware/
└── repositories/
```

The active booking/payment repositories are under `src/repositories/` and use the Supabase PostgreSQL layer under `src/db/`.

## Current frontend structure

```
frontend/
└── src/
    ├── components/
    ├── constants/
    ├── context/
    ├── hooks/
    ├── lib/
    ├── pages/
    ├── services/
    └── utils/
```

The frontend is therefore already a recognizable application boundary, but it is not yet located under the target `apps/web/` boundary.

## Target separation direction

The target is a modular monorepo that can later be extracted into independent repositories:

```
apps/
├── web/
├── admin/
└── api/

packages/
├── types/
├── validation/
├── api-client/
├── ui/
└── config/
```

The current Node/Express runtime must not be assumed to become the final API technology merely by moving folders. Mission 09B will determine the correct backend boundary and preserve the agreed API architecture.

## Preliminary mapping

| Current area | Target boundary | Initial classification |
|---|---|---|
| `frontend/` | `apps/web/` | Active application |
| `server.js` | `apps/api/` entrypoint candidate | Active runtime |
| `src/auth/` | `apps/api/` or shared contract candidate | Requires dependency mapping |
| `src/ai/` | `apps/api/` | Backend capability |
| `src/core/` | `apps/api/` | Backend/domain capability |
| `src/db/` | `apps/api/` | Backend infrastructure |
| `src/repositories/` | `apps/api/` | Backend persistence |
| `src/middleware/` | `apps/api/` | Backend infrastructure |
| `src/backpacker/` | Domain-specific; requires mapping | Requires dependency audit |
| `supabase/` | Database boundary | Retain separately from app runtime |
| `scripts/` | Tooling/CI boundary | Split by ownership later |
| `docs/` | Repository governance | Retain at monorepo level until extraction |
| `drizzle/` | Migration/schema artifact | Requires final authority decision |
| `backend/` | Unknown/residual | Do not move/delete until verified |
| `public/`, `uploads/` | Deployment/runtime assets | Requires ownership audit |

## Key findings

1. The repository is **not yet structurally separated** into `apps/web`, `apps/admin`, and `apps/api`.
2. There is currently a single active frontend application under `frontend/`; a separately identifiable admin application boundary has not yet been established by this discovery.
3. The backend is a large root-level `server.js` plus `src/` modules, so backend extraction needs an explicit dependency/domain mapping before movement.
4. There are residual/historical directories and artifacts (`backend/`, `drizzle/`, root test/audit artifacts) that must not be deleted solely by appearance.
5. The repository already contains useful boundaries for database, repositories, middleware, auth, AI and frontend services, which can be used to construct the target modular architecture.
6. Mission 09A therefore establishes the baseline; structural movement belongs to Mission 09C after dependency mapping.

## Separation invariants

Future refactoring must preserve:

- frontend has no direct database/service-role access
- admin has no direct database/service-role access
- backend owns database access
- Supabase remains the database authority
- API is the contract boundary
- shared packages contain portable contracts/utilities, not backend persistence implementations
- no business logic is deleted without verified dead-code evidence
- each application boundary must be independently buildable before repository extraction

## Mission 09A status

**COMPLETE — DISCOVERY BASELINE ESTABLISHED**

Next: **Mission 09B — Trexio Business Architecture Alignment & Domain Boundary Mapping**.
