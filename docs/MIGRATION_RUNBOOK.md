# TREXIO DATABASE MIGRATION RUNBOOK

## 1. MIGRATION PRINCIPLES
- **Expand-Contract Strategy**: Always add new columns as nullable or with defaults first.
- **Zero-Downtime**: Never lock active production tables during peak business hours.
- **Idempotency**: All migrations must be idempotent (`CREATE INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).

---

## 2. MIGRATION EXECUTION FLOW
1. **Define Schema**: Update `/src/db/schema.ts` using Drizzle ORM.
2. **Generate Migration**: Run Drizzle migration generator:
   ```bash
   npx drizzle-kit generate
   ```
3. **Verify Local/Staging**: Test migration execution on staging database instance.
4. **Execute on Production**: Run Cloud SQL migration sync:
   ```bash
   node /src/db/cloudSqlSync.js
   ```
5. **Verify Governance**: Call `/api/governance` to ensure 12 core tables and foreign key indexes remain valid.
