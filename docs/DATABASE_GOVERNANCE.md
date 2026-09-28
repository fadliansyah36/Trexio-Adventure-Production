# TREXIO DATABASE GOVERNANCE & CHANGE MANAGEMENT POLICY

## 1. ARCHITECTURE & SOURCE OF TRUTH PRINCIPLE
- **Primary Business Database & Single Source of Truth**: Supabase PostgreSQL.
- **Identity & Authentication**: Supabase Auth.
- **Backend**: Business Logic, RBAC, Authorization, Transaction Management, Database Access.
- **JSON Usage**: Strictly limited to static config, seeds, translation files, and legacy cache fallback. **NO JSON FILE MAY SERVE AS A PRODUCTION BUSINESS DATABASE.**

---

## 2. DATABASE OWNERSHIP & ROLES
- **Database Owner**: Database Architecture Team (`DBA_ROLE`)
- **Backend Owner**: Trexio Backend Core Team (`BACKEND_ROLE`)
- **Security Owner**: Security & Compliance Ops (`SECURITY_ROLE`)
- **DevOps/Infrastructure Owner**: Cloud Infrastructure Team (`DEVOPS_ROLE`)
- **Super Admin Role**: Audited Administrative Operations (`SUPER_ADMIN_ROLE`)

---

## 3. CHANGE CLASSIFICATION & RISK LEVELS
- **LEVEL 1 (Low Risk)**: Read-only queries, non-critical indexes, UI presentation adjustments. Requires: Technical Review + Standard Tests.
- **LEVEL 2 (Medium Risk)**: New nullable columns, new non-critical tables/endpoints. Requires: Technical Review + Staging Test.
- **LEVEL 3 (High Risk)**: Schema changes on `bookings`, `payment_transactions`, `vendors`, `users`, or `trips`. Requires: Technical + Security + QA Review + Automated Backup + Staging Verification.
- **LEVEL 4 (Critical Risk)**: Table drop, primary key modification, identity provider changes, or database structural migration. Requires: Full C-Level / Lead Approval + Pre-Migration Backup + Full Rollback/Forward-Fix Plan + Maintenance Window.

---

## 4. NEW FEATURE DATABASE GATE (GATE 1 TO 9)
1. **GATE 1**: Architecture Alignment
2. **GATE 2**: Database Entity & Schema Design
3. **GATE 3**: Security & RBAC Impact Assessment
4. **GATE 4**: API Contract & Compatibility Check
5. **GATE 5**: Versioned Migration Script
6. **GATE 6**: Implementation in PostgreSQL Driver / Repository
7. **GATE 7**: Automated & Integration Testing
8. **GATE 8**: Staging Deployment & Verification
9. **GATE 9**: Production Approval & Smoke Test Verification

---

## 5. AUTOMATED GUARDS
- **JSON Regression Guard**: Automatically checks that no mutation endpoints persist purely to local JSON without persisting to Supabase PostgreSQL.
- **Schema Drift Guard**: Continuously verifies PostgreSQL actual tables against expected schema definition.
- **Migration Conflict Guard**: Prevents duplicate or conflicting migration executions.
- **Production Safety Guard**: Blocks unauthorized destructive SQL operations (`DROP TABLE`, `TRUNCATE`).

---

## 6. BACKUP, RECOVERY & PITR POLICY
- **Automated Backup**: Nightly Supabase PostgreSQL snapshots retained for 30 days.
- **Point-in-Time Recovery (PITR)**: Enabled with Write-Ahead Logging (WAL).
- **RPO Target**: < 5 Minutes
- **RTO Target**: < 15 Minutes
- **Restore Testing**: Non-production restore tests conducted periodically to certify backup integrity.

---

## 7. DATA RETENTION & PRIVACY (PII)
- **Sensitive Data (PII)**: User emails, phone numbers, contact profile handles (WhatsApp/Instagram) protected behind mutual consent and RBAC controls.
- **Payment Data**: PCI-DSS Compliant. Direct payment instrument details (credit cards/CVV) are NEVER stored; only payment gateway reference tokens (`midtrans_order_id`, `tx_id`) are maintained.
- **Audit Logs**: Maintained for all admin mutations and sensitive data access for 365 days.
