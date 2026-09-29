'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const warnings = [];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'build', 'dist', '.git'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx|mjs|cjs|json)$/.test(e.name)) out.push(full);
  }
  return out;
}

function scan(relRoot, rules) {
  const root = path.join(ROOT, relRoot);
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    for (const rule of rules) {
      if (rule.pattern.test(content)) failures.push(rel + ': ' + rule.name);
    }
  }
}

for (const required of [
  'apps/api/server.js',
  'apps/api/package.json',
  'apps/web/package.json',
  'apps/web/src',
  'apps/admin/package.json',
  'apps/admin/src',
  'packages/types',
  'packages/validation',
  'packages/api-client',
  'packages/config',
]) {
  if (!exists(required)) failures.push('missing required boundary: ' + required);
}

scan('apps/api', [
  { name: 'legacy frontend source import', pattern: /(?:require|from)\s*\(?\s*['"][^'"]*frontend\// },
]);

scan('apps/web', [
  { name: 'legacy frontend import', pattern: /['"][^'"]*(?:^|\/)frontend\/(?:src|public)\// },
  { name: 'admin source import', pattern: /['"][^'"]*apps\/admin\// },
  { name: 'direct backend persistence import', pattern: /(?:\.\.\/)+src\/(?:db|repositories)\// },
]);

scan('apps/admin', [
  { name: 'legacy frontend import', pattern: /['"][^'"]*(?:^|\/)frontend\/(?:src|public)\// },
  { name: 'web source import', pattern: /['"][^'"]*apps\/web\// },
  { name: 'direct backend persistence import', pattern: /(?:\.\.\/)+src\/(?:db|repositories)\// },
]);

const legacyFrontend = exists('frontend');
if (legacyFrontend) {
  warnings.push('legacy frontend/ is retained as rollback/reference copy; retirement remains gated by successful standalone builds and runtime verification');
}

const rootServer = path.join(ROOT, 'server.js');
if (fs.existsSync(rootServer)) {
  const content = fs.readFileSync(rootServer, 'utf8').trim();
  if (content !== "require('./apps/api/server');") {
    failures.push('root server.js is not a pure compatibility entrypoint');
  }
}

if (failures.length) {
  console.error('[09C] Post-extraction integrity: FAIL');
  failures.forEach(x => console.error(' - ' + x));
  process.exit(1);
}

console.log('[09C] Post-extraction integrity: PASS');
warnings.forEach(x => console.warn('[09C] RETIREMENT GATE: ' + x));
console.log('[09C] Web/Admin are physically separated; API remains the backend runtime boundary.');
