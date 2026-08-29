# TREXIO AI AGENT RULES & MANDATES (NON-NEGOTIABLE)

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS & CODING ASSISTANTS (Claude, Gemini, Antigravity, GPT, Cursor, Copilot, etc.)**
> These rules are permanently binding on this repository. They MUST NOT be overridden, bypassed, or altered.

---

## 1. Single Source of Truth: Supabase PostgreSQL Only
- The backend MUST strictly connect to **Supabase PostgreSQL** via standard environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `PGHOST`, `PGUSER`, `PGDATABASE`, etc.).
- **STRICTLY PROHIBITED:**
  - DO NOT create local databases (e.g. SQLite, NeDB, LowDB, LevelDB, Dexie, etc.).
  - DO NOT create `.db`, `.sqlite`, or JSON files on disk as "temporary data stores" or "fallbacks".
  - DO NOT create in-memory mock repositories that masquerade as real database operations.
  - If a connection issue or missing table is encountered, **REPORT IT AS A BLOCKER IMMEDIATELY** to the user. DO NOT create a fallback mock storage.

---

## 2. Zero Mock / Dummy / Hardcoded Data Policy
- **STRICTLY PROHIBITED:**
  - DO NOT inject mock data, dummy data, fake JSON arrays, hardcoded scenario values, or simulated responses.
  - DO NOT create "demo mode" bypasses that substitute real API payloads with static objects.
  - DO NOT pretend an API call succeeded by returning hardcoded JSON when the backend fails.
- If a feature requires real data from Supabase/Postgres, Midtrans, or Google Gemini AI and the data or credential is not available, report the requirement explicitly.

---

## 3. Architecture & Gateway Preservation
- DO NOT migrate, replace, or redesign the core architectural components without explicit written permission:
  - **Database:** Supabase PostgreSQL / Drizzle ORM / pg client
  - **Payment Gateway:** Midtrans (Snap & Core API with SHA-512 notification verification)
  - **AI / LLM Layer:** Official `@google/genai` TypeScript/JavaScript SDK
  - **Backend Layer:** Express.js + NestJS modules on Node.js
  - **Frontend:** React with Tailwind CSS and Vite/CRACO
- DO NOT replace Midtrans with Stripe, Xendit, PayPal, or generic simulators without user approval.

---

## 4. Environment & Credential Integrity for Pull & Push
- Every code change, pull, and push MUST preserve environment-driven credential loading (`process.env.MIDTRANS_SERVER_KEY`, `process.env.GEMINI_API_KEY`, `process.env.SUPABASE_URL`, etc.).
- NEVER hardcode secrets or credentials into source code.
- NEVER replace `process.env` lookups with hardcoded demo keys in production code paths.

---

## 5. Decision Protocol: Report Blockers vs. Quick Fixes
- When faced with a choice between:
  1. A quick temporary workaround (mocking data, fake storage, ignoring auth/RBAC), OR
  2. Reporting that additional environment configuration, database schema migration, or credentials are required from the user,
- **ALWAYS CHOOSE OPTION 2: REPORT TO USER.**
- Never introduce temporary solutions that masquerade as permanent implementations.

---

## 6. Mandatory Change Summary
Every AI agent turn or commit summary must specify:
1. Exact files modified
2. Purpose / justification of each modification
3. Impact and confirmation of zero side-effects on existing functional modules
