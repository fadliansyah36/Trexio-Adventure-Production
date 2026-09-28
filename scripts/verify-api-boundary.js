#!/usr/bin/env node
/**
 * Mission 09C Phase 2 — API boundary verification
 *
 * This is intentionally structural: it verifies that the production entrypoint
 * is now apps/api/server.js while legacy root source remains reachable through
 * an explicit transitional dependency path.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiServer = path.join(root, 'apps', 'api', 'server.js');
const rootServer = path.join(root, 'server.js');
const packageJson = path.join(root, 'package.json');

const fail = (message) => {
  console.error(`[09C/API] FAIL: ${message}`);
  process.exitCode = 1;
};

if (!fs.existsSync(apiServer)) fail('apps/api/server.js is missing');
if (!fs.existsSync(rootServer)) fail('root server.js compatibility entrypoint is missing');

const apiSource = fs.existsSync(apiServer) ? fs.readFileSync(apiServer, 'utf8') : '';
const rootSource = fs.existsSync(rootServer) ? fs.readFileSync(rootServer, 'utf8') : '';
const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));

if (!apiSource.includes("const ROOT_DIR = path.resolve(__dirname, '..', '..');")) {
  fail('API runtime does not declare the repository root boundary');
}
if (!apiSource.includes("require('../../src/")) {
  fail('API runtime no longer exposes its explicit transitional src dependency boundary');
}
if (apiSource.includes("require('./src/") || apiSource.includes('require("./src/')) {
  fail('API runtime contains an unsafe legacy-relative ./src import');
}
if (!apiSource.includes("path.join(ROOT_DIR, 'frontend', 'build')")) {
  fail('frontend build path was not made root-relative');
}
if (!apiSource.includes("path.join(ROOT_DIR, 'uploads')")) {
  fail('uploads path was not made root-relative');
}
if (!rootSource.includes("require('./apps/api/server');")) {
  fail('root server.js is not delegating to apps/api/server.js');
}
if (pkg.scripts?.start !== 'node apps/api/server.js' || pkg.scripts?.dev !== 'node apps/api/server.js') {
  fail('root start/dev scripts are not routed through apps/api/server.js');
}

if (!process.exitCode) {
  console.log('[09C/API] PASS: dependency-safe API boundary structure is consistent.');
  console.log('[09C/API] NOTE: src/* remains a transitional dependency and is intentionally not moved yet.');
}
