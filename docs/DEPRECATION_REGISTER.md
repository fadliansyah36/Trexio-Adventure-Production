# TREXIO DATABASE DEPRECATION REGISTER

| Deprecated Entity / Feature | Entity Type | Reason for Deprecation | Target Replacement | Deprecation Date | Targeted Removal Date | Removal Plan & Status |
|---|---|---|---|---|---|---|
| Local JSON File Persistence (`db.json`) | Storage Repository | Replaced by Google Cloud SQL PostgreSQL for relational integrity & ACID compliance | Cloud SQL PostgreSQL Pool (`src/db/cloudSqlSync.js`) | 2026-08-10 | 2026-09-01 | Restrict local JSON files exclusively to static seed & developer fallback cache. Production mutations sync directly to PostgreSQL. Status: **DEPRECATED & GUARDED**. |
| Legacy Unverified Guide Role Strings | Field Value | Standardized under BNSP/APGI certification levels (`Guide Utama`, `Guide Madya`, `Guide Muda`) | Standardized `vendors.documents` JSONB structure | 2026-08-10 | 2026-08-30 | Migrated to verified JSONB document schema. Status: **MIGRATED**. |
