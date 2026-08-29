# TREXIO PRODUCTION ROLLBACK RUNBOOK

## 1. ROLLBACK TRIGGER CONDITIONS
Trigger an immediate production rollback if:
- API Error Rate exceeds 1.0% in 5 consecutive minutes.
- Database latency exceeds 500ms or connection exhaustion occurs.
- Critical business flow failure detected (e.g. Booking checkout failure, Payment webhook rejection, Auth failure).
- Critical security or contact privacy breach detected.

---

## 2. APPLICATION ROLLBACK PROCEDURE
1. Revert Cloud Run traffic allocation to the previous healthy revision:
   ```bash
   gcloud run services update-traffic trexio-backend --to-revisions=trexio-backend-00042=100
   ```
2. Verify system health returns to operational status via `/api/monitoring/status`.

---

## 3. DATABASE SCHEMA ROLLBACK / FORWARD-FIX PROCEDURE
1. **EXPAND-CONTRACT POLICY**: Do NOT execute destructive drop column SQL statements on production database during rollback.
2. If schema addition was made, deploy a backward-compatible forward-fix migration:
   ```bash
   npm run db:forward-fix
   ```
3. Verify schema drift guard `/api/governance` returns `DRIFT_FREE`.
