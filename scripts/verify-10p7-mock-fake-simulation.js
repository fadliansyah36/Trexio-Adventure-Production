'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const targets = [
  'apps/api/modules/backpacker/routes.js',
  'apps/api/modules/ai/services/ai-risk-engine.service.js',
];

const forbidden = [
  { label: 'Demo User identity', pattern: /Demo User/ },
  { label: 'synthetic TREXIO Partner identity', pattern: /TREXIO Partner/ },
  { label: 'synthetic route fixture', pattern: /route_(cheap|fast|bal|fewest)_/ },
  { label: 'synthetic shuttle fixture', pattern: /cat_shut_0/ },
  { label: 'hardcoded route result array', pattern: /const\s+routeResults\s*=\s*\[\s*\{/ },
  { label: 'risk demo case object', pattern: /case_risk_0[12]/ },
  { label: 'risk demo entity', pattern: /entity_name:\s*['"]Demo/ },
];

const failures = [];

for (const relative of targets) {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) {
    failures.push({ file: relative, reason: 'missing target file' });
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) {
      failures.push({ file: relative, reason: rule.label });
    }
  }
}

const risk = fs.readFileSync(
  path.join(ROOT, 'apps/api/modules/ai/services/ai-risk-engine.service.js'),
  'utf8'
);
if (!risk.includes('REAL_DATA_REQUIRED: risk case persistence is not configured')) {
  failures.push({
    file: 'apps/api/modules/ai/services/ai-risk-engine.service.js',
    reason: 'risk case operations do not fail closed without persistence',
  });
}

const backpacker = fs.readFileSync(
  path.join(ROOT, 'apps/api/modules/backpacker/routes.js'),
  'utf8'
);
if (!backpacker.includes('REAL_SUPPLY_UNAVAILABLE')) {
  failures.push({
    file: 'apps/api/modules/backpacker/routes.js',
    reason: 'route search does not fail closed when real transport supply is unavailable',
  });
}

const report = {
  stage: '10P.7',
  policy: 'Production runtime must not expose mock, fake, demo, simulation, or synthetic business records.',
  status: failures.length ? 'BLOCKED' : 'PASS',
  findings: failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
