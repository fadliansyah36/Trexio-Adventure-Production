/**
 * TREXIO SUPABASE DATABASE PULL / SCHEMA INTROSPECTION RUNNER
 * Introspects live schema from Supabase PostgreSQL and saves to supabase/schema.sql
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../src/db/supabasePostgres');

async function pullDatabase() {
  const pool = getPool();
  console.log('============================================================');
  console.log('TREXIO SUPABASE DATABASE PULL & SCHEMA INTROSPECTION');
  console.log('============================================================');
  const targetHost = process.env.PGHOST || process.env.DATABASE_URL?.split('@')[1] || 'Supabase Postgres';
  console.log(`Pulling schema from target: ${targetHost}\n`);

  // 1. Extensions
  const extRes = await pool.query(`
    SELECT extname, extversion 
    FROM pg_extension 
    WHERE extname NOT IN ('plpgsql')
    ORDER BY extname;
  `);

  // 2. Tables in public schema
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  const tables = tablesRes.rows.map(r => r.table_name);

  // 3. Columns for each table
  const columnsRes = await pool.query(`
    SELECT 
      table_name,
      column_name,
      data_type,
      udt_name,
      character_maximum_length,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  // 4. Primary keys
  const pkRes = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
  `);

  // 5. Indexes
  const indexRes = await pool.query(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
    ORDER BY tablename, indexname;
  `);

  // 6. RLS status & Policies
  const rlsRes = await pool.query(`
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  const policiesRes = await pool.query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  // 7. Migrations history
  let migrations = [];
  try {
    const migRes = await pool.query(`SELECT version, name, applied_at FROM public._supabase_migrations ORDER BY version;`);
    migrations = migRes.rows;
  } catch (e) {}

  // Construct schema.sql
  let sqlContent = `-- ==========================================================================\n`;
  sqlContent += `-- TREXIO SUPABASE POSTGRESQL SCHEMA DUMP / PULLED FROM LIVE DATABASE\n`;
  sqlContent += `-- Host: ${targetHost}\n`;
  sqlContent += `-- Pulled at: ${new Date().toISOString()}\n`;
  sqlContent += `-- Total Tables: ${tables.length}\n`;
  sqlContent += `-- ==========================================================================\n\n`;

  // Extensions
  if (extRes.rows.length > 0) {
    sqlContent += `-- --- EXTENSIONS ---\n`;
    for (const ext of extRes.rows) {
      sqlContent += `CREATE EXTENSION IF NOT EXISTS "${ext.extname}";\n`;
    }
    sqlContent += `\n`;
  }

  // Organize columns & primary keys
  const colMap = {};
  for (const row of columnsRes.rows) {
    if (!colMap[row.table_name]) colMap[row.table_name] = [];
    colMap[row.table_name].push(row);
  }

  const pkMap = {};
  for (const row of pkRes.rows) {
    if (!pkMap[row.table_name]) pkMap[row.table_name] = [];
    pkMap[row.table_name].push(row.column_name);
  }

  // Tables
  sqlContent += `-- --- TABLES DEFINITION ---\n\n`;
  for (const table of tables) {
    sqlContent += `-- Table: ${table}\n`;
    sqlContent += `CREATE TABLE IF NOT EXISTS public.${table} (\n`;
    const cols = colMap[table] || [];
    const pks = pkMap[table] || [];
    const colDefs = [];

    for (const col of cols) {
      let typeStr = col.data_type;
      if (typeStr === 'USER-DEFINED') {
        typeStr = col.udt_name;
      } else if (typeStr === 'character varying') {
        typeStr = col.character_maximum_length ? `varchar(${col.character_maximum_length})` : 'varchar';
      } else if (typeStr === 'timestamp with time zone') {
        typeStr = 'timestamptz';
      } else if (typeStr === 'timestamp without time zone') {
        typeStr = 'timestamp';
      }

      let def = `  ${col.column_name} ${typeStr}`;
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      if (col.is_nullable === 'NO') {
        def += ` NOT NULL`;
      }
      colDefs.push(def);
    }

    if (pks.length > 0) {
      colDefs.push(`  CONSTRAINT ${table}_pkey PRIMARY KEY (${pks.join(', ')})`);
    }

    sqlContent += colDefs.join(',\n') + '\n);\n\n';
  }

  // Indexes
  if (indexRes.rows.length > 0) {
    sqlContent += `-- --- INDEXES ---\n\n`;
    for (const idx of indexRes.rows) {
      sqlContent += `${idx.indexdef};\n`;
    }
    sqlContent += `\n`;
  }

  // Row Level Security (RLS) & Policies
  if (rlsRes.rows.some(r => r.rls_enabled)) {
    sqlContent += `-- --- ROW LEVEL SECURITY (RLS) ---\n\n`;
    for (const r of rlsRes.rows) {
      if (r.rls_enabled) {
        sqlContent += `ALTER TABLE public.${r.table_name} ENABLE ROW LEVEL SECURITY;\n`;
      }
    }
    sqlContent += `\n`;
  }

  if (policiesRes.rows.length > 0) {
    sqlContent += `-- --- POLICIES ---\n\n`;
    for (const pol of policiesRes.rows) {
      const rolesStr = Array.isArray(pol.roles) ? pol.roles.join(', ') : (pol.roles ? String(pol.roles).replace(/^\{|\}$/g, '') : 'public');
      sqlContent += `CREATE POLICY "${pol.policyname}" ON public.${pol.tablename}\n`;
      sqlContent += `  FOR ${pol.cmd} TO ${rolesStr || 'public'}\n`;
      if (pol.qual) {
        sqlContent += `  USING (${pol.qual})\n`;
      }
      if (pol.with_check) {
        sqlContent += `  WITH CHECK (${pol.with_check})\n`;
      }
      sqlContent += `;\n\n`;
    }
  }

  // Save to supabase/schema.sql
  const outPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  fs.writeFileSync(outPath, sqlContent, 'utf8');

  console.log(`✓ Pulled ${tables.length} tables from Supabase.`);
  console.log(`✓ Introspected ${indexRes.rows.length} index(es) and ${policiesRes.rows.length} security policy(ies).`);
  if (migrations.length > 0) {
    console.log(`✓ Recorded ${migrations.length} applied migration(s) in _supabase_migrations.`);
  }
  console.log(`✓ Saved complete schema definition to: ${outPath}`);
  console.log('------------------------------------------------------------');
  console.log('STATUS: ✓ SUPABASE DB PULL COMPLETED SUCCESSFULLY');
}

pullDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal Database Pull Error:', err);
    process.exit(1);
  });
