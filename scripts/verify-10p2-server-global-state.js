#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const c=fs.readFileSync(path.join(root,'apps/api/server.js'),'utf8');
const lines=c.split('\n');
const patterns=[
 /const users\s*=\s*\[\]/,/const conversations\s*=\s*\[\]/,/const messages\s*=\s*\[\]/,
 /const destinations\s*=\s*\[\]/,/const vendors\s*=\s*\[\]/,/const trips\s*=\s*\[\]/,
 /const coupons\s*=\s*\[\]/,/const communities\s*=\s*\[\]/,/const community_members\s*=\s*\[\]/,
 /const community_posts\s*=\s*\[\]/,/const community_comments\s*=\s*\[\]/,/const community_events\s*=\s*\[\]/,
 /const community_bookmarks\s*=\s*\[\]/,/const community_reports\s*=\s*\[\]/,/const community_moderation_logs\s*=\s*\[\]/,
 /const rentals\s*=\s*\[\]/,/const bookings\s*=\s*\[\]/,/const rental_orders\s*=\s*\[\]/,
 /const push_subscriptions\s*=\s*\[\]/,/const audit_logs\s*=\s*\[\]/,/const payment_transactions\s*=\s*\[\]/
];
const findings=[];
for(let i=0;i<lines.length;i++) for(const re of patterns) if(re.test(lines[i])) findings.push({line:i+1,source:lines[i].trim()});
const hydration=/hydrateRelationalCoreCollections|hydrateCollections|__collectionArray/.test(c);
const persistence=/persistCollection\(|replace\(name, arr\)/.test(c);
console.log(JSON.stringify({stage:'10P.2',status:findings.length===0?'PASS':'BLOCKED',global_business_state_count:findings.length,hydration_compatibility_layer:hydration,bulk_memory_persistence:persistence,findings},null,2));
process.exit(findings.length?1:0);
