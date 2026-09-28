/**
 * Apply the Mission 07 Vendor/Trip relational cutover only.
 * This is intentionally separate from the generic migration runner so a
 * production operator can apply this high-risk domain migration explicitly.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../src/db/supabasePostgres');

const MIGRATION = '20260929000000_MISSION_07_relational_vendor_trip_cutover.sql';

async function main() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('trexio:mission07:vendor-trip'))");

    const required = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('vendors', 'trips', 'app_vendors', 'app_trips')
    `);

    const found = new Set(required.rows.map((row) => row.table_name));
    const missing = ['vendors', 'trips', 'app_vendors', 'app_trips'].filter((name) => !found.has(name));
    if (missing.length) {
      throw new Error(`Required tables are missing: ${missing.join(', ')}`);
    }

    const file = path.join(__dirname, '..', 'supabase', 'migrations', MIGRATION);
    const sql = fs.readFileSync(file, 'utf8');

    console.log(`[Mission 07] Applying ${MIGRATION}`);
    await client.query(sql);

    const columns = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND ((table_name = 'vendors' AND column_name = 'data')
          OR (table_name = 'trips' AND column_name IN ('external_id', 'data')))
      ORDER BY table_name, column_name
    `);

    const columnSet = new Set(columns.rows.map((r) => `${r.table_name}.${r.column_name}`));
    for (const expected of ['vendors.data', 'trips.external_id', 'trips.data']) {
      if (!columnSet.has(expected)) {
        throw new Error(`Post-migration verification failed: missing ${expected}`);
      }
    }

    await client.query('COMMIT');
    console.log('[Mission 07] Migration applied and schema verification passed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Mission 07] Migration failed; transaction rolled back.');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[Mission 07] ERROR:', err.message);
  process.exit(1);
});
