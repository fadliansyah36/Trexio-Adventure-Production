# TREXIO PRODUCTION INCIDENT RESPONSE & OBSERVABILITY POLICY

## 1. INCIDENT SEVERITY CLASSIFICATION
- **P0 (Critical Production Outage)**: Primary database Cloud SQL down, data corruption, mass payment processing failure, unauthorized PII security breach.
  - *Response Time SLA*: Immediate (< 15 Minutes)
  - *Action*: Incident Command activated, write operations isolated, immediate containment.
- **P1 (High Impact Feature Outage)**: Booking engine failure, payment gateway webhook failure, vendor chat outage, schema drift detected.
  - *Response Time SLA*: < 30 Minutes
  - *Action*: Feature flag containment, staging verification, emergency hotfix patch.
- **P2 (Medium Impact Degradation)**: Slow query latency (> 500ms), single vendor dashboard issue, notification delivery delay.
  - *Response Time SLA*: < 2 Hours
  - *Action*: Query index optimization, background job queue clearing.
- **P3 / P4 (Low Impact / Informational)**: Minor UI cosmetic defect, non-critical analytics delay.
  - *Response Time SLA*: < 24 Hours

---

## 2. INCIDENT LIFECYCLE STEPS
1. **DETECT**: Automated monitoring probes (`/api/health/cloudsql`, `/api/monitoring/status`, `/api/governance`) or user reports detect anomaly.
2. **CLASSIFY**: Assign severity level (P0 - P4) and identify affected system component.
3. **CONTAIN**: Isolate failure (e.g. disable broken endpoint, block malicious IP, rollback bad deployment). **NO FALLBACK TO LOCAL JSON FILES.**
4. **INVESTIGATE**: Inspect structured logs, query metrics, and error stack traces. Identify root cause.
5. **MITIGATE**: Execute runbook procedure (`RB-001` through `RB-007`).
6. **RECOVER**: Restore full service functionality on Cloud SQL PostgreSQL database.
7. **VERIFY**: Run post-incident health check and functional smoke test across all affected endpoints.
8. **DOCUMENT**: Log incident in `/docs/INCIDENT_REGISTER.md` and complete 5-Whys Root Cause Analysis (RCA).
9. **PREVENT**: Deploy automated regression test or monitoring alert threshold to prevent recurrence.

---

## 3. MANDATORY OPERATING PRINCIPLES
- **Source of Truth**: Google Cloud SQL PostgreSQL is the single primary business database.
- **No JSON Fallback**: If Cloud SQL is unavailable, fail safely with an error response. Never fallback to `db.json` or local memory stores for business data.
- **No Blind Production Changes**: All fixes must be tested and verified against schema constraints.
- **Blameless Culture**: Focus on system resilience, automation, and defensive coding.
