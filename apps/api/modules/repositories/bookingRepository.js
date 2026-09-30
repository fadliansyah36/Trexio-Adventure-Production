const { getPool } = require('../persistence/supabasePostgres');

const SELECT_COLUMNS = `
  id, external_id, tenant_id, booking_code, user_id, vendor_id, trip_id, total_amount,
  payment_status, booking_status, payment_method, payment_channel,
  midtrans_order_id, midtrans_token, ticket_token, checked_in, checkin_time,
  paid_at, data, created_at, updated_at
`;

function hydrate(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...data, tenant_id: row.tenant_id, id: row.external_id || String(row.id),
    booking_code: row.booking_code, user_id: data.user_id ?? row.user_id,
    vendor_id: data.vendor_id ?? row.vendor_id, trip_id: data.trip_id ?? row.trip_id,
    total_amount: row.total_amount !== null ? Number(row.total_amount) : Number(data.total_amount || 0),
    payment_status: row.payment_status || data.payment_status || 'pending',
    booking_status: row.booking_status || data.booking_status || 'pending_payment',
    payment_method: row.payment_method || data.payment_method,
    payment_channel: row.payment_channel || data.payment_channel,
    midtrans_order_id: row.midtrans_order_id || data.midtrans_order_id,
    midtrans_token: row.midtrans_token || data.midtrans_token,
    ticket_token: row.ticket_token || data.ticket_token,
    checked_in: row.checked_in ?? Boolean(data.checked_in),
    checkin_time: row.checkin_time || data.checkin_time, paid_at: row.paid_at || data.paid_at,
    created_at: row.created_at || data.created_at, updated_at: row.updated_at || data.updated_at,
  };
}

async function list(tenantId = null) {
  const p = getPool(); if (!p) return [];
  const r = await p.query(`SELECT ${SELECT_COLUMNS} FROM bookings ${tenantId ? 'WHERE tenant_id = $1' : ''} ORDER BY created_at ASC, id ASC`, tenantId ? [String(tenantId)] : []);
  return r.rows.map(hydrate);
}
async function findById(id, tenantId = null) {
  if (!id) return null; const p = getPool(); if (!p) return null;
  const r = await p.query(`SELECT ${SELECT_COLUMNS} FROM bookings WHERE (external_id = $1 OR booking_code = $1) ${tenantId ? 'AND tenant_id = $2' : ''} LIMIT 1`, tenantId ? [String(id), String(tenantId)] : [String(id)]);
  return r.rows[0] ? hydrate(r.rows[0]) : null;
}
async function findByCode(code, tenantId = null) { return findById(code, tenantId); }

async function save(booking) {
  if (!booking || !booking.id) throw new Error('Booking id is required');
  const p = getPool(); if (!p) throw new Error('Supabase PostgreSQL pool is unavailable');
  const data = { ...booking };
  const r = await p.query(`INSERT INTO bookings (
    external_id, booking_code, tenant_id, user_id, vendor_id, trip_id, total_amount,
    payment_status, booking_status, payment_method, payment_channel, midtrans_order_id,
    midtrans_token, ticket_token, checked_in, checkin_time, paid_at, data, created_at, updated_at
  ) VALUES (
    $1, $2, $3, CASE WHEN $4 ~ '^\\\\d+$' THEN $4::INT ELSE NULL END, $5,
    CASE WHEN $6 ~ '^\\\\d+$' THEN $6::INT ELSE NULL END, $7, $8, $9, $10, $11,
    $12, $13, $14, $15, $16, $17, $18::jsonb, COALESCE($19::timestamptz, NOW()), NOW()
  )
  ON CONFLICT (external_id) DO UPDATE SET
    tenant_id=EXCLUDED.tenant_id, booking_code=EXCLUDED.booking_code, user_id=EXCLUDED.user_id,
    vendor_id=EXCLUDED.vendor_id, trip_id=EXCLUDED.trip_id, total_amount=EXCLUDED.total_amount,
    payment_status=EXCLUDED.payment_status, booking_status=EXCLUDED.booking_status,
    payment_method=EXCLUDED.payment_method, payment_channel=EXCLUDED.payment_channel,
    midtrans_order_id=EXCLUDED.midtrans_order_id, midtrans_token=EXCLUDED.midtrans_token,
    ticket_token=EXCLUDED.ticket_token, checked_in=EXCLUDED.checked_in,
    checkin_time=EXCLUDED.checkin_time, paid_at=EXCLUDED.paid_at, data=EXCLUDED.data, updated_at=NOW()
  RETURNING ${SELECT_COLUMNS}`,
  [String(booking.id), String(booking.booking_code || booking.id), String(booking.tenant_id || 'tenant_default'),
   String(booking.user_id ?? ''), booking.vendor_id ? String(booking.vendor_id) : null,
   String(booking.trip_id ?? ''), Number.isFinite(Number(booking.total_amount)) ? Number(booking.total_amount) : 0,
   booking.payment_status || 'pending', booking.booking_status || 'pending_payment',
   booking.payment_method || null, booking.payment_channel || null, booking.midtrans_order_id || null,
   booking.midtrans_token || null, booking.ticket_token || null, Boolean(booking.checked_in),
   booking.checkin_time || null, booking.paid_at || null, JSON.stringify(data), booking.created_at || null]);
  return hydrate(r.rows[0]);
}
async function remove(id, tenantId = null) {
  if (!id) return false; const p = getPool(); if (!p) return false;
  const r = await p.query(`DELETE FROM bookings WHERE (external_id=$1 OR booking_code=$1) ${tenantId ? 'AND tenant_id=$2' : ''}`, tenantId ? [String(id), String(tenantId)] : [String(id)]);
  return r.rowCount > 0;
}
async function replaceAll(bookings, tenantId) {
  if (!tenantId) throw new Error('tenantId is required for booking replaceAll');
  const scopedTenantId = String(tenantId);
  const p=getPool(); if(!p) throw new Error('Supabase PostgreSQL pool is unavailable');
  const list=Array.isArray(bookings)?bookings.filter(b=>b&&b.id):[];
  for(const b of list) {
    if(String(b.tenant_id || scopedTenantId) !== scopedTenantId) {
      throw new Error('Cross-tenant booking replaceAll payload rejected');
    }
    await save({ ...b, tenant_id: scopedTenantId });
  }
  if(list.length) {
    await p.query(
      'DELETE FROM bookings WHERE tenant_id=$1 AND external_id IS NOT NULL AND NOT (external_id=ANY($2::text[]))',
      [scopedTenantId, list.map(b=>String(b.id))]
    );
  } else {
    await p.query('DELETE FROM bookings WHERE tenant_id=$1', [scopedTenantId]);
  }
}
module.exports = { list, findById, findByCode, save, remove, replaceAll };
