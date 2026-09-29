'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const boundaries = {
  web: path.join(ROOT, 'apps/web'),
  admin: path.join(ROOT, 'apps/admin'),
  packages: path.join(ROOT, 'packages'),
  api: path.join(ROOT, 'apps/api'),
};

const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json']);
const failures = [];
const checked = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'build', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (textExtensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function scan(rootKey, patterns) {
  const files = walk(boundaries[rootKey]);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    checked.push(path.relative(ROOT, file));
    for (const rule of patterns) {
      if (rule.pattern.test(content)) {
        failures.push(`${rootKey}: ${rule.name} -> ${path.relative(ROOT, file)}`);
      }
    }
  }
}

scan('web', [
  { name: 'direct backend persistence import', pattern: /(?:^|[\\/])(?:\.\.\/)+src\/(?:db|repositories)(?:[\\/]|$)/m },
  { name: 'direct backend server import', pattern: /(?:^|[\\/])(?:\.\.\/)+server(?:\.js)?(?:['"]|$)/m },
  { name: 'database driver import', pattern: /(?:from|require\\()\\s*['"](?:pg|mysql2|sqlite3|better-sqlite3|drizzle-orm|typeorm)(?:['"]|\\/)/m },
  { name: 'Supabase persistence SDK import', pattern: /['"]@supabase\/supabase-js['"]/ },
]);

scan('admin', [
  { name: 'direct backend persistence import', pattern: /(?:^|[\\/])(?:\.\.\/)+src\/(?:db|repositories)(?:[\\/]|$)/m },
  { name: 'direct backend server import', pattern: /(?:^|[\\/])(?:\.\.\/)+server(?:\.js)?(?:['"]|$)/m },
  { name: 'database driver import', pattern: /(?:from|require\\()\\s*['"](?:pg|mysql2|sqlite3|better-sqlite3|drizzle-orm|typeorm)(?:['"]|\\/)/m },
  { name: 'Supabase persistence SDK import', pattern: /['"]@supabase\/supabase-js['"]/ },
]);

scan('packages', [
  { name: 'Supabase SDK import', pattern: /['"]@supabase\/supabase-js['"]/ },
  { name: 'database driver import', pattern: /(?:from|require\\()\\s*['"](?:pg|mysql2|sqlite3|better-sqlite3|drizzle-orm|typeorm)(?:['"]|\\/)/m },
  { name: 'server-only node persistence import', pattern: /(?:from|require\\()\\s*['"](?:express|multer|midtrans-client|jsonwebtoken|bcryptjs)(?:['"]|\\/)/m },
]);

const apiServer = path.join(boundaries.api, 'server.js');
if (!fs.existsSync(apiServer)) {
  failures.push('api: missing apps/api/server.js');
} else {
  const api = fs.readFileSync(apiServer, 'utf8');
  if (/['"](?:\.\.\/)+frontend\//.test(api) || /['"]\.\/frontend\//.test(api)) {
    failures.push('api: runtime directly imports legacy frontend source');
  }
  if (api.includes("require('./src/") || api.includes('require("./src/')) {
    failures.push('api: unsafe ./src relative import remains');
  }
  checked.push('apps/api/server.js');
}

for (const pkg of ['apps/web/package.json', 'apps/admin/package.json', 'apps/api/package.json']) {
  const file = path.join(ROOT, pkg);
  if (!fs.existsSync(file)) failures.push(`missing ${pkg}`);
}

if (failures.length) {
  console.error('[09D] Dependency decoupling gate: FAIL');
  failures.forEach((x) => console.error(' - ' + x));
  process.exit(1);
}

console.log('[09D] Dependency decoupling gate: PASS');
console.log(`[09D] Scanned ${checked.length} boundary files.`);
console.log('[09D] web/admin are persistence-decoupled; packages are infrastructure-agnostic; API remains the server boundary.');
