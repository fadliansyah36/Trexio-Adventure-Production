/**
 * TREXIO SUPABASE DATABASE PUSH / MIGRATION SYNC RUNNER
 * Applies SQL migrations from supabase/migrations/ directly to Supabase PostgreSQL.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../src/db/cloudSqlSync');

async function pushDatabase() {
  const pool = getPool();
  console.log('============================================================');
  console.log('TREXIO SUPABASE DATABASE PUSH & MIGRATION SYNC');
  console.log('============================================================');
  console.log(`Target: ${process.env.PGHOST || process.env.DATABASE_URL?.split('@')[1] || 'Supabase Postgres'}`);

  // Ensure migration tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public._supabase_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('[WARN] No supabase/migrations directory found.');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Found ${files.length} migration file(s).`);

  for (const file of files) {
    const version = file.split('_')[0];
    const checkRes = await pool.query('SELECT version, applied_at FROM public._supabase_migrations WHERE version = $1', [version]);
    if (checkRes.rows.length > 0) {
      console.log(`✓ [ALREADY APPLIED] ${file} (applied: ${checkRes.rows[0].applied_at.toISOString()})`);
      continue;
    }

    console.log(`⚡ [APPLYING] ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO public._supabase_migrations (version, name) VALUES ($1, $2)', [version, file]);
    console.log(`✓ [SUCCESS] ${file} applied successfully!`);
  }

  // Schema table summary
  const tablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('------------------------------------------------------------');
  console.log(`Total active tables in Supabase public schema: ${tablesRes.rows.length}`);
  console.log('Status: ✓ SUPABASE DATABASE PUSH & SCHEMA SYNC COMPLETE');
}

pushDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal Database Push Error:', err);
    process.exit(1);
  });
