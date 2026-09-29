'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_ROOTS = ['apps/web', 'apps/admin', 'packages'];
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json']);

const rules = [
  { name: 'shared-packages-no-supabase', roots: ['packages'], pattern: /@supabase\/|supabase\.from\s*\(|createClient\s*\(/ },
  { name: 'web-admin-no-db-driver', roots: ['apps/web', 'apps/admin'], pattern: /require\(['"](?:pg|mysql2|sqlite3|drizzle-orm)|from\s+['"](?:pg|mysql2|sqlite3|drizzle-orm)/ },
  { name: 'web-admin-no-server-persistence-import', roots: ['apps/web', 'apps/admin'], pattern: /(?:\.\.\/)+src\/(?:db|repositories)\// },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const failures = [];
for (const rule of rules) {
  for (const root of rule.roots) {
    for (const file of walk(path.join(ROOT, root))) {
      const content = fs.readFileSync(file, 'utf8');
      if (rule.pattern.test(content)) {
        failures.push({ rule: rule.name, file: path.relative(ROOT, file) });
      }
    }
  }
}

if (failures.length) {
  console.error('[09D] API/shared contract boundary violations detected:');
  for (const failure of failures) console.error(`- ${failure.rule}: ${failure.file}`);
  process.exit(1);
}

console.log('[09D] API/shared contract boundary verification: PASS');
console.log('[09D] Shared packages remain persistence-agnostic; web/admin remain decoupled from backend persistence.');
