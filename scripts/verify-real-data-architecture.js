'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_ROOTS = ['apps/api', 'apps/web', 'apps/admin', 'frontend', 'src', 'server.js'];
const EXCLUDED = new Set(['node_modules', '.next', 'build', 'dist', 'coverage', '.git']);
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const findings = [];

function add(file, line, rule, text) {
  findings.push({ file: path.relative(ROOT, file), line, rule, text: text.trim().slice(0, 240) });
}

function shouldSkip(file) {
  const parts = file.split(path.sep);
  return parts.some((part) => EXCLUDED.has(part)) ||
    /(^|[\\/])(test|tests|__tests__|fixtures|mocks?|stories)([\\/]|$)/i.test(file);
}

function scanFile(file) {
  if (shouldSkip(file)) return;
  const ext = path.extname(file);
  if (!EXTENSIONS.has(ext)) return;
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((lineText, i) => {
    const line = i + 1;
    const line = i + 1;
    if (/\\b(writeFileSync|appendFileSync|readFileSync|createWriteStream)\\s*\\(/.test(lineText) &&
        !/config|lock|cache|tmp|migration|report/i.test(lineText)) {
      add(file, line, 'FILE_BUSINESS_PERSISTENCE', lineText);
    }
    if (/\\b(localStorage|sessionStorage)\\s*\\./.test(lineText)) {
      add(file, line, 'BROWSER_BUSINESS_PERSISTENCE', lineText);
    }
    if (/\\b(mock|dummy|fake|placeholder|simulation|simulate|scenario|demo)\\b/i.test(lineText)) {
      add(file, line, 'MOCK_SIMULATION_IDENTIFIER', lineText);
    }
    if (/example-vapid-key|example\.com|test@|admin@trexio\.id/.test(lineText)) {
      add(file, line, 'PLACEHOLDER_OR_DEFAULT_IDENTITY', lineText);
    }
  });

  const businessArrayPattern = /const\\s+([A-Za-z][A-Za-z0-9_]*)\\s*=\\s*\\[\\s*\\{/g;
  let match;
  while ((match = businessArrayPattern.exec(text))) {
    const name = match[1];
    if (/^(config|routes|allowedOrigins|defaultAllowedOrigins|headers|rules|constants)$/i.test(name)) continue;
    const line = text.slice(0, match.index).split(/\\r?\\n/).length;
    add(file, line, 'STATIC_OBJECT_ARRAY', `const ${name} = [{ ... }]`);
  }
}

function walk(target) {
  const absolute = path.join(ROOT, target);
  if (!fs.existsSync(absolute)) return;
  if (fs.statSync(absolute).isFile()) return scanFile(absolute);
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const full = path.join(absolute, entry.name);
    if (entry.isDirectory()) walk(path.relative(ROOT, full));
    else scanFile(full);
  }
}

for (const root of SCAN_ROOTS) walk(root);

const byRule = findings.reduce((acc, f) => {
  acc[f.rule] = (acc[f.rule] || 0) + 1;
  return acc;
}, {});

const report = {
  generated_at: new Date().toISOString(),
  policy: 'Production runtime must use real persistent data and configured providers; no business-critical mock, fake, static, placeholder, scenario or file-based persistence.',
  status: findings.length ? 'BLOCKED' : 'PASS',
  finding_count: findings.length,
  by_rule: byRule,
  findings,
};

const dataDir = path.join(ROOT, 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'real-data-architecture-audit.json'), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
if (findings.length) process.exit(1);
