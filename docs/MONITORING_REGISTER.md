# TREXIO PRODUCTION MONITORING REGISTER

| Service / Component | Metric Monitored | Data Source | Threshold Target | Alert Trigger Condition | Severity | Owner Role | Runbook ID | Status |
|---|---|---|---|---|---|---|---|---|
| Google Cloud SQL | Database Connectivity & Health Probe | `/api/health/cloudsql` | Latency < 100ms | Health probe fails or latency > 500ms | P0 | DBA_ROLE | `RB-001` | Active |
| Database Schema | Table Schema Drift Guard | `/api/governance` | 12 core tables | Missing table detected in PostgreSQL | P1 | DBA_ROLE | `RB-002` | Active |
| Payment Engine | Webhook Execution & Order Idempotency | `/api/payments/webhook` | 100% Reconciliation | Unhandled webhook failure or orphan transaction | P1 | Backend_Role | `RB-003` | Active |
| Storage Architecture | JSON Fallback Regression Guard | `/api/governance` | 0 JSON mutations | Attempt to persist business data to `db.json` | P1 | Backend_Role | `RB-004` | Active |
| Query Execution | Read/Write Query Latency | Cloud SQL Insights | Read < 20ms, Write < 50ms | Single query duration > 500ms | P2 | DBA_ROLE | `RB-005` | Active |
| Transport / Rides | Seat Inventory Atomic Decoupling | PostgreSQL Transaction Log | 0 negative seats | Seat count < 0 detected | P2 | Backend_Role | `RB-006` | Active |
| API Security & PII | Unauthorized Access & IDOR Attempts | Express Audit Middleware | 0 unauthorized leaks | Unauthenticated/unauthorized PII access attempt | P0 | Security_Role | `RB-007` | Active |
