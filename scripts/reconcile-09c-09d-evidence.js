'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const checks = [
  ['09C post-extraction integrity', 'scripts/verify-09c-post-extraction-integrity.js'],
  ['09D dependency decoupling', 'scripts/verify-09d-dependency-decoupling.js'],
  ['09D API contract isolation', 'scripts/verify-api-contracts.js'],
  ['09E-09F runtime/PWA structural gate', 'scripts/verify-09e-09f-pwa-runtime.js'],
  ['production readiness structural gate', 'scripts/verify-production-readiness.js'],
];

const results = checks.map(([name, script]) => {
  const result = spawnSync(process.execPath, [path.join(ROOT, script)], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  return {
    name,
    script,
    passed: result.status === 0,
    exit_code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
});

const report = {
  generated_at: new Date().toISOString(),
  mission: '09C/09D evidence reconciliation after 09E-09F runtime/PWA verification',
  passed: results.every((r) => r.passed),
  results: results.map(({ name, script, passed, exit_code }) => ({ name, script, passed, exit_code })),
};

const dataDir = path.join(ROOT, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, '09c-09d-evidence-reconciliation.json'), JSON.stringify(report, null, 2));

for (const result of results) {
  console.log(`[EVIDENCE] ${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
  if (!result.passed) {
    if (result.stdout) console.error(result.stdout);
    if (result.stderr) console.error(result.stderr);
  }
}

if (!report.passed) {
  console.error('[EVIDENCE] 09C/09D reconciliation: FAIL');
  process.exit(1);
}

console.log('[EVIDENCE] 09C/09D reconciliation: PASS');
