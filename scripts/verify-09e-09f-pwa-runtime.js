'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];

function requirePath(rel) {
  if (!fs.existsSync(path.join(ROOT, rel))) failures.push('missing: ' + rel);
}

function packageJson(rel) {
  const p = path.join(ROOT, rel);
  requirePath(rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const api = packageJson('apps/api/package.json');
const web = packageJson('apps/web/package.json');
const admin = packageJson('apps/admin/package.json');

if (!api?.scripts?.build) failures.push('apps/api has no build gate');
if (!web?.scripts?.build) failures.push('apps/web has no build gate');
if (!admin?.scripts?.build) failures.push('apps/admin has no build gate');

for (const rel of [
  'apps/web/public',
  'apps/web/src',
  'apps/admin/public',
  'apps/admin/src',
  'apps/api/server.js',
]) requirePath(rel);

const rootServer = fs.existsSync(path.join(ROOT, 'server.js'))
  ? fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').trim()
  : '';
if (rootServer !== "require('./apps/api/server');") {
  failures.push('root server.js is not the expected compatibility entrypoint');
}

if (failures.length) {
  console.error('[09E/09F] Runtime/PWA structural gate: FAIL');
  failures.forEach(x => console.error(' - ' + x));
  process.exit(1);
}

console.log('[09E/09F] Runtime/PWA structural gate: PASS');
console.log('[09E/09F] Authoritative runtime proof remains the standalone CI build plus deployed smoke verification.');
