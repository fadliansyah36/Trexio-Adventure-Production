#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const store = read('apps/api/modules/backpacker/store.js');
const routes = read('apps/api/modules/backpacker/routes.js');
const server = read('apps/api/server.js');
const persistence = read('apps/api/modules/persistence/supabasePostgres.js');
const migrationDir = path.join(root, 'supabase/migrations');
const migrations = fs.readdirSync(migrationDir).filter((n) => n.includes('tenp2_backpacker_postgres_persistence')).map((n) => fs.readFileSync(path.join(migrationDir,n),'utf8')).join('\n');
const collections = [
 ['profiles','backpacker_profiles'],['intents','backpacker_travel_intents'],['journeys','backpacker_journeys'],
 ['stops','backpacker_journey_stops'],['participants','backpacker_journey_participants'],['expenses','backpacker_journey_expenses'],
 ['rides','backpacker_shared_rides'],['ride_participants','backpacker_shared_ride_participants'],['ride_requests','backpacker_shared_ride_requests'],
 ['connections','backpacker_connections'],['reports','backpacker_reports'],['location_consents','backpacker_location_consents'],
 ['locations','backpacker_locations'],['assistance_requests','backpacker_assistance_requests']
];
const failures=[]; const expect=(c,m)=>{if(!c) failures.push(m)};
expect(!/require\(['\"]fs['\"]\)/.test(store),'store.js still imports fs');
expect(!/require\(['\"]path['\"]\)/.test(store),'store.js still imports path');
expect(!/fs\.readFileSync|fs\.writeFileSync|fs\.existsSync|fs\.mkdirSync/.test(store),'store.js still contains filesystem persistence');
expect(!/const\s+db\s*=\s*\{/.test(store),'store.js still declares a process-global business collection object');
expect(/new AsyncLocalStorage\(\)/.test(store),'store.js does not use request-scoped context');
expect(/appDocumentRepository/.test(store),'store.js does not use repository boundary');
expect(/runBackpackerRequestContext/.test(routes),'router does not initialize request context');
expect(/flushBackpackerRequestContext/.test(routes),'router does not flush writes before response');
expect(/appDocumentRepository\.list\('articles'\)/.test(server),'articles route does not read repository');
expect(/appDocumentRepository\.save\('articles'/.test(server),'article create does not write repository');
expect(/appDocumentRepository\.list\('announcements'\)/.test(server),'announcement routes do not read repository');
expect(/appDocumentRepository\.save\('announcements'/.test(server),'announcement create does not write repository');
expect(/appDocumentRepository\.remove\('announcements'/.test(server),'announcement delete does not remove from repository');
for (const [logical,table] of collections) {
 expect(store.includes(logical + ': \'' + table + '\''),'missing store mapping for '+logical);
 expect(persistence.includes(table + ': \'' + table + '\''),'missing persistence mapping for '+logical);
 expect(migrations.includes('CREATE TABLE IF NOT EXISTS public.'+table),'missing migration table for '+table);
}
if(failures.length){console.error('10P.2 BLOCKED'); failures.forEach((x)=>console.error(' - '+x)); process.exit(1)}
console.log(JSON.stringify({status:'PASS',stage:'10P.2',domain:'backpacker',collections:collections.length},null,2));