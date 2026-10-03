'use strict';

/**
 * 10P.9 — Tenant/RBAC Domain Coverage Gate
 *
 * Structural contract:
 * - tenant-scoped users cannot inherit an implicit/default tenant;
 * - core tenant-owned repositories accept and enforce tenant scope;
 * - marketplace propagates tenant context through route -> service -> repository;
 * - central RBAC/tenant isolation remains the authorization boundary.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const checks = [];

function pass(name, detail) { checks.push({ name, status: 'PASS', detail }); }
function fail(name, detail) { failures.push({ name, detail }); checks.push({ name, status: 'FAIL', detail }); }
function source(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }

const isolation = source('apps/api/security/tenantIsolation.js');
const marketplaceRoute = source('apps/api/modules/routes/marketplace.js');
const marketplaceService = source('apps/api/modules/services/marketplaceService.js');
const server = source('apps/api/server.js');
const repos = {
  users: source('apps/api/server.js'),
  vendors: source('apps/api/modules/repositories/vendorRepository.js'),
  trips: source('apps/api/modules/repositories/tripRepository.js'),
  bookings: source('apps/api/modules/repositories/bookingRepository.js'),
  payments: source('apps/api/modules/repositories/paymentRepository.js'),
};

if (isolation.includes('return tenant || null;') && isolation.includes('return tenant || defaultTenant || null;')) {
  pass('tenant_resolution_fail_closed', 'Non-global users no longer inherit the default tenant; global roles may use explicit/default platform context.');
} else {
  fail('tenant_resolution_fail_closed', 'Tenant resolver does not show the required fail-closed/non-global behavior.');
}

if (isolation.includes('cross_tenant_access') && isolation.includes('global_role')) {
  pass('central_rbac_decision', 'Central tenant isolation module retains cross-tenant denial and global-role handling.');
} else {
  fail('central_rbac_decision', 'Central tenant isolation decision contract is incomplete.');
}

for (const [name, text] of Object.entries(repos)) {
  const required = name === 'users'
    ? ['tenant_id', 'users = businessState.proxies.users']
    : ['tenantId'];
  const ok = required.every((token) => text.includes(token));
  if (ok) pass('repository_scope:' + name, 'Repository exposes tenant-aware query/write scope.');
  else fail('repository_scope:' + name, 'Repository does not expose the required tenant scope contract.');
}

for (const token of [
  'getMarketplaceTenantContext',
  'marketplaceService.listTrips',
  'getMarketplaceTenantContext(req)',
  'marketplaceService.findTrip',
]) {
  if (marketplaceRoute.includes(token)) pass('marketplace_route:' + token, 'Marketplace route contains tenant-context propagation.');
  else fail('marketplace_route:' + token, 'Marketplace route is missing tenant-context propagation: ' + token);
}

for (const token of [
  'tripRepository.list({ tenantId: context.tenantId })',
  'tripRepository.findById(id, { tenantId: context.tenantId })',
  'vendorRepository.findById(trip.vendor_id, { tenantId: context.tenantId })',
]) {
  if (marketplaceService.includes(token)) pass('marketplace_service:' + token, 'Service propagates tenant scope to repository.');
  else fail('marketplace_service:' + token, 'Service is missing repository tenant propagation: ' + token);
}

if (server.includes('getUserRoles,') && server.includes('marketplaceService,')) {
  pass('composition_rbac_injection', 'Marketplace receives the canonical RBAC role resolver.');
} else {
  fail('composition_rbac_injection', 'Marketplace composition root does not inject canonical RBAC role resolution.');
}

const tests = spawnSync(process.execPath, [path.join(ROOT, 'scripts/test-tenant-isolation.js')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (tests.status === 0) pass('authorization_unit_tests', tests.stdout.trim());
else fail('authorization_unit_tests', (tests.stderr || tests.stdout || 'tenant isolation unit tests failed').trim());

const report = {
  generated_at: new Date().toISOString(),
  stage: '10P.9',
  status: failures.length ? 'BLOCKED' : 'PASS',
  checks,
  findings: failures,
  database_runtime_evidence: 'REQUIRED: verify tenant_id columns and RLS policies against the live Supabase project.',
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
