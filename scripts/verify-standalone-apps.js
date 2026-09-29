'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APPS = ['apps/web', 'apps/admin'];

function fail(message) {
  console.error('[09C/STANDALONE] FAIL: ' + message);
  process.exitCode = 1;
}

function readJson(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    fail('missing ' + rel);
    return null;
  }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (err) {
    fail('invalid JSON: ' + rel + ': ' + err.message);
    return null;
  }
}

for (const app of APPS) {
  const pkg = readJson(path.join(app, 'package.json'));
  if (!pkg) continue;

  if (!pkg.private) fail(app + '/package.json must be private');
  if (!pkg.scripts || !pkg.scripts.build) fail(app + ' has no standalone build script');

  const hasSource =
    fs.existsSync(path.join(ROOT, app, 'src')) ||
    fs.existsSync(path.join(ROOT, app, 'public'));
  if (!hasSource) fail(app + ' has no local src/ or public/ source tree');

  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'build', 'dist'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx|ts|tsx|json|html|css)$/.test(entry.name)) files.push(full);
    }
  }
  walk(path.join(ROOT, app));

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const token of ['../../frontend', '../../../frontend', 'frontend/src', 'frontend/public']) {
      if (content.includes(token)) {
        fail(app + ': legacy frontend dependency found in ' + path.relative(ROOT, file) + ': ' + token);
      }
    }
  }
}

if (process.exitCode) {
  console.error('[09C/STANDALONE] Gate is BLOCKED until each application owns its source tree and build dependencies.');
  process.exit(1);
}

for (const app of APPS) {
  console.log('[09C/STANDALONE] Building ' + app + '...');
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: path.join(ROOT, app),
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.status !== 0) fail(app + ' standalone build failed');
}

if (!process.exitCode) {
  console.log('[09C/STANDALONE] PASS: apps/web and apps/admin are independently buildable.');
}
