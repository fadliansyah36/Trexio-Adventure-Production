#!/usr/bin/env node
/**
 * Mission 09C Phase 4 — Domain / AI API boundary verifier.
 *
 * Static only: no server startup and no database connection.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'apps/api/server.js',
  'apps/api/modules/ai/index.js',
  'apps/api/modules/ai/services/ai-assistant.service.js',
  'apps/api/modules/ai/services/ai-smart-search.service.js',
  'apps/api/modules/ai/services/ai-seo.service.js',
  'apps/api/modules/backpacker/routes.js',
];

const server = fs.readFileSync(path.join(root, 'apps/api/server.js'), 'utf8');
const forbidden = [
  '../../src/ai',
  '../../src/backpacker/routes',
  '../../src/ai/services/ai-assistant.service',
  '../../src/ai/services/ai-smart-search.service',
  '../../src/ai/services/ai-seo.service',
];

const failures = [];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push('missing API boundary module: ' + rel);
}
for (const dep of forbidden) {
  if (server.includes(dep)) failures.push('API runtime still imports legacy domain/AI path: ' + dep);
}

if (failures.length) {
  console.error('Mission 09C Phase 4 domain/AI boundary verification FAILED');
  failures.forEach((x) => console.error('- ' + x));
  process.exit(1);
}

console.log('Mission 09C Phase 4 domain/AI boundary verification PASSED');
console.log('Verified API runtime routing through extracted domain/AI boundaries.');
