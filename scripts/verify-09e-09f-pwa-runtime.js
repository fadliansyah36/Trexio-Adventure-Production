'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const warnings = [];

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
  'apps/web/public/index.html',
  'apps/web/public/manifest.json',
  'apps/web/public/service-worker.js',
  'apps/admin/public',
  'apps/admin/src',
  'apps/admin/public/index.html',
  'apps/admin/public/manifest.json',
  'apps/admin/public/service-worker.js',
  'apps/api/server.js',
]) requirePath(rel);

for (const app of ['apps/web', 'apps/admin']) {
  const htmlPath = path.join(ROOT, app, 'public', 'index.html');
  const manifestPath = path.join(ROOT, app, 'public', 'manifest.json');
  const swPath = path.join(ROOT, app, 'public', 'service-worker.js');

  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!/<link[^>]+rel=["']manifest["'][^>]+href=["']\/manifest\.json["']/.test(html)) {
      failures.push(app + ': index.html does not link manifest.json');
    }
  }

  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.display !== 'standalone') failures.push(app + ': manifest display is not standalone');
      if (!manifest.start_url || !manifest.scope) failures.push(app + ': manifest start_url/scope missing');
    } catch (err) {
      failures.push(app + ': manifest.json is invalid JSON');
    }
  }

  if (fs.existsSync(swPath)) {
    const sw = fs.readFileSync(swPath, 'utf8');
    for (const handler of ['install', 'activate', 'fetch']) {
      if (!new RegExp('addEventListener\\\\(["\\\']' + handler + '["\\\']').test(sw)) {
        failures.push(app + ': service worker missing ' + handler + ' handler');
      }
    }
    if (!sw.includes('url.pathname.startsWith("/api/")')) {
      failures.push(app + ': service worker must bypass /api/ requests');
    }
  }
}

if (fs.existsSync(path.join(ROOT, 'frontend'))) {
  failures.push('legacy frontend/ directory still exists');
}

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
