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

    const useSSL = true;
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
  const client = await p.connect();
  try {
    await client.query('BEGIN');

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // [DURABILITY] Persist the full user record so Supabase Postgres is the
    // durable source of truth (in-memory model is hydrated from here on boot).
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_uid TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);

    // Vendors
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        brand_name TEXT NOT NULL,
        slug TEXT,
        status VARCHAR(50) DEFAULT 'active',
        rating NUMERIC DEFAULT 5.0,
        total_trips INT DEFAULT 0,
        documents JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Trips / Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        destination TEXT NOT NULL,
        price NUMERIC NOT NULL,
        duration_days INT DEFAULT 1,
        available_seats INT DEFAULT 10,
        category TEXT,
        vendor_id VARCHAR(100),
        slug TEXT,
        status VARCHAR(50) DEFAULT 'published',
        cover_image TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_code TEXT UNIQUE NOT NULL,
        user_id INT,
        vendor_id VARCHAR(100),
        trip_id INT,
        total_amount NUMERIC NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        booking_status TEXT DEFAULT 'pending_payment',
        payment_method TEXT,
        payment_channel TEXT,
        midtrans_order_id TEXT,
        midtrans_token TEXT,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Payment Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        tx_id TEXT UNIQUE NOT NULL,
        booking_code TEXT NOT NULL,
        order_id TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_type TEXT,
        transaction_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Conversations
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        user_name TEXT,
        vendor_id VARCHAR(100) NOT NULL,
        vendor_name TEXT,
        product_id TEXT,
        product_title TEXT,
        booking_id TEXT,
        booking_code TEXT,
        last_message TEXT,
        status VARCHAR(50) DEFAULT 'active',
        unread_user_count INT DEFAULT 0,
        unread_vendor_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(100) PRIMARY KEY,
        conversation_id VARCHAR(100) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(100) NOT NULL,
        sender_role VARCHAR(50) DEFAULT 'user',
        sender_name TEXT,
        text TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        recipient_id VARCHAR(100) NOT NULL,
        recipient_role VARCHAR(50) DEFAULT 'user',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        link TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // News
    await client.query(`
      CREATE TABLE IF NOT EXISTS news (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'Admin TREXIO',
        category VARCHAR(50) DEFAULT 'Umum',
        published BOOLEAN DEFAULT TRUE,
        published_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Travel Intents
    await client.query(`
      CREATE TABLE IF NOT EXISTS travel_intents (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        destination TEXT NOT NULL,
        travel_date DATE,
        budget NUMERIC,
        activities TEXT[],
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Journeys
    await client.query(`
      CREATE TABLE IF NOT EXISTS journeys (
        id VARCHAR(100) PRIMARY KEY,
        creator_id VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        destination TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Rides
    await client.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id VARCHAR(100) PRIMARY KEY,
        creator_id VARCHAR(100) NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        departure_time TIMESTAMP,
        total_seats INT DEFAULT 4,
        available_seats INT DEFAULT 4,
        price_per_seat NUMERIC DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // [FASE 2 — SOURCE OF TRUTH] Document tables that store the FULL application
    // object as JSONB keyed by the app's string id. Postgres is kept as an exact
    // mirror of the in-memory model (hydrated on boot), making it the durable
    // source of truth for all core entities.
    for (const t of Object.values(APP_DOC_TABLES)) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${t} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    }

    await client.query('COMMIT');
    console.log('[Supabase PostgreSQL] Schema verified and initialized in Supabase PostgreSQL.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Supabase PostgreSQL] Failed to initialize schema:', err.message);
    throw err;
  } finally {
    client.release();
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
// [FASE 2] Generic JSONB document store (source of truth mirror)
// ==========================================================
const APP_DOC_TABLES = {
  trips: 'app_trips',
  vendors: 'app_vendors',
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

// Make Postgres an EXACT mirror of the in-memory array: upsert all current docs
// and delete rows that no longer exist in memory (handles create/update/delete).
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
