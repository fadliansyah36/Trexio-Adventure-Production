#!/usr/bin/env node
/**
 * Mission 09C Final Closure Gate
 *
 * Read-only provenance/dependency audit for the physical web/admin extraction.
 * It intentionally does not delete legacy frontend files. Retirement is allowed
 * only after this audit passes AND the CI standalone build gate is green.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  ['apps/web', path.join(root, 'apps/web')],
  ['apps/admin', path.join(root, 'apps/admin')],
  ['apps/api', path.join(root, 'apps/api')],
];
const forbidden = [
  /(^|[/'"])frontend\//,
  /(^|[/'"])backend\//,
  /(^|[/'"])src\/(?!.*apps)/,
];

let failed = false;
for (const [name, dir] of targets) {
  if (!fs.existsSync(dir)) {
    console.error(`[09C][FAIL] Missing target boundary: ${name}`);
    failed = true;
    continue;
  }
  const pkg = path.join(dir, 'package.json');
  if (!fs.existsSync(pkg)) {
    console.error(`[09C][FAIL] Missing package manifest: ${name}`);
    failed = true;
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'build', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx|json|md|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

for (const [name, dir] of targets) {
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.test(text)) {
        console.error(`[09C][FAIL] ${name}: legacy/root dependency in ${path.relative(root, file)}`);
        failed = true;
      }
    }
  }
}

const frontend = path.join(root, 'frontend');
if (!fs.existsSync(frontend)) {
  console.log('[09C] Legacy frontend boundary is already absent.');
} else {
  console.log('[09C] Legacy frontend boundary retained pending green standalone CI gate.');
}

if (failed) process.exit(1);
console.log('[09C] Dependency/provenance static gate: PASS');
console.log('[09C] Physical frontend retirement remains gated by CI standalone build verification.');
