'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const files = { webService:'apps/web/src/services/marketplaceService.js', adminService:'apps/admin/src/services/marketplaceService.js', home:'apps/web/src/pages/Home.jsx', explore:'apps/web/src/pages/Explore.jsx', detail:'apps/web/src/pages/TripDetail.jsx', adminTrips:'apps/admin/src/pages/admin/AdminTrips.jsx', apiRoute:'apps/api/modules/routes/marketplace.js', apiService:'apps/api/modules/services/marketplaceService.js' };
function read(key){ const f=path.join(ROOT,files[key]); if(!fs.existsSync(f)){console.error('[10P.6] FAIL: missing '+files[key]);process.exitCode=1;return '';} return fs.readFileSync(f,'utf8'); }
const webService=read('webService'), adminService=read('adminService'), home=read('home'), explore=read('explore'), detail=read('detail'), adminTrips=read('adminTrips'), route=read('apiRoute'), service=read('apiService');
for(const x of ['async listTrips','async listFeatured','async getTrip','async listCategory','api.get("/trips"','api.get("/trips/featured"']) if(!webService.includes(x)){console.error('[10P.6] FAIL: web service missing '+x);process.exitCode=1;}
for(const x of ['async listTrips','async createTrip','async updateTrip','async deleteTrip']) if(!adminService.includes(x)){console.error('[10P.6] FAIL: admin service missing '+x);process.exitCode=1;}
for(const [n,c,x] of [['Home',home,'marketplaceService'],['Explore',explore,'marketplaceService.listTrips'],['TripDetail',detail,'marketplaceService.getTrip'],['AdminTrips',adminTrips,'marketplaceService']]) if(!c.includes(x)){console.error('[10P.6] FAIL: '+n+' not bound to marketplace service');process.exitCode=1;}
if(/api\\.get\\(["']\\/trips["']/.test(explore)){console.error('[10P.6] FAIL: Explore still directly calls /trips');process.exitCode=1;}
if(/api\\.get\\(["']\\/trips\\/featured["']/.test(home)){console.error('[10P.6] FAIL: Home still directly calls /trips/featured');process.exitCode=1;}
if(/api\\.get\\(["']\\/trips\\/\\$/.test(detail)){console.error('[10P.6] FAIL: TripDetail still directly calls trip detail API');process.exitCode=1;}
for(const x of ["require('../repositories/tripRepository')","require('../repositories/vendorRepository')",'async function listTrips','async function listFeatured','async function findTrip']) if(!service.includes(x)){console.error('[10P.6] FAIL: backend service missing '+x);process.exitCode=1;}
if(!route.includes('marketplaceService.listTrips')){console.error('[10P.6] FAIL: /trips not service-backed');process.exitCode=1;}
if(!route.includes('marketplaceService.findTrip')){console.error('[10P.6] FAIL: /trips/:trip_id not service-backed');process.exitCode=1;}
if(route.includes('findProduct(req.params.trip_id)')){console.error('[10P.6] FAIL: trip detail still uses findProduct');process.exitCode=1;}
if(process.exitCode)process.exit(process.exitCode);
console.log('[10P.6] PASS — selected PWA/Admin marketplace paths use API contract -> service -> repository -> PostgreSQL.');