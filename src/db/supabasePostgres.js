const { Pool } = require('pg');

let pool = null;

function getResolvedDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.includes('<project-ref>') && !envUrl.includes('<db-password>') && !envUrl.includes('<region>')) {
    return envUrl;
  }
  return '';
}

function getPool() {
  if (!pool) {
    const rawDbUrl = getResolvedDatabaseUrl();
    if (!rawDbUrl) {
      console.error('[Supabase PostgreSQL] FATAL: DATABASE_URL is not configured.');
      return null;
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        const hostname = new URL(rawDbUrl).hostname.toLowerCase();
        const isSupabaseHost =
          hostname.endsWith('.supabase.co') ||
          hostname.endsWith('.supabase.com');
        if (!isSupabaseHost) {
          console.error('[Supabase PostgreSQL] FATAL: production DATABASE_URL must point to Supabase PostgreSQL.');
          return null;
        }
      } catch (err) {
        console.error('[Supabase PostgreSQL] FATAL: DATABASE_URL is not a valid PostgreSQL URL.');
        return null;
      }
    }

    const sslOption = { rejectUnauthorized: false };

    pool = new Pool({
      connectionString: rawDbUrl,
      ssl: sslOption,
      max: parseInt(process.env.SQL_POOL_MAX || '10', 10),
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      console.error('[Supabase PostgreSQL] Pool client error:', err.message);
    });
  }
  return pool;
}

async function checkDbConnection() {
  const p = getPool();
  if (!p) {
    return { ok: false, error: 'Database Pool tidak terkonfigurasi (DATABASE_URL belum diatur)' };
  }
  try {
    const res = await p.query('SELECT 1 AS health_check, NOW() AS server_time');
    return { ok: true, timestamp: new Date().toISOString(), server_time: res.rows[0]?.server_time };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function initSupabasePostgresSchema() {
  const p = getPool();
  if (!p) return;

  const requiredTables = [
    'users', 'vendors', 'trips', 'bookings', 'payment_transactions',
    'conversations', 'messages', 'notifications', 'news', 'travel_intents',
    'journeys', 'rides', '_supabase_migrations',
    ...Object.values(APP_DOC_TABLES),
  ];

  try {
    const result = await p.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [requiredTables]
    );
    const existing = new Set(result.rows.map((row) => row.table_name));
    const missing = requiredTables.filter((table) => !existing.has(table));

    if (missing.length > 0) {
      throw new Error(
        `Supabase PostgreSQL schema is incomplete. Missing table(s): ${missing.join(', ')}. Run "npm run db:push" before starting the application.`
      );
    }

    console.log('[Supabase PostgreSQL] Schema verification passed. Runtime DDL is disabled; migrations are authoritative.');
  } catch (err) {
    console.error('[Supabase PostgreSQL] Schema verification failed:', err.message);
    throw err;
  }
}

async function saveUserToSupabasePostgres(user) {
  if (!user || (!user.uid && !user.id)) return;
  const p = getPool();
  if (!p) return;
  try {
    const uid = String(user.uid || user.id);
    const email = String(user.email || 'user@trexio.id');
    const name = String(user.name || user.full_name || 'Pelanggan TREXIO');
    const role = String(user.role || 'user');
    const supabaseUid = user.supabase_uid ? String(user.supabase_uid) : null;

    await p.query(
      `INSERT INTO users (uid, email, name, role, supabase_uid, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
       ON CONFLICT (uid) DO UPDATE
       SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role,
           supabase_uid = EXCLUDED.supabase_uid, data = EXCLUDED.data, updated_at = NOW();`,
      [uid, email, name, role, supabaseUid, JSON.stringify(user)]
    );
  } catch (err) {
    console.error('[Supabase PostgreSQL] Error syncing user:', err.message);
  }
}

// [DURABILITY] Hydrate the full user list from Supabase Postgres on boot.
async function loadUsersFromSupabasePostgres() {
  const p = getPool();
  if (!p) return [];
  try {
    const r = await p.query('SELECT uid, email, name, role, supabase_uid, data FROM users');
    return r.rows.map((row) => {
      const base = (row.data && typeof row.data === 'object') ? row.data : {};
      return {
        ...base,
        id: base.id || row.uid,
        email: base.email || row.email,
        name: base.name || row.name,
        role: base.role || row.role,
        supabase_uid: base.supabase_uid || row.supabase_uid || undefined,
      };
    });
  } catch (err) {
    console.error('[Supabase PostgreSQL] Error loading users:', err.message);
    return [];
  }
}








// ==========================================================
// [FASE 2] Generic JSONB compatibility document store
// ==========================================================
// Vendor and Trip were migrated to relational repositories in Mission 07.
// Their app_* tables remain preserved as legacy data for verification/rollback,
// but they are intentionally excluded from the runtime compatibility registry.
const APP_DOC_TABLES = {
  bookings: 'app_bookings',
  payments: 'app_payments',
  rentals: 'app_rentals',
  destinations: 'app_destinations',
  communities: 'app_communities',
  coupons: 'app_coupons',
  tenants: 'app_tenants',
  articles: 'app_articles',
  reviews: 'app_reviews',
  announcements: 'app_announcements',
  conversations: 'app_conversations',
  messages: 'app_messages',
  subscription_plans: 'app_subscription_plans',
  tenant_subscriptions: 'app_tenant_subscriptions',
  advertising_packages: 'app_advertising_packages',
  advertising_campaigns: 'app_advertising_campaigns',
  billing_transactions: 'app_billing_transactions',
  audit_logs: 'app_audit_logs',
  incidents: 'app_incidents',
  homepage_config: 'app_homepage_config',
  master_categories: 'app_master_categories',
  master_locations: 'app_master_locations',
  master_roles: 'app_master_roles',
};

function docKey(doc) {
  return doc && (doc.id || doc.booking_code || doc.tx_id || doc.order_id || doc.code || doc.slug || null);
}

async function loadAppDocs(collection) {
  const table = APP_DOC_TABLES[collection];
  const p = getPool();
  if (!p || !table) return [];
  try {
    const r = await p.query(`SELECT data FROM ${table}`);
    return r.rows.map((x) => x.data).filter((d) => d && typeof d === 'object');
  } catch (err) {
    console.error(`[Supabase PostgreSQL] Error loading ${collection}:`, err.message);
    return [];
  }
}

async function upsertAppDoc(collection, doc) {
  const table = APP_DOC_TABLES[collection];
  const p = getPool();
  if (!p || !table) return;
  const id = docKey(doc);
  if (!id) return;
  try {
    await p.query(
      `INSERT INTO ${table} (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
      [String(id), JSON.stringify(doc)]
    );
  } catch (err) {
    console.error(`[Supabase PostgreSQL] Error upserting ${collection}:`, err.message);
  }
}

async function deleteAppDoc(collection, id) {
  const table = APP_DOC_TABLES[collection];
  const p = getPool();
  if (!p || !table || !id) return;
  try {
    await p.query(`DELETE FROM ${table} WHERE id = $1`, [String(id)]);
  } catch (err) {
    console.error(`[Supabase PostgreSQL] Error deleting ${collection}:`, err.message);
  }
}

// Transitional bulk replacement for legacy compatibility collections only.
// New domain code must use upsertAppDoc/deleteAppDoc instead.
async function replaceAppCollection(collection, docs) {
  const table = APP_DOC_TABLES[collection];
  const p = getPool();
  if (!p || !table) return;
  const list = Array.isArray(docs) ? docs.filter((d) => docKey(d)) : [];
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const ids = [];
    for (const doc of list) {
      const id = String(docKey(doc));
      ids.push(id);
      await client.query(
        `INSERT INTO ${table} (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
        [id, JSON.stringify(doc)]
      );
    }
    if (ids.length) {
      await client.query(`DELETE FROM ${table} WHERE NOT (id = ANY($1::text[]))`, [ids]);
    } else {
      await client.query(`DELETE FROM ${table}`);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Supabase PostgreSQL] Error mirroring ${collection}:`, err.message);
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  checkDbConnection,
  initSupabasePostgresSchema,
  saveUserToSupabasePostgres,
  loadUsersFromSupabasePostgres,
  loadAppDocs,
  upsertAppDoc,
  deleteAppDoc,
  replaceAppCollection,
  APP_DOC_TABLES
};
