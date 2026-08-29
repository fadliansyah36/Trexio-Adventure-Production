# TREXIO GEMINI AGENT OPERATING GUIDELINES

This repository adheres to strict production engineering standards. All Gemini models operating on this codebase must strictly observe the following protocols:

1. **Database Backend**:
   - Supabase PostgreSQL is the exclusive persistent database engine.
   - Do not propose, generate, or switch to local SQLite, JSON files, or mock data stores.
   - Database operations must leverage Supabase client, Drizzle ORM, or PostgreSQL connection pooling.

2. **No Mocking or Synthetic Placeholders**:
   - Real database queries and real API integration only.
   - If an integration credential or API endpoint is unavailable, raise a blocker directly with the user.

3. **Production Integrations**:
   - **Payment Gateway**: Midtrans Snap/Core API with SHA-512 webhook signature verification.
   - **AI/LLM**: `@google/genai` SDK with real-time grounding against PostgreSQL data.
   - **Authentication & RBAC**: Supabase Auth + JWT with 10 discrete roles and server-side middleware guards.
   - **Multi-Tenancy**: Isolated tenant scoping via `resolveTenantScope` and `requireTenantAccess`.

4. **Pull / Push Verification**:
   - Automated repository integrity check must pass (`npm run verify-integrity`).
   - Automated SAST and security scan must pass (`npm run security-scan`).
