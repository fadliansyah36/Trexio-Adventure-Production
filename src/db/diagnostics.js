const { Pool } = require('pg');

let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    const host = process.env.SQL_HOST || 'localhost';
    const port = parseInt(process.env.SQL_PORT || '5432', 10);
    const database = process.env.SQL_DB_NAME || 'trexio_prod';
    const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres';
    const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '';

    poolInstance = new Pool({
      host,
      port,
      database,
      user,
      password,
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });

    poolInstance.on('error', (err) => {
      console.error('[Cloud SQL Pool Error]:', err.message);
    });
  }
  return poolInstance;
}

/**
 * Diagnostic function that tests Cloud SQL connectivity, latency,
 * read permissions, and write permissions using a safe session temporary table.
 */
async function runCloudSqlDiagnostics() {
  const startTime = Date.now();
  const env = process.env.NODE_ENV || 'staging';
  const host = process.env.SQL_HOST || 'localhost';
  const port = parseInt(process.env.SQL_PORT || '5432', 10);
  const dbName = process.env.SQL_DB_NAME || 'trexio_prod';
  const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres';

  const result = {
    status: 'error',
    timestamp: new Date().toISOString(),
    environment: env,
    database: {
      engine: 'PostgreSQL (Google Cloud SQL)',
      connected: false,
    },
    connectivity: {
      status: 'failed',
      latency_ms: 0,
    },
    read_permission: {
      status: 'failed',
      latency_ms: 0,
    },
    write_permission: {
      status: 'failed',
      latency_ms: 0,
    },
    summary: 'Cloud SQL diagnostic test initiated.',
  };

  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    result.status = 'unconfigured';
    result.summary = 'Cloud SQL environment variables not fully configured (SQL_HOST or DATABASE_URL missing).';
    result.connectivity.error = 'SQL_HOST environment variable is missing.';
    return result;
  }

  const pool = getPool();
  let client;

  try {
    // 1. Connectivity Test & Latency
    const connStart = Date.now();
    client = await pool.connect();
    const connLatency = Date.now() - connStart;

    result.connectivity = {
      status: 'connected',
      latency_ms: connLatency,
    };
    result.database.connected = true;

    // 2. Read Permission & Query Latency Test
    const readStart = Date.now();
    const readRes = await client.query('SELECT NOW() as server_time, VERSION() as pg_version, current_database() as db_name, current_user as db_user;');
    const readLatency = Date.now() - readStart;

    const serverTime = readRes.rows[0]?.server_time
      ? new Date(readRes.rows[0].server_time).toISOString()
      : new Date().toISOString();

    result.read_permission = {
      status: 'ok',
      latency_ms: readLatency,
      server_time: serverTime,
    };

    // 3. Write Permission & Transaction Latency Test (Safe Session Temporary Table)
    const writeStart = Date.now();
    await client.query('BEGIN;');
    await client.query(`
      CREATE TEMP TABLE IF NOT EXISTS _cloudsql_staging_health_check (
        id SERIAL PRIMARY KEY,
        test_key VARCHAR(64) NOT NULL,
        test_val VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const testKey = `diag_${Date.now()}`;
    const testVal = `verify_write_${Math.random().toString(36).substring(2, 10)}`;

    const insertRes = await client.query(
      `INSERT INTO _cloudsql_staging_health_check (test_key, test_val) VALUES ($1, $2) RETURNING id, test_key, test_val;`,
      [testKey, testVal]
    );

    const selectRes = await client.query(
      `SELECT * FROM _cloudsql_staging_health_check WHERE id = $1;`,
      [insertRes.rows[0]?.id]
    );

    await client.query(`DROP TABLE IF EXISTS _cloudsql_staging_health_check;`);
    await client.query('COMMIT;');
    const writeLatency = Date.now() - writeStart;

    if (selectRes.rows[0]?.test_val === testVal) {
      result.write_permission = {
        status: 'ok',
        latency_ms: writeLatency,
        test_operation: 'TEMP_TABLE_CREATE_INSERT_SELECT_DROP',
        verified_record_id: selectRes.rows[0]?.id,
      };
    } else {
      result.write_permission = {
        status: 'failed',
        latency_ms: writeLatency,
        error: 'Written test record did not match expected verification output.',
      };
    }

    // Determine Overall Status
    if (
      result.connectivity.status === 'connected' &&
      result.read_permission.status === 'ok' &&
      result.write_permission.status === 'ok'
    ) {
      result.status = 'healthy';
      result.summary = `Cloud SQL instance in ${env} environment is fully connected and ready. Read latency: ${readLatency}ms, Write latency: ${writeLatency}ms, Total execution time: ${Date.now() - startTime}ms.`;
    } else {
      result.status = 'degraded';
      result.summary = `Cloud SQL instance connected in ${env} environment with permission or latency warnings.`;
    }
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK;');
      } catch (_) {}
    }
    result.status = 'error';
    result.connectivity.error = err.message || String(err);
    result.summary = `Cloud SQL diagnostic check failed: ${err.message || String(err)}`;
  } finally {
    if (client) {
      client.release();
    }
  }

  return result;
}

module.exports = {
  runCloudSqlDiagnostics,
  getPool,
};
