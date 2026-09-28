# TREXIO — MISSION 02: Runtime / Dependency / API Mapping

**Status:** COMPLETED — mapping baseline  
**Repository:** fadliansyah36/Trexio-Adventure-Production  
**Branch:** main  
**Verified HEAD:** 677100d85829f7cf329004766723301fb53ecaf1  
**Scope:** runtime entrypoint, dependencies, API routing, frontend API clients, auth, AI, backpacker, database runtime

## 1. Runtime Entry Point

Root package scripts currently define:

- `dev` -> `node server.js`
- `start` -> `node server.js`
- `build` -> `npm --prefix frontend run build`

Therefore the effective production/runtime entrypoint is **root `server.js`**.

The NestJS entrypoint `src/main.ts` exists but is not invoked by the root `start` or `dev` scripts.

### Runtime conclusion

```
Browser
  -> React CRA/CRACO PWA
  -> /api
  -> Express server.js
  -> Express API router
  -> Supabase PostgreSQL sync layer
```

NestJS currently exists as a parallel architecture, not the effective runtime path.

## 2. Backend Architecture Findings

### Active runtime

- Express 4
- `server.js` ~547 KB
- `api = express.Router()`
- mounted at `/api`
- same router is also mounted at `/api/v1`

The active API router contains **371 direct route declarations** in `server.js`.

Additional mounted routers:

- AI router: **78 route declarations**
- Backpacker router: **51 route declarations**

These numbers are declaration counts, not unique externally reachable endpoints; aliases and nested prefixes exist.

### Important API prefix issue

The active router is mounted at:

- `app.use('/api', api)`
- `app.use('/api/v1', api)`

Inside the same router, operator routes are declared with paths beginning with `/api/v1/operator/...`.

This creates a prefix inconsistency and must be normalized during API contract consolidation.

## 3. Frontend API Layer

Two HTTP client abstractions are currently present:

### `frontend/src/lib/api.js`

Exports:

- `api` (Axios)
- `apiFetch`
- `apiClient` re-export

### `frontend/src/lib/apiClient.js`

Creates a second Axios instance.

Both attach:

- `Authorization: Bearer ...`
- tenant headers
- `withCredentials: true`

### Finding

There are **two overlapping API client paths** and multiple authentication token conventions.

This should be consolidated later into a single typed/central API client.

## 4. Authentication Runtime

Active Express authentication contains:

- email/password login
- registration
- JWT
- refresh
- 2FA
- OTP
- Google/Supabase session
- profile/session management
- logout
- Supabase Auth integration

Frontend `AuthContext.jsx` calls the active Express endpoints through `/api/auth/*`.

### Important architecture finding

There are two auth implementations:

1. Active Express/JWT/Supabase hybrid in `server.js`
2. NestJS AuthModule in `src/modules/auth`

The NestJS AuthModule is not the current runtime path.

## 5. AI Runtime

AI is actively mounted into Express:

```
server.js
  -> createAIRoutes()
  -> /api/ai/*
```

AI router currently contains **78 route declarations** covering:

- recommendations
- assistant/chat
- vendor copilot
- safety
- super-admin command center
- risk
- growth intelligence
- evaluation
- feedback
- AI events

The AI router receives the active Express authentication and super-admin middleware from `server.js`.

AI rate limiters exist inside the AI router.

## 6. Backpacker Runtime

Backpacker is actively mounted into Express:

```
server.js
  -> createBackpackerRouter()
  -> /api/backpacker/*
```

It contains **51 route declarations** covering:

- backpacker profile
- travel intents
- buddy matching
- connections
- shared rides
- journeys
- locations/consent
- expenses/cost split
- assistance
- admin operations

It receives the active Express authentication middleware.

## 7. Database Runtime

The active Express runtime imports:

`src/db/cloudSqlSync.js`

which uses `pg` and connects through:

- `DATABASE_URL`, or
- discrete SQL environment variables.

The runtime labels the provider as **Supabase PostgreSQL**.

Core collections are hydrated from PostgreSQL into in-memory arrays on boot, and writes are synchronized back through the cloud SQL sync layer.

### Important finding

The active runtime is therefore not yet a pure repository/service/database architecture:

```
Request
  -> Express handler
  -> in-memory collection
  -> cloudSqlSync
  -> PostgreSQL
```

rather than:

```
Request
  -> Controller
  -> Service
  -> Repository
  -> PostgreSQL
```

This is a key Mission 03/04 refactor target.

## 8. Database Schema Initialization

`cloudSqlSync.js` contains runtime `CREATE TABLE IF NOT EXISTS` statements for core tables and JSONB application-document tables.

This means part of schema management currently occurs at application runtime rather than exclusively through versioned migrations.

This will be reconciled in Mission 03.

## 9. Parallel NestJS Architecture

NestJS currently contains:

- `src/main.ts`
- `src/app.module.ts`
- DatabaseModule
- AuthModule
- TripsModule
- BookingsModule
- ChatModule
- HealthModule

However:

- `src/main.ts` is not the root runtime entrypoint.
- NestJS DatabaseModule uses **TypeORM + SQLite** by default.
- TripsService contains in-memory demo trips.
- BookingsService contains in-memory demo booking/payment state.

Therefore these modules must not be treated as the production source of truth yet.

## 10. Dependency Findings

Root dependencies include multiple backend/data stacks simultaneously:

- Express
- NestJS
- TypeORM
- Drizzle
- pg
- Supabase
- Passport/JWT
- Midtrans
- Gemini

Frontend contains overlapping data/API libraries including:

- Axios
- Fetch helper
- React Query
- SWR

This is not immediately a runtime failure, but it increases architectural ambiguity and maintenance cost.

Dependency consolidation belongs after runtime mapping and schema mapping.

## 11. PWA Runtime

Frontend entrypoint:

`frontend/src/index.js`

Current runtime initializes:

- Core Web Vitals monitoring
- accessibility audit
- HTTPS redirect for production
- React Query
- service worker
- service-worker update detection
- PostHog service-worker telemetry
- ErrorBoundary

The PWA layer is therefore active and should be preserved during backend consolidation.

## 12. Critical Runtime Map

```
                TREXIO PWA
                    |
                    v
             React / CRA / CRACO
                    |
          +---------+---------+
          |                   |
       api.js            apiClient.js
          |                   |
          +---------+---------+
                    |
                    v
               /api
                    |
                    v
              Express server.js
                    |
       +------------+-------------+
       |            |             |
      Core          AI        Backpacker
       |            |             |
       +------------+-------------+
                    |
             in-memory state
                    |
                    v
             cloudSqlSync.js
                    |
                    v
          Supabase PostgreSQL
```

Parallel but currently non-active:

```
src/main.ts
   |
NestJS AppModule
   |
+-- TypeORM
   |
SQLite / trexio_database.sqlite
```

## 13. Mission 02 Findings

### F-02.01 — Runtime ambiguity
**Severity:** High

Express `server.js` is the active runtime while NestJS exists in parallel.

### F-02.02 — Database architecture ambiguity
**Severity:** High

Active runtime uses PostgreSQL sync/in-memory hydration while NestJS uses TypeORM/SQLite.

### F-02.03 — API client duplication
**Severity:** Medium

Frontend has overlapping Axios/fetch client abstractions.

### F-02.04 — Auth architecture duplication
**Severity:** High

Express auth is active while NestJS AuthModule provides another implementation.

### F-02.05 — API prefix inconsistency
**Severity:** High

`/api/v1` is both an application mount and embedded in route declarations.

### F-02.06 — Runtime schema management
**Severity:** High

Database tables are partly initialized through runtime SQL instead of exclusively versioned migrations.

### F-02.07 — In-memory business state
**Severity:** High

Core runtime collections are hydrated into memory and synchronized back to PostgreSQL.

### F-02.08 — Parallel demo state in NestJS
**Severity:** High

NestJS Trips/Bookings services still contain in-memory sample state and must not become production runtime accidentally.

## 14. Decisions for Next Missions

1. Do not switch runtime to NestJS yet.
2. Do not delete `server.js` yet.
3. Do not delete SQLite/NestJS yet.
4. Do not rewrite all API endpoints yet.
5. Establish canonical PostgreSQL schema and data ownership first.
6. Consolidate API contracts after source-of-truth is established.
7. Consolidate authentication only after current Express/Supabase behavior is fully mapped.
8. Preserve existing PWA behavior while backend changes are made.
9. All production fixes are to be committed directly to `main`, per project decision.

## 15. Next Mission

**MISSION 03 — Database & Data Source Reconciliation**

Primary objectives:

- map every persistence path
- compare Supabase schema vs runtime-created schema
- compare Drizzle schema/migrations
- identify TypeORM/SQLite consumers
- identify in-memory collections and their DB mirrors
- identify duplicate/legacy tables
- define canonical tables and ownership
- prepare safe migration strategy
- remove ambiguity before backend consolidation

**No large backend rewrite should begin until Mission 03 establishes the canonical data model.**
