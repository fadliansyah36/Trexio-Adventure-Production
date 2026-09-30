'use strict';

const fs = require('fs');
const path = require('path');

const requiredAttestations = [
  'unit_tests',
  'integration_tests',
  'e2e_critical_flows',
  'tenant_isolation',
  'payment_webhook',
  'database_migrations',
  'backup_verified',
  'secrets_verified',
  'monitoring_active',
  'error_tracking_active',
  'rollback_plan',
];

const failures = [];
let attestation = {};
try { attestation = JSON.parse(process.env.TREXIO_PRODUCTION_ATTESTATION || ''); }
catch { failures.push('TREXIO_PRODUCTION_ATTESTATION is missing or invalid JSON'); }

for (const key of requiredAttestations) {
  if (attestation[key] !== true) failures.push('production attestation not confirmed: ' + key);
}

const baseUrl = String(process.env.TREXIO_PRODUCTION_BASE_URL || '').replace(/\/+$/, '');
if (!baseUrl) failures.push('TREXIO_PRODUCTION_BASE_URL is not configured');

if (baseUrl) {
  const checks = [
    ['web root', '/', (r) => r.status === 200],
    ['web manifest', '/manifest.json', (r) => r.status === 200],
    ['service worker', '/service-worker.js', (r) => r.status === 200],
    ['API root', '/api/', (r) => r.status === 200],
  ];

  for (const [name, pathname, predicate] of checks) {
    try {
      const response = await fetch(baseUrl + pathname, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      if (!predicate(response)) failures.push(name + ' live smoke failed with HTTP ' + response.status);
      else if (pathname === '/manifest.json') {
        try {
          const manifest = await response.json();
          if (manifest.display !== 'standalone') failures.push('live manifest display is not standalone');
        } catch { failures.push('live manifest is not valid JSON'); }
      } else if (pathname === '/service-worker.js') {
        const text = await response.text();
        if (!text.includes('url.pathname.startsWith("/api/")')) failures.push('live service worker does not bypass /api/ requests');
      } else if (pathname === '/api/') {
        try {
          const body = await response.json();
          if (body.name !== 'TREXIO API' || body.status !== 'ok') failures.push('live API root contract is invalid');
        } catch { failures.push('live API root did not return valid JSON'); }
      }
    } catch (err) {
      failures.push(name + ' live smoke request failed: ' + err.message);
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl || null,
  passed: failures.length === 0,
  failures,
  attestation: Object.fromEntries(requiredAttestations.map((key) => [key, attestation[key] === true])),
};

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'production-release-gate.json'), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error('[PRODUCTION RELEASE] GATE: FAIL');
  failures.forEach((x) => console.error(' - ' + x));
  process.exit(1);
}

console.log('[PRODUCTION RELEASE] GATE: PASS');
