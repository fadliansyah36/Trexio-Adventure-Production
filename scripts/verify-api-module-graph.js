#!/usr/bin/env node
/**
 * Mission 09C Phase 3 — Dependency Graph & Module Extraction verifier.
 *
 * This is a static boundary check. It intentionally does not start the API or
 * connect to PostgreSQL. The goal is to catch accidental re-coupling after
 * module extraction.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const required = [
  'apps/api/server.js',
  'apps/api/modules/auth/supabaseAuth.js',
  'apps/api/modules/persistence/supabasePostgres.js',
  'apps/api/modules/repositories/appDocumentRepository.js',
  'apps/api/modules/repositories/vendorRepository.js',
  'apps/api/modules/repositories/tripRepository.js',
  'apps/api/modules/repositories/bookingRepository.js',
  'apps/api/modules/repositories/paymentRepository.js',
  'apps/api/modules/routes/authRoutes.js',
  'apps/api/modules/routes/userRoutes.js',
];

const retired = [
  'src/auth/supabaseAuth.js',
  'src/db/supabasePostgres.js',
  'src/repositories/appDocumentRepository.js',
  'src/repositories/vendorRepository.js',
  'src/repositories/tripRepository.js',
  'src/repositories/bookingRepository.js',
  'src/repositories/paymentRepository.js',
];

const failures = [];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`missing extracted module: ${rel}`);
}
for (const rel of retired) {
  if (fs.existsSync(path.join(root, rel))) failures.push(`legacy module still present: ${rel}`);
}

const apiServer = fs.readFileSync(path.join(root, 'apps/api/server.js'), 'utf8');
const forbiddenServerImports = [
  '../../src/auth/supabaseAuth',
  '../../src/db/supabasePostgres',
  '../../src/repositories/appDocumentRepository',
  '../../src/repositories/vendorRepository',
  '../../src/repositories/tripRepository',
  '../../src/repositories/vendorRepository',
  '../../src/repositories/bookingRepository',
  '../../src/repositories/paymentRepository',
  "api.post('/auth/register'",
  "api.post('/auth/login'",
  "api.get('/auth/me'",
  "api.get(['/profile'",
  "api.patch('/users/me/preferences'",
];
for (const dep of forbiddenServerImports) {
  if (apiServer.includes(dep)) failures.push(`apps/api/server.js still imports retired boundary: ${dep}`);
}

const routeModules = [
  'apps/api/modules/routes/authRoutes.js',
  'apps/api/modules/routes/userRoutes.js',
];

for (const rel of routeModules) {
  const content = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!content.includes('module.exports = function register')) {
    failures.push(`${rel} does not expose an explicit route registration function`);
  }
}

const modules = [
  'apps/api/modules/auth/supabaseAuth.js',
  'apps/api/modules/persistence/supabasePostgres.js',
  'apps/api/modules/repositories/appDocumentRepository.js',
  'apps/api/modules/repositories/vendorRepository.js',
  'apps/api/modules/repositories/tripRepository.js',
  'apps/api/modules/repositories/bookingRepository.js',
  'apps/api/modules/repositories/paymentRepository.js',
];

for (const rel of modules) {
  const content = fs.readFileSync(path.join(root, rel), 'utf8');
  if (content.includes("require('../../src/")) {
    failures.push(`${rel} imports legacy src runtime modules`);
  }
}

if (failures.length) {
  console.error('Mission 09C Phase 3 API module graph verification FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mission 09C Phase 3 API module graph verification PASSED');
console.log(`Verified ${required.length} extracted API modules, ${routeModules.length} route modules, and ${retired.length} retired legacy locations.`);
