# TREXIO DISASTER RECOVERY TEST REGISTER

| Test ID | Execution Date | Scenario Simulated | Test Environment | Backup Selected | Recovery Point (PITR) | Actual RTO | RTO Target | Data Validation Result | Security Audit Result | Test Result | Action / Gap Identified |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `DRT-2026-01` | 2026-08-10 | Cloud SQL Simulated Outage & Standby Failover | Staging Instance | `cloudsql_snap_20260810_0000` | 2026-08-10 12:00 UTC | 8 Mins | 15 Mins | 100% (12/12 Tables Validated) | Pass (0 Token Leaks) | **PASS** | Auto-reconnect pool parameter tuned |
| `DRT-2026-02` | 2026-08-10 | Payment Webhook Reconciliation Post-Disaster | Staging Instance | `cloudsql_snap_20260810_0000` | 2026-08-10 13:00 UTC | 4 Mins | 15 Mins | 100% Payment Reconciliation | Pass (Idempotent Webhooks) | **PASS** | Midtrans Order ID deduplication verified |
| `DRT-2026-03` | 2026-08-10 | Schema Drift & JSON Fallback Attack Simulation | Staging Instance | N/A (Live Probe) | N/A | < 1 Min | 5 Mins | Drift Free (0 JSON Leaks) | Pass (Guarded System) | **PASS** | Automated guard blocks local JSON mutation |
