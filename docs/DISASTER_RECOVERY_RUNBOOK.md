# TREXIO DATABASE DISASTER RECOVERY RUNBOOK

## 1. INCIDENT DECLARATION & COMMAND STRUCTURE
When a major database failure or disaster occurs (e.g., Cloud SQL unavailable, storage failure, critical data corruption), the **Disaster Command** is triggered immediately:
- **Incident Commander**: DevOps / Infrastructure Owner
- **Database Lead**: Database Owner (`DBA_ROLE`)
- **Backend Lead**: Backend Owner (`BACKEND_ROLE`)
- **Security Lead**: Security Owner (`SECURITY_ROLE`)

---

## 2. DISASTER RECOVERY STEPS (DR FLOW)
```
DETECT → DECLARE → CONTAIN → ASSESS → SELECT LAST KNOWN GOOD STATE → RESTORE → VALIDATE → RECONCILE → RECOVER SERVICES → MONITOR → CLOSE
```

### STEP 1: DETECTION & CONTAINMENT
1. Monitor alerts or `/api/dr/status` returning `DISASTER_ALERT`.
2. Block write operations on backend if database corruption is detected to prevent spreading corrupt state.
3. **CRITICAL MANDATE**: Do NOT switch to `db.json` or local memory stores. Fail safely with 503 Service Unavailable for write endpoints while database is recovering.

### STEP 2: RECOVERY POINT SELECTION
1. Query Cloud SQL Snapshot and Write-Ahead Log (WAL) timestamps.
2. Select the latest Point-In-Time Recovery (PITR) timestamp prior to the corrupting event or outage.
3. RPO Target: **< 5 Minutes**.

### STEP 3: DATABASE RESTORE PROCEDURE
1. Execute Point-in-Time Recovery (PITR) command in Google Cloud Console or gcloud CLI:
   ```bash
   gcloud sql instances restore-backup cloud-sql-instance --backup-id=<BACKUP_ID>
   ```
2. Verify instance state transitions to `RUNNING`.
3. Check PostgreSQL connection pool latency (`SELECT 1;`).

### STEP 4: DATA INTEGRITY & SCHEMAS VALIDATION
1. Run automated Schema Drift Guard (`/api/governance`) to verify all 12 core tables exist:
   `users`, `vendors`, `trips`, `bookings`, `payment_transactions`, `conversations`, `messages`, `notifications`, `news`, `travel_intents`, `journeys`, `rides`.
2. Check foreign key integrity and zero orphan records.

### STEP 5: PAYMENT & TRANSACTION RECONCILIATION
1. Query Midtrans Payment Gateway API for pending/recent settled orders.
2. Compare gateway order IDs against `payment_transactions` and `bookings` tables.
3. Auto-reconcile state: update `bookings.payment_status = 'paid'` for orders confirmed settled by Midtrans during outage window.

### STEP 6: AUTHENTICATION & USER IDENTITY VERIFICATION
1. Verify Firebase Authentication user mapping (`users.uid = firebase_user.uid`).
2. Ensure no duplicate user records were created during recovery window.

### STEP 7: SERVICE RECOVERY & SMOKE TESTING
1. Re-enable backend API routes.
2. Run automated smoke test:
   - User Login (Firebase Auth)
   - Search Adventure Trips
   - Booking Creation & Payment Webhook Processing
   - Backpacker Companion & Ride Join Request
   - Vendor Dashboard & Chat
3. Monitor system metrics on `/api/monitoring/status`.
