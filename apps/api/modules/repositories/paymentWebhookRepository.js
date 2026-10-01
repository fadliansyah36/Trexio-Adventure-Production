'use strict';

const { getPool } = require('../persistence/supabasePostgres');

const STALE_PROCESSING_MS = 15 * 60 * 1000;

async function claim(event) {
  if (!event?.event_key || !event?.order_id) {
    throw new Error('Webhook event_key and order_id are required');
  }

  const pool = getPool();
  if (!pool) throw new Error('Supabase PostgreSQL pool is unavailable');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = await client.query(
      `INSERT INTO payment_webhook_events (
         event_key, order_id, transaction_id, transaction_status,
         status, attempt_count, payload, received_at, updated_at
       )
       VALUES ($1, $2, $3, $4, 'processing', 1, $5::jsonb, NOW(), NOW())
       ON CONFLICT (event_key) DO NOTHING
       RETURNING event_key`,
      [
        String(event.event_key),
        String(event.order_id),
        event.transaction_id ? String(event.transaction_id) : null,
        event.transaction_status ? String(event.transaction_status) : null,
        JSON.stringify(event.payload || {}),
      ]
    );

    if (inserted.rowCount > 0) {
      await client.query('COMMIT');
      return { claimed: true, duplicate: false, reclaimed: false };
    }

    const current = await client.query(
      `SELECT status, updated_at
       FROM payment_webhook_events
       WHERE event_key = $1
       FOR UPDATE`,
      [String(event.event_key)]
    );

    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      throw new Error('Webhook event disappeared during idempotency claim');
    }

    const row = current.rows[0];
    if (row.status === 'processed') {
      await client.query('COMMIT');
      return { claimed: false, duplicate: true, reclaimed: false };
    }

    const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const stale = !updatedAt || (Date.now() - updatedAt) >= STALE_PROCESSING_MS;

    if (!stale) {
      await client.query('COMMIT');
      return { claimed: false, duplicate: true, reclaimed: false };
    }

    await client.query(
      `UPDATE payment_webhook_events
       SET status = 'processing',
           attempt_count = attempt_count + 1,
           updated_at = NOW(),
           last_error = NULL
       WHERE event_key = $1`,
      [String(event.event_key)]
    );

    await client.query('COMMIT');
    return { claimed: true, duplicate: false, reclaimed: true };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

async function markProcessed(eventKey) {
  const pool = getPool();
  if (!pool) throw new Error('Supabase PostgreSQL pool is unavailable');
  await pool.query(
    `UPDATE payment_webhook_events
     SET status = 'processed', processed_at = NOW(), updated_at = NOW(), last_error = NULL
     WHERE event_key = $1`,
    [String(eventKey)]
  );
}

async function markFailed(eventKey, errorMessage) {
  const pool = getPool();
  if (!pool) throw new Error('Supabase PostgreSQL pool is unavailable');
  await pool.query(
    `UPDATE payment_webhook_events
     SET status = 'failed', updated_at = NOW(), last_error = $2
     WHERE event_key = $1`,
    [String(eventKey), String(errorMessage || 'Webhook processing failed').slice(0, 2000)]
  );
}

module.exports = {
  claim,
  markProcessed,
  markFailed,
};
