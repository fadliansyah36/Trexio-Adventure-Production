/**
 * Apply the Mission 07 Vendor/Trip relational cutover only.
 * This is intentionally separate from the generic migration runner so a
 * production operator can apply this high-risk domain migration explicitly.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../src/db/supabasePostgres');

const BASELINE_MIGRATION = '20260829000000_V3_trexio_migration.sql';
const MIGRATION = '20260929000000_MISSION_07_relational_vendor_trip_cutover.sql';

async function main() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('trexio:mission07:vendor-trip'))");

    const baselineFile = path.join(__dirname, '..', 'supabase', 'migrations', BASELINE_MIGRATION);
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', MIGRATION);

    const existingTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('vendors', 'trips', 'app_vendors', 'app_trips')");
    const existingSet = new Set(existingTables.rows.map((row) => row.table_name));
    const baselineNeeded = !existingSet.has('vendors') || !existingSet.has('trips') || !existingSet.has('app_vendors') || !existingSet.has('app_trips');

    if (baselineNeeded) {
      console.log(`[Mission 07] V3 relational/app baseline incomplete; applying ${BASELINE_MIGRATION} first`);
      await client.query(fs.readFileSync(baselineFile, 'utf8'));
    }

    const requiredAfterBaseline = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('vendors', 'trips', 'app_vendors', 'app_trips')");
    const requiredSet = new Set(requiredAfterBaseline.rows.map((row) => row.table_name));
    const missingAfterBaseline = ['vendors', 'trips', 'app_vendors', 'app_trips'].filter((name) => !requiredSet.has(name));
    if (missingAfterBaseline.length) {
      throw new Error(`Required tables are missing after baseline: ${missingAfterBaseline.join(', ')}`);
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');
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
