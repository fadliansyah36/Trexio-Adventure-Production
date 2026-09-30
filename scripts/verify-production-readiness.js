'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const warnings = [];

const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));

function fail(message) { failures.push(message); }
function warn(message) { warnings.push(message); }

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'build', 'dist', '.git', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx|mjs|cjs|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

for (const rel of [
  'apps/api/server.js',
  'apps/api/package.json',
  'apps/web/src',
  'apps/web/public/index.html',
  'apps/web/public/manifest.json',
  'apps/web/public/service-worker.js',
  'apps/admin/src',
  'apps/admin/public/index.html',
  'apps/admin/public/manifest.json',
  'apps/admin/public/service-worker.js',
  'packages',
  'scripts/verify-09c-post-extraction-integrity.js',
  'scripts/verify-09d-dependency-decoupling.js',
  'scripts/verify-09e-09f-pwa-runtime.js',
]) {
  if (!exists(rel)) fail('missing production-readiness boundary: ' + rel);
}

if (exists('frontend')) fail('legacy frontend/ directory is still present');

if (exists('server.js') && read('server.js').trim() !== "require('./apps/api/server');") {
  fail('root server.js is not the pure apps/api compatibility entrypoint');
}

for (const app of ['apps/web', 'apps/admin']) {
  const pkg = json(app + '/package.json');
  if (!pkg.private) fail(app + ' must remain private');
  if (!pkg.scripts?.build) fail(app + ' has no standalone build script');

  for (const file of walk(path.join(ROOT, app))) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    if (/(?:frontend\/src|frontend\/public|\.\.\/frontend)/.test(content)) {
      fail(app + ' contains legacy frontend dependency: ' + rel);
    }
    if (/(?:\.\.\/)+src\/(?:db|repositories)(?:\/|["'])/.test(content)) {
      fail(app + ' contains direct legacy persistence dependency: ' + rel);
    }
  }

  const html = read(app + '/public/index.html');
  const manifest = json(app + '/public/manifest.json');
  const sw = read(app + '/public/service-worker.js');

  if (!/<link[^>]+rel=["']manifest["'][^>]+href=["']\/manifest\.json["']/.test(html)) {
    fail(app + ' index.html does not link manifest.json');
  }
  if (manifest.display !== 'standalone') fail(app + ' manifest display must be standalone');
  if (!manifest.start_url || !manifest.scope) fail(app + ' manifest must define start_url and scope');
  if (!/addEventListener\(["']install["']/.test(sw)) fail(app + ' service worker has no install handler');
  if (!/addEventListener\(["']activate["']/.test(sw)) fail(app + ' service worker has no activate handler');
  if (!/addEventListener\(["']fetch["']/.test(sw)) fail(app + ' service worker has no fetch handler');
  if (!/url\.pathname\.startsWith\(["']\/api\//.test(sw)) fail(app + ' service worker does not explicitly bypass /api/ caching');
}

const rootPkg = json('package.json');
if (rootPkg.scripts?.lint === "echo 'No lint issues'" || /No lint issues/i.test(rootPkg.scripts?.lint || '')) {
  fail('root lint command is still a no-op');
}
if (!rootPkg.scripts?.lint) fail('root lint script is missing');

for (const workflow of [
  '.github/workflows/09e-09f-runtime-pwa.yml',
]) {
  const content = read(workflow);
  if (/\|\|\s*true/.test(content)) fail(workflow + ' contains forbidden || true failure suppression');
}

if (!exists('.env.example')) {
  warn('no .env.example found; secrets/environment documentation cannot be proven statically');
}

const report = {
  generated_at: new Date().toISOString(),
  structural: failures.length === 0,
  warnings,
  failures,
  production_release_requirements: {
    build: 'delegated to standalone web/admin/API build jobs',
    lint: 'delegated to root real lint gate',
    unit_tests: 'requires repository test evidence',
    integration_tests: 'requires repository test evidence',
    security_tests: 'delegated to security-scan',
    e2e_critical_flows: 'requires deployed/staging smoke evidence',
    tenant_isolation: 'requires runtime tenant-isolation evidence',
    payment_webhook: 'requires runtime payment webhook evidence',
    database_migrations: 'requires migration verification evidence',
    backup: 'requires operational backup verification evidence',
    secrets: 'requires deployment secret verification',
    monitoring: 'requires production monitoring verification',
    error_tracking: 'requires production error tracking verification',
    rollback: 'requires documented rollback plan',
  },
};

const reportDir = path.join(ROOT, 'data');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'production-readiness-structural.json'), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error('[PRODUCTION] Structural readiness gate: FAIL');
  failures.forEach((x) => console.error(' - ' + x));
  process.exit(1);
}

console.log('[PRODUCTION] Structural readiness gate: PASS');
warnings.forEach((x) => console.warn('[PRODUCTION] WARNING: ' + x));
console.log('[PRODUCTION] Operational release evidence remains explicitly required before production release.');
