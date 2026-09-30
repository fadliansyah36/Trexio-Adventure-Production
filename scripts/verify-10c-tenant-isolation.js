'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const serverPath = path.join(ROOT, 'apps/api/server.js');
const isolationPath = path.join(ROOT, 'apps/api/security/tenantIsolation.js');
const failures = [];
const checks = [];

function pass(name, detail) {
  checks.push({ name, status: 'PASS', detail });
}
function fail(name, detail) {
  failures.push({ name, detail });
  checks.push({ name, status: 'FAIL', detail });
}

if (!fs.existsSync(serverPath)) fail('server_boundary', 'apps/api/server.js is missing');
if (!fs.existsSync(isolationPath)) fail('isolation_module', 'apps/api/security/tenantIsolation.js is missing');

let server = '';
if (fs.existsSync(serverPath)) server = fs.readFileSync(serverPath, 'utf8');

if (server.includes("const { resolveTenantForRequest, assertTenantAccess } = require('./security/tenantIsolation');")) {
  pass('central_authorization_module', 'server imports the central tenant isolation decision module');
} else {
  fail('central_authorization_module', 'server does not import the central tenant isolation decision module');
}

if (server.includes('function requireTenantAccess(req, res, next)') && server.includes('FORBIDDEN_TENANT_ISOLATION')) {
  pass('tenant_access_middleware', 'requireTenantAccess enforces the cross-tenant denial contract');
} else {
  fail('tenant_access_middleware', 'tenant access middleware or denial contract is missing');
}

for (const route of [
  "/tenant/builder-config",
  "/tenant/analytics",
  "/tenant/domain/save-custom-domain",
]) {
  const index = server.indexOf(route);
  const window = index >= 0 ? server.slice(index, index + 180) : '';
  if (index >= 0 && window.includes('requireTenantAccess')) {
    pass('route:' + route, 'route is protected by requireTenantAccess');
  } else {
    fail('route:' + route, 'tenant-owned route is not protected by requireTenantAccess');
  }
}

const test = spawnSync(process.execPath, [path.join(ROOT, 'scripts/test-tenant-isolation.js')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (test.status === 0) pass('authorization_unit_tests', test.stdout.trim());
else fail('authorization_unit_tests', (test.stderr || test.stdout || 'unit test failed').trim());


for (const file of [
  'apps/api/modules/repositories/vendorRepository.js',
  'apps/api/modules/repositories/tripRepository.js',
  'apps/api/modules/repositories/bookingRepository.js',
  'apps/api/modules/repositories/paymentRepository.js',
]) {
  const full = path.join(ROOT, file);
  const source = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  if (source.includes('tenant_id')) pass('repository_tenant_key:' + file, 'repository reads/writes relational tenant_id');
  else fail('repository_tenant_key:' + file, 'repository has no relational tenant_id boundary');
}

const migrationFiles = fs.readdirSync(path.join(ROOT, 'supabase/migrations')).filter((name) => name.includes('10c') && name.endsWith('.sql'));
if (migrationFiles.length) {
  const migrationText = migrationFiles.map((name) => fs.readFileSync(path.join(ROOT, 'supabase/migrations', name), 'utf8')).join('\n');
  for (const token of ['ALTER TABLE public.users', 'ALTER TABLE public.vendors', 'ALTER TABLE public.trips', 'ALTER TABLE public.bookings', 'ALTER TABLE public.payment_transactions', 'tenant_isolation_trips_all', 'tenant_isolation_bookings_all', 'tenant_isolation_payments_all']) {
    if (migrationText.includes(token)) pass('database_rls:' + token, '10C migration contains required relational/RLS control');
    else fail('database_rls:' + token, '10C migration is missing required control: ' + token);
  }
} else {
  fail('database_migration', 'No 10C tenant isolation migration found');
}

const report = {
  generated_at: new Date().toISOString(),
  stage: '10C',
  status: failures.length ? 'BLOCKED' : 'STRUCTURAL_PASS_RUNTIME_EVIDENCE_REQUIRED',
  checks,
  failures,
  runtime_evidence: {
    production_two_tenant_http_test: 'REQUIRED',
    database_rls_runtime_test: 'REQUIRED',
    note: 'Structural/unit verification does not constitute live production tenant-isolation evidence.',
  },
};

const dataDir = path.join(ROOT, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'tenant-isolation-10c.json'), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error('[10C] Tenant isolation gate: BLOCKED');
  failures.forEach((item) => console.error(' - ' + item.name + ': ' + item.detail));
  process.exit(1);
}

console.log('[10C] Tenant isolation structural gate: PASS');
console.log('[10C] Live production tenant-isolation evidence remains REQUIRED.');
