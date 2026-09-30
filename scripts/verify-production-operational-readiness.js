'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const dataDir = path.join(ROOT, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const required = ['unit_tests','integration_tests','e2e_critical_flows','tenant_isolation','payment_webhook','database_migrations','backup_verified','secrets_verified','monitoring_active','error_tracking_active','rollback_plan'];
const raw = process.env.TREXIO_PRODUCTION_ATTESTATION || '';
let attestation = {};
const failures = [];
const warnings = [];
if (!raw) warnings.push('TREXIO_PRODUCTION_ATTESTATION is not configured; operational readiness remains PENDING.');
else { try { attestation = JSON.parse(raw); } catch { failures.push('TREXIO_PRODUCTION_ATTESTATION is invalid JSON'); } }
const evidence = {};
for (const key of required) {
  evidence[key] = { confirmed: attestation[key] === true, evidence_id: typeof attestation[key + '_evidence'] === 'string' && attestation[key + '_evidence'].trim() ? attestation[key + '_evidence'].trim() : null };
  if (attestation[key] === true && !evidence[key].evidence_id) failures.push(key + ' is true but has no evidence identifier');
}
const confirmed = required.filter((key) => evidence[key].confirmed && evidence[key].evidence_id);
const operationalReady = failures.length === 0 && confirmed.length === required.length;
const report = { generated_at:new Date().toISOString(), stage:'10A-10I', status:operationalReady?'GREEN':(failures.length?'BLOCKED':'PENDING'), environment:process.env.TREXIO_PRODUCTION_BASE_URL||null, phases:{'10A_production_environment':evidence.secrets_verified.confirmed?'EVIDENCE_REQUIRED':'PENDING','10B_production_test_evidence':confirmed.includes('unit_tests')&&confirmed.includes('integration_tests')?'EVIDENCE_REQUIRED':'PENDING','10C_tenant_isolation_security':evidence.tenant_isolation.confirmed?'EVIDENCE_REQUIRED':'PENDING','10D_payment_webhook':evidence.payment_webhook.confirmed?'EVIDENCE_REQUIRED':'PENDING','10E_database_backup_recovery':evidence.database_migrations.confirmed&&evidence.backup_verified.confirmed?'EVIDENCE_REQUIRED':'PENDING','10F_monitoring_error_tracking':evidence.monitoring_active.confirmed&&evidence.error_tracking_active.confirmed?'EVIDENCE_REQUIRED':'PENDING','10G_rollback_readiness':evidence.rollback_plan.confirmed?'EVIDENCE_REQUIRED':'PENDING','10H_release_attestation':operationalReady?'GREEN':'PENDING','10I_final_reconciliation':operationalReady?'READY_FOR_FINAL_REPORT':'PENDING'},required_evidence:evidence,failures,warnings,next_action:operationalReady?'Run production-release-gate.yml against the protected production environment.':'Populate production attestation and evidence identifiers, then rerun the operational readiness gate.'};
fs.writeFileSync(path.join(dataDir,'production-operational-readiness.json'),JSON.stringify(report,null,2));
if(failures.length){console.error('[PRODUCTION OPERATIONAL] BLOCKED');failures.forEach(x=>console.error(' - '+x));process.exit(1);}
console.log('[PRODUCTION OPERATIONAL] '+report.status); warnings.forEach(x=>console.warn('[PRODUCTION OPERATIONAL] WARNING: '+x));
