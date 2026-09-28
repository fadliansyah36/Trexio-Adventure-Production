const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.resolve(__dirname, '..');
const runtimeFiles = [
  'server.js',
  'src/db/supabasePostgres.js',
  'src/db/appDocumentRepository.js',
  'src/repositories/bookingRepository.js',
  'src/repositories/paymentRepository.js'
].map((p) => path.join(ROOT, p));

const forbidden = /\b(?:app_bookings|app_payments)\b/g;
const hits = [];

for (const file of runtimeFiles) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (forbidden.test(text)) hits.push(path.relative(ROOT, file));
  forbidden.lastIndex = 0;
}

if (hits.length) {
  console.error('FAIL: runtime legacy table references found:', hits.join(', '));
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  await client.connect();
  const q = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM public.app_bookings) AS legacy_bookings,
      (SELECT COUNT(*) FROM public.archive_app_bookings) AS archive_bookings,
      (SELECT COUNT(*) FROM public.bookings) AS relational_bookings,
      (SELECT COUNT(*) FROM public.app_bookings b JOIN public.archive_app_bookings a ON a.id=b.id AND a.data=b.data) AS booking_exact_matches,
      (SELECT COUNT(*) FROM public.app_payments) AS legacy_payments,
      (SELECT COUNT(*) FROM public.archive_app_payments) AS archive_payments,
      (SELECT COUNT(*) FROM public.payment_transactions) AS relational_payments,
      (SELECT COUNT(*) FROM public.app_payments p JOIN public.archive_app_payments a ON a.id=p.id AND a.data=p.data) AS payment_exact_matches;
  `);
  const r = q.rows[0];
  const ok =
    Number(r.legacy_bookings) === Number(r.archive_bookings) &&
    Number(r.booking_exact_matches) === Number(r.legacy_bookings) &&
    Number(r.legacy_payments) === Number(r.archive_payments) &&
    Number(r.payment_exact_matches) === Number(r.legacy_payments);

  console.log(JSON.stringify({ runtimeLegacyReferences: 0, ...r, status: ok ? 'READY_FOR_DESTRUCTIVE_RETIREMENT' : 'BLOCKED' }, null, 2));
  process.exitCode = ok ? 0 : 1;
})().catch((err) => {
  console.error('FAIL: final retirement verification error:', err.message);
  process.exitCode = 1;
}).finally(async () => {
  await client.end().catch(() => {});
});
