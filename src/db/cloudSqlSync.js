const { Pool } = require('pg');

let pool = null;

function getResolvedDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.includes('<project-ref>') && !envUrl.includes('<db-password>') && !envUrl.includes('<region>')) {
    return envUrl;
  }
  return 'postgresql://postgres:BgUnkVDxmD83yA2B@db.fndxxiqojmhiepidrxio.supabase.co:5432/postgres';
}

function getPool() {
  if (!pool) {
    const rawDbUrl = getResolvedDatabaseUrl();
    const hasUrl = !!rawDbUrl;
    const hasDiscrete = !!process.env.SQL_HOST;
    if (!hasUrl && !hasDiscrete) {
      console.error('[CloudSQL] FATAL: No DATABASE_URL or SQL_HOST configured.');
      return null;
    }
    // Supabase requires SSL. Enable when using a connection string or when SQL_SSL=true.
    const useSSL = hasUrl || process.env.SQL_SSL === 'true' || process.env.PGSSLMODE === 'require';
    const sslOption = useSSL ? { rejectUnauthorized: false } : false;

    pool = new Pool(
      hasUrl
        ? {
            connectionString: rawDbUrl,
            ssl: sslOption,
            max: parseInt(process.env.SQL_POOL_MAX || '10'),
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          }
        : {
            host: process.env.SQL_HOST,
            port: parseInt(process.env.SQL_PORT || '5432'),
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DB_NAME,
            ssl: sslOption,
            max: parseInt(process.env.SQL_POOL_MAX || '10'),
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          }
    );

    pool.on('error', (err) => {
      console.error('[CloudSQL] Pool client error:', err.message);
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

async function initCloudSqlSchema() {
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
    console.log('[CloudSQL Sync] Schema verified and initialized in Cloud SQL / Supabase PostgreSQL.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CloudSQL Sync] Failed to initialize schema:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function syncUserToCloudSql(user) {
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
    console.error('[CloudSQL Sync] Error syncing user:', err.message);
  }
}

// [DURABILITY] Hydrate the full user list from Supabase Postgres on boot.
async function loadUsersFromCloudSql() {
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
    console.error('[CloudSQL Sync] Error loading users:', err.message);
    return [];
  }
}

async function syncVendorToCloudSql(vendor) {
  if (!vendor || !vendor.id) return;
  const p = getPool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO vendors (id, user_id, brand_name, slug, status, rating, total_trips, documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
       SET brand_name = EXCLUDED.brand_name, status = EXCLUDED.status, rating = EXCLUDED.rating, documents = EXCLUDED.documents;`,
      [
        String(vendor.id),
        String(vendor.user_id || vendor.owner_id || ''),
        String(vendor.brand_name || vendor.name || 'Mitra TREXIO'),
        String(vendor.slug || ''),
        String(vendor.status || 'active'),
        parseFloat(vendor.rating || 5.0),
        parseInt(vendor.total_trips || 0),
        JSON.stringify(vendor.documents || {})
      ]
    );
  } catch (err) {
    console.error('[CloudSQL Sync] Error syncing vendor:', err.message);
  }
}

async function syncTripToCloudSql(trip) {
  if (!trip || !trip.title) return;
  const p = getPool();
  if (!p) return;
  try {
    const priceNum = parseFloat(trip.price || trip.price_per_person || 0);
    await p.query(
      `INSERT INTO trips (title, destination, price, duration_days, available_seats, category, vendor_id, slug, status, cover_image, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
      [
        String(trip.title),
        String(trip.destination || trip.location || 'Indonesia'),
        priceNum,
        parseInt(trip.duration_days || trip.duration || 1),
        parseInt(trip.available_seats || trip.quota || 10),
        String(trip.category || 'Open Trip'),
        String(trip.vendor_id || ''),
        String(trip.slug || ''),
        String(trip.status || 'published'),
        String(trip.cover_image || trip.image || ''),
        String(trip.description || '')
      ]
    );
  } catch (err) {
    console.error('[CloudSQL Sync] Error syncing trip:', err.message);
  }
}

async function syncBookingToCloudSql(booking) {
  if (!booking || !booking.booking_code) return;
  const p = getPool();
  if (!p) return;
  try {
    const totalAmount = parseFloat(booking.total_price || booking.total_amount || booking.amount || 0);
    const userIdNum = parseInt(booking.user_id) || null;
    const tripIdNum = parseInt(booking.trip_id || booking.product_id) || null;

    await p.query(
      `INSERT INTO bookings (booking_code, user_id, vendor_id, trip_id, total_amount, payment_status, booking_status, payment_method, payment_channel, midtrans_order_id, midtrans_token, paid_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (booking_code) DO UPDATE
       SET payment_status = EXCLUDED.payment_status,
           booking_status = EXCLUDED.booking_status,
           payment_method = EXCLUDED.payment_method,
           payment_channel = EXCLUDED.payment_channel,
           midtrans_order_id = EXCLUDED.midtrans_order_id,
           midtrans_token = EXCLUDED.midtrans_token,
           paid_at = EXCLUDED.paid_at,
           updated_at = NOW();`,
      [
        String(booking.booking_code),
        userIdNum,
        String(booking.vendor_id || ''),
        tripIdNum,
        totalAmount,
        String(booking.payment_status || 'pending').toLowerCase(),
        String(booking.booking_status || 'pending_payment').toLowerCase(),
        String(booking.payment_method || ''),
        String(booking.payment_channel || ''),
        String(booking.midtrans_order_id || booking.order_id || ''),
        String(booking.midtrans_token || ''),
        booking.paid_at ? new Date(booking.paid_at) : null
      ]
    );
  } catch (err) {
    console.error('[CloudSQL Sync] Error syncing booking:', err.message);
  }
}

async function syncPaymentToCloudSql(payment) {
  if (!payment || !payment.tx_id) return;
  const p = getPool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO payment_transactions (tx_id, booking_code, order_id, amount, status, payment_type, transaction_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (tx_id) DO UPDATE
       SET status = EXCLUDED.status, updated_at = NOW();`,
      [
        String(payment.tx_id),
        String(payment.booking_code || ''),
        String(payment.order_id || ''),
        parseFloat(payment.amount || 0),
        String(payment.status || 'pending'),
        String(payment.payment_type || ''),
        String(payment.transaction_id || '')
      ]
    );
  } catch (err) {
    console.error('[CloudSQL Sync] Error syncing payment:', err.message);
  }
}

async function syncConversationToCloudSql(conv) {
  if (!conv || !conv.id) return;
  const p = getPool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO conversations (id, user_id, user_name, vendor_id, vendor_name, product_id, product_title, booking_id, booking_code, last_message, status, unread_user_count, unread_vendor_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       ON CONFLICT (id) DO UPDATE
       SET last_message = EXCLUDED.last_message,
           status = EXCLUDED.status,
           unread_user_count = EXCLUDED.unread_user_count,
           unread_vendor_count = EXCLUDED.unread_vendor_count,
           updated_at = NOW();`,
      [
        String(conv.id),
        String(conv.user_id || ''),
        String(conv.user_name || ''),
        String(conv.vendor_id || ''),
        String(conv.vendor_name || ''),
        String(conv.product_id || ''),
        String(conv.product_title || ''),
        String(conv.booking_id || ''),
        String(conv.booking_code || ''),
        String(conv.last_message || ''),
        String(conv.status || 'active'),
        parseInt(conv.unread_user_count || 0),
        parseInt(conv.unread_vendor_count || 0)
      ]
    );
  } catch (err) {
    console.error('[CloudSQL Sync] Error syncing conversation:', err.message);
  }
}

async function syncMessageToCloudSql(msg) {
  if (!msg || !msg.id) return;
  const p = getPool();
  if (!p) return;
  try {
    if (msg.conversation_id) {
      await p.query(
        `INSERT INTO conversations (id, user_id, vendor_id, last_message)
         VALUES ($1, 'unknown', 'unknown', '')
         ON CONFLICT (id) DO NOTHING;`,
        [String(msg.conversation_id)]
      );
    }

    await p.query(
      `INSERT INTO messages (id, conversation_id, sender_id, sender_role, sender_name, text, read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
       SET read = EXCLUDED.read;`,
      [
        String(msg.id),
        String(msg.conversation_id),
        String(msg.sender_id),
        String(msg.sender_role || 'user'),
        String(msg.sender_name || ''),
        String(msg.text || ''),
        Boolean(msg.read)
      ]
    );
  } catch (err) {
    console.error('[CloudSQL Sync] Error syncing message:', err.message);
  }
}

async function syncNotificationToCloudSql(notif) {
  if (!notif || !notif.id) return;
  const p = getPool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, type, read, link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
       SET read = EXCLUDED.read;`,
      [
        String(notif.id),
        String(notif.recipient_id || notif.user_id || ''),
        String(notif.recipient_role || 'user'),
        String(notif.title || ''),
        String(notif.message || notif.text || ''),
        String(notif.type || 'info'),
        Boolean(notif.read),
        String(notif.link || '')
      ]
    );
  } catch (err) {
    console.error('[CloudSQL Sync] Error syncing notification:', err.message);
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
    console.error(`[CloudSQL Sync] Error loading ${collection}:`, err.message);
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
    console.error(`[CloudSQL Sync] Error upserting ${collection}:`, err.message);
  }
}

async function deleteAppDoc(collection, id) {
  const table = APP_DOC_TABLES[collection];
  const p = getPool();
  if (!p || !table || !id) return;
  try {
    await p.query(`DELETE FROM ${table} WHERE id = $1`, [String(id)]);
  } catch (err) {
    console.error(`[CloudSQL Sync] Error deleting ${collection}:`, err.message);
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
    console.error(`[CloudSQL Sync] Error mirroring ${collection}:`, err.message);
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  checkDbConnection,
  initCloudSqlSchema,
  syncUserToCloudSql,
  loadUsersFromCloudSql,
  loadAppDocs,
  upsertAppDoc,
  deleteAppDoc,
  replaceAppCollection,
  syncVendorToCloudSql,
  syncTripToCloudSql,
  syncBookingToCloudSql,
  syncPaymentToCloudSql,
  syncConversationToCloudSql,
  syncMessageToCloudSql,
  syncNotificationToCloudSql,
  APP_DOC_TABLES
};
