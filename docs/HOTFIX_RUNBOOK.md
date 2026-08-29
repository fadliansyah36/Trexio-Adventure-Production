# TREXIO HOTFIX DEPLOYMENT RUNBOOK

## 1. EMERGENCY DECLARATION
Declare a Hotfix when a P0 production incident occurs requiring an immediate patch:
- **Hotfix Lead**: Backend Lead / DevOps
- **Branch Naming**: `hotfix/YYYYMMDD-<description>`

---

## 2. EMERGENCY HOTFIX FLOW
1. Checkout hotfix branch from production tag:
   ```bash
   git checkout -b hotfix/20260810-payment-reconcile main
   ```
2. Apply minimal targeted fix (strictly no unrelated feature additions).
3. Execute local unit tests and lint check:
   ```bash
   npm run lint && npm run build
   ```
4. Deploy patch to Cloud Run with priority verification.
5. Merge hotfix back into `main` and `develop` branches.
