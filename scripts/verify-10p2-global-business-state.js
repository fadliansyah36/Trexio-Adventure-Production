#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'apps/api/server.js'), 'utf8');

const forbiddenDeclarations = [
  'users','conversations','messages','tenants','tenant_domains','destinations','vendors','trips',
  'coupons','communities','community_categories','community_members','community_posts','community_comments',
  'community_events','community_bookmarks','community_reports','community_moderation_logs',
  'community_suspended_users','rentals','bookings','rental_orders','push_subscriptions','audit_logs',
  'auditLogs','payment_transactions','subscription_plans','tenant_subscriptions','advertising_packages',
  'advertising_campaigns','billing_transactions','wishlists','carts','reviews','notifications','wallets',
  'payouts','supportTickets','platformDisputes','featureFlags','securityIncidents','masterCategories',
  'masterLocations','masterRolesPermissions','homepageConfig','csConfig'
];

const failures = [];
const expectAbsent = (pattern, message) => {
  if (pattern.test(server)) failures.push(message);
};

for (const name of forbiddenDeclarations) {
  expectAbsent(new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*(?:\\[|\\{|new\\s+Set)', 'm'),
    'server.js still declares process-global business state: ' + name);
}

for (const token of [
  'hydrateCollections',
  '__collectionArray',
  'ALL_SYNC_COLLECTIONS',
  'hydrateRelationalCoreCollections'
]) {
  expectAbsent(new RegExp(token), 'legacy boot hydration boundary remains: ' + token);
}

expectAbsent(/const\\s+users\\s*=\\s*\[\]/, 'users empty-array compatibility state remains');
expectAbsent(/const\\s+(?:vendors|trips|bookings|payment_transactions)\\s*=\\[\]/, 'relational core empty-array state remains');
expectAbsent(/const\\s+(?:conversations|messages|notifications)\\s*=\\[\]/, 'communications empty-array state remains');

const runtimeState = fs.readFileSync(path.join(root, 'apps/api/modules/runtime/businessState.js'), 'utf8');
if (!/AsyncLocalStorage/.test(runtimeState)) failures.push('businessState.js is not request-scoped');
if (!/appDocumentRepository/.test(runtimeState)) failures.push('businessState.js is not repository-backed');
if (!/vendorRepository|tripRepository|bookingRepository|paymentRepository/.test(runtimeState)) failures.push('businessState.js missing relational repository adapters');

if (failures.length) {
  console.error('10P.2 FULL SERVER STATE GATE: BLOCKED');
  failures.forEach((x) => console.error(' - ' + x));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  stage: '10P.2',
  scope: 'server.js process-global business state',
  state_domains_cut_over: forbiddenDeclarations.length,
  boot_hydration_boundaries_removed: 4
}, null, 2));
