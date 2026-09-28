const { Pool } = require('pg');

function resolveDatabaseUrl() {
  const value = process.env.DATABASE_URL || '';
  if (!value || value.includes('<project-ref>') || value.includes('<db-password>') || value.includes('<region>')) {
    throw new Error('DATABASE_URL is required for relational cutover verification.');
  }
  return value;
}

function normalize(value) {
  if (value === null || value === undefined) return null;
  return String(value);
}

function coreVendor(row) {
  return {
    id: normalize(row.id),
    user_id: normalize(row.user_id),
    brand_name: normalize(row.brand_name),
    slug: normalize(row.slug),
    status: normalize(row.status),
  };
}

function coreTrip(row) {
  return {
    id: normalize(row.external_id || row.id),
    title: normalize(row.title),
    destination: normalize(row.destination),
    vendor_id: normalize(row.vendor_id),
    status: normalize(row.status),
  };
}

function compareById(name, legacyRows, relationalRows, mapper) {
  const legacy = new Map(legacyRows.map((row) => [normalize(row.id), mapper(row)]));
  const relational = new Map(relationalRows.map((row) => [normalize(row.id), mapper(row)]));

  const missing = [...legacy.keys()].filter((id) => !relational.has(id));
  const extra = [...relational.keys()].filter((id) => !legacy.has(id));
  const changed = [];

  for (const id of legacy.keys()) {
    if (!relational.has(id)) continue;
    const left = JSON.stringify(legacy.get(id));
    const right = JSON.stringify(relational.get(id));
    if (left !== right) changed.push(id);
  }

  console.log(`[Relational Cutover] ${name}: legacy=${legacy.size}, relational=${relational.size}, missing=${missing.length}, extra=${extra.length}, changed=${changed.length}`);

  if (missing.length || changed.length) {
    if (missing.length) console.error(`  Missing relational IDs: ${missing.slice(0, 20).join(', ')}`);
    if (changed.length) console.error(`  Core-field mismatches: ${changed.slice(0, 20).join(', ')}`);
  }
  if (extra.length) {
    console.warn(`  Relational-only IDs: ${extra.slice(0, 20).join(', ')}`);
  }

  return missing.length === 0 && changed.length === 0;
}

async function main() {
  const pool = new Pool({
    connectionString: resolveDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const [legacyVendors, relationalVendors, legacyTrips, relationalTrips] = await Promise.all([
      pool.query(`SELECT data->>'id' AS id, data->>'user_id' AS user_id,
                         data->>'brand_name' AS brand_name, data->>'slug' AS slug,
                         data->>'status' AS status
                  FROM app_vendors
                  WHERE NULLIF(data->>'id', '') IS NOT NULL`),
      pool.query(`SELECT id, user_id, brand_name, slug, status FROM vendors`),
      pool.query(`SELECT data->>'id' AS id, data->>'title' AS title,
                         data->>'destination' AS destination,
                         data->>'vendor_id' AS vendor_id,
                         CASE WHEN data->>'published' = 'false' THEN 'draft'
                              ELSE COALESCE(NULLIF(data->>'status', ''), 'published')
                         END AS status
                  FROM app_trips
                  WHERE NULLIF(data->>'id', '') IS NOT NULL`),
      pool.query(`SELECT external_id, id, title, destination, vendor_id, status
                  FROM trips`),
    ]);

    const vendorsOk = compareById(
      'vendors',
      legacyVendors.rows,
      relationalVendors.rows,
      coreVendor
    );

    const tripsOk = compareById(
      'trips',
      legacyTrips.rows,
      relationalTrips.rows,
      coreTrip
    );

    if (!vendorsOk || !tripsOk) {
      console.error('[Relational Cutover] FAILED — do not retire app_* compatibility tables yet.');
      process.exitCode = 1;
      return;
    }

    console.log('[Relational Cutover] PASSED — Vendor and Trip relational rows match legacy core fields.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[Relational Cutover] ERROR:', err.message);
  process.exitCode = 1;
});
