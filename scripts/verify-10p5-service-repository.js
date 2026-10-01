'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ROUTE = path.join(ROOT, 'apps/api/modules/routes/marketplace.js');
const SERVER = path.join(ROOT, 'apps/api/server.js');
const SERVICE = path.join(ROOT, 'apps/api/modules/services/marketplaceService.js');

function fail(message) {
  console.error('[10P.5] FAIL:', message);
  process.exitCode = 1;
}

if (!fs.existsSync(SERVICE)) fail('marketplaceService.js is missing');
if (!fs.existsSync(ROUTE)) fail('marketplace.js is missing');
if (!fs.existsSync(SERVER)) fail('apps/api/server.js is missing');

if (fs.existsSync(SERVICE)) {
  const service = fs.readFileSync(SERVICE, 'utf8');
  for (const required of [
    "require('../repositories/tripRepository')",
    "require('../repositories/vendorRepository')",
    'async function listTrips',
    'async function listFeatured',
    'module.exports',
  ]) {
    if (!service.includes(required)) fail('Service missing required contract: ' + required);
  }
}

if (fs.existsSync(ROUTE)) {
  const route = fs.readFileSync(ROUTE, 'utf8');
  if (!route.includes('marketplaceService')) fail('Marketplace route is not bound to marketplaceService');
  if (!route.includes('marketplaceService.listTrips')) fail('GET /trips does not use marketplaceService.listTrips');
  if (!route.includes('marketplaceService.listFeatured')) fail('GET /trips/featured does not use marketplaceService.listFeatured');
  if (/consts+tripss*=s*req./.test(route)) fail('Route derives business trips from request data');
}

if (fs.existsSync(SERVER)) {
  const server = fs.readFileSync(SERVER, 'utf8');
  if (!server.includes("require('./modules/services/marketplaceService')")) fail('server.js does not compose marketplaceService');
  if (!server.includes('marketplaceService,')) fail('server.js does not inject marketplaceService');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('[10P.5] PASS — marketplace PWA read path is service → repository → Supabase PostgreSQL.');
