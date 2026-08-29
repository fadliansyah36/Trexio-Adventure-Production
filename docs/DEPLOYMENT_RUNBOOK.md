# TREXIO PRODUCTION DEPLOYMENT RUNBOOK

## 1. PRE-DEPLOYMENT VERIFICATION & GATES
Before triggering a production deployment to Cloud Run, verify all gate checks:
1. **Source Code**: Ensure branch `main` is clean, reviewed, and approved via Pull Request.
2. **Automated CI**: Verify `npm run lint` and `compile_applet` pass green.
3. **Security Audit**: Ensure no plain-text API secrets exist in code; verify `.env.example`.
4. **Database Migration Gate**: Verify pending migrations in `/src/db/schema.ts` follow **Expand-Contract** rules.
5. **Backup Gate**: Confirm latest Cloud SQL automated snapshot is verified in `/api/dr/status`.

---

## 2. PRODUCTION DEPLOYMENT STEPS
```
COMMIT → CI PASSED → BACKUP VERIFIED → EXPAND MIGRATION → DEPLOY BACKEND → SMOKE TEST → CONTRACT MIGRATION
```

### STEP 1: EXECUTE EXPAND MIGRATION (IF ANY)
Apply backward-compatible database schema additions before deploying new code:
```bash
npm run db:migrate
```

### STEP 2: DEPLOY BACKEND TO CLOUD RUN
Deploy the containerized Express application to Cloud Run with rolling traffic allocation:
```bash
gcloud run deploy trexio-backend --image=gcr.io/trexio/app:latest --platform=managed
```

### STEP 3: RUN POST-DEPLOYMENT SMOKE TESTS
Execute automated verification scripts on the live endpoint:
- `GET /api/health/cloudsql` -> `200 OK`
- `GET /api/governance` -> `GOVERNANCE_READY`
- `GET /api/performance/status` -> `PERFORMANCE_&_SCALABILITY_CERTIFIED`
- `GET /api/architecture/status` -> `MODULAR_MONOLITH_CERTIFIED`
- `GET /api/deployment/status` -> `PRODUCTION_DEPLOYMENT_CERTIFIED`

---

## 3. ACCEPTANCE & MONITORING
1. Monitor latency and error rates on `/api/monitoring/status` for 15 minutes post-deploy.
2. Verify zero 5xx server errors and normal connection pool utilization (< 20%).
