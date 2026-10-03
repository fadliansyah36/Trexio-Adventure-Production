'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_ROOTS = ['apps/api', 'apps/web', 'apps/admin', 'packages'];
const EXCLUDED = new Set(['node_modules', '.next', 'build', 'dist', 'coverage', '.git']);
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const findings = [];
const BUSINESS_NAMES = new Set([
  'users','vendors','vendor','trips','trip','bookings','booking','destinations','destination',
  'coupons','coupon','communities','community','community_members','community_posts',
  'community_events','rentals','rental','rental_orders','products','product','listings','listing',
  'reviews','review','wishlists','wishlist','carts','cart','notifications','notification',
  'messages','message','conversations','conversation','payment_transactions','paymentTransaction',
  'subscription_plans','tenant_subscriptions','advertising_packages','advertising_campaigns',
  'campaigns','campaign','orders','order','partners','partner','guides','guide','porters','porter',
  'basecamps','basecamp','homestays','homestay','transportations','transportation','events','event',
  'gear','gears','routes','route'
]);

const BUSINESS_KEYS = [
  /(^|_)id$/i,/tenant_?id/i,/user_?id/i,/vendor_?id/i,/trip_?id/i,/booking_?id/i,
  /price/i,/amount/i,/currency/i,/status/i,/capacity/i,/quantity/i,/inventory/i,/slug/i,/partner/i
];

function shouldSkip(file) {
  const parts = file.split(path.sep);
  return parts.some((part) => EXCLUDED.has(part)) ||
    /(^|[\\/])(test|tests|__tests__|fixtures|mocks?|stories)([\\/]|$)/i.test(file);
}

function add(file,line,name,reason,sample) {
  findings.push({file:path.relative(ROOT,file),line,name,reason,sample:sample.trim().slice(0,300)});
}

function scanFile(file) {
  if (shouldSkip(file) || !EXTENSIONS.has(path.extname(file))) return;
  const text = fs.readFileSync(file,'utf8');
  const lines = text.split(/\r?\n/);
  const arrayPattern = /(?:const|let|var|export\s+const|export\s+let|export\s+var)\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*\[\s*\{/g;
  let match;
  while ((match = arrayPattern.exec(text))) {
    const name = match[1], start = match.index;
    const line = text.slice(0,start).split(/\r?\n/).length;
    const window = text.slice(start,Math.min(text.length,start+2500));
    const normalizedName = name.toLowerCase();
    const productionPath = /(^|[\\/])(apps[\\/](api|web|admin)|packages)([\\/]|$)/.test(file);
    const businessName = BUSINESS_NAMES.has(normalizedName) ||
      [...BUSINESS_NAMES].some((term) => normalizedName.includes(term));
    const businessShape = BUSINESS_KEYS.some((pattern) => pattern.test(window));
    if (productionPath && (businessName || businessShape)) {
      add(file,line,name,businessName?'business-named-static-array':'business-shaped-static-array',lines[line-1]||'');
    }
  }
}

function walk(target) {
  const absolute = path.join(ROOT,target);
  if (!fs.existsSync(absolute)) return;
  if (fs.statSync(absolute).isFile()) return scanFile(absolute);
  for (const entry of fs.readdirSync(absolute,{withFileTypes:true})) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const full = path.join(absolute,entry.name);
    if (entry.isDirectory()) walk(path.relative(ROOT,full)); else scanFile(full);
  }
}

for (const root of SCAN_ROOTS) walk(root);

const report = {
  stage:'10P.4',
  policy:'Production business data must not use static object arrays as a source of truth; immutable configuration/reference data is allowed.',
  status:findings.length?'BLOCKED':'PASS',
  finding_count:findings.length,
  findings
};

console.log(JSON.stringify(report,null,2));
if (findings.length) process.exit(1);
