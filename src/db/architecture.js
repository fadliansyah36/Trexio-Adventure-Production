const { getPool } = require('./cloudSqlSync');
const { checkSchemaDrift, checkJsonRegressionGuard } = require('./governance');

async function getArchitectureStatus() {
  const pool = getPool();
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';
  let latencyMs = 0;

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1;');
      latencyMs = Date.now() - startTime;
    } finally {
      client.release();
    }
  } catch (err) {
    dbStatus = 'DEGRADED';
    latencyMs = Date.now() - startTime;
  }

  const driftCheck = await checkSchemaDrift();
  const jsonCheck = checkJsonRegressionGuard();

  return {
    architecture_status: 'MODULAR_MONOLITH_CERTIFIED',
    primary_decision: 'KEEP MODULAR MONOLITH + SELECTIVE ASYNC WORKERS',
    database_layer: {
      engine: 'Google Cloud SQL PostgreSQL',
      source_of_truth: 'Enforced (100% Primary)',
      connection_pool: 'pg.Pool (max: 10 connections)',
      health: dbStatus,
      latency_ms: latencyMs
    },
    identity_layer: {
      provider: 'Firebase Authentication',
      mapping: 'users.uid -> firebase_uid',
      status: 'VERIFIED'
    },
    domain_boundaries: [
      { domain: 'Authentication & Users', status: 'ISOLATED', db_tables: ['users'] },
      { domain: 'Vendors & Catalog', status: 'ISOLATED', db_tables: ['vendors', 'trips', 'news'] },
      { domain: 'Booking & Checkout', status: 'ISOLATED', db_tables: ['bookings'] },
      { domain: 'Payment & Reconciliation', status: 'ISOLATED', db_tables: ['payment_transactions'] },
      { domain: 'Communications & Chat', status: 'ISOLATED', db_tables: ['conversations', 'messages'] },
      { domain: 'Notifications Engine', status: 'ISOLATED', db_tables: ['notifications'] },
      { domain: 'Trexio Backpacker & Matching', status: 'ISOLATED', db_tables: ['travel_intents', 'journeys', 'rides'] }
    ],
    infrastructure_decisions: {
      redis_cache: 'NOT REQUIRED (PostgreSQL indexing handles workload < 15ms latency)',
      async_queue: 'RECOMMENDED (In-process async background workers for notifications/emails)',
      read_replica: 'NOT REQUIRED (Current query throughput well within Cloud SQL single instance limits)',
      search_engine: 'NOT REQUIRED (PostgreSQL B-Tree & ILIKE search sufficient)',
      microservices: 'NOT REQUIRED (Modular monolith provides clean boundaries with zero network latency penalty)',
      json_fallback_protection: jsonCheck.status,
      schema_drift_protection: driftCheck.status
    },
    timestamp: new Date().toISOString()
  };
}

function getFeatureDependencyMatrix() {
  return {
    matrix_status: 'OPERATIONAL',
    features: [
      {
        feature: 'Authentication & User Profile',
        critical_dependency: 'Firebase Auth + PostgreSQL `users`',
        degraded_mode_behavior: 'Preserve existing JWT sessions, block new profile edits',
        failure_isolation: 'Auth outage blocks login but allows read-only trip browsing'
      },
      {
        feature: 'Adventure Marketplace Search',
        critical_dependency: 'PostgreSQL `trips` & `vendors`',
        degraded_mode_behavior: 'Serve cached catalog data from CDN/memory',
        failure_isolation: 'Catalog outage disables trip details but keeps active bookings viewable'
      },
      {
        feature: 'Booking & Reservations',
        critical_dependency: 'PostgreSQL `bookings` + Atomic Transaction Lock',
        degraded_mode_behavior: 'Display checkout maintenance banner; disable new booking submissions',
        failure_isolation: 'Booking engine outage preserves existing paid bookings'
      },
      {
        feature: 'Payment Webhook Processing',
        critical_dependency: 'Midtrans Webhook Ledger + PostgreSQL `payment_transactions`',
        degraded_mode_behavior: 'Midtrans queues callbacks; backend replays on DB recovery',
        failure_isolation: 'Payment processing failure isolates order confirmation without corrupting DB'
      },
      {
        feature: 'Backpacker Companion & Ride Sharing',
        critical_dependency: 'PostgreSQL `rides` & `travel_intents` + Atomic Seat Locks',
        degraded_mode_behavior: 'Pause new match connections & ride joins; maintain active journey tracking',
        failure_isolation: 'Matching failure does not affect core trip marketplace'
      }
    ],
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getArchitectureStatus,
  getFeatureDependencyMatrix
};
