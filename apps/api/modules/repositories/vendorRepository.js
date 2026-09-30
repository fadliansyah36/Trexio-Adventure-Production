const { getPool } = require('../persistence/supabasePostgres');

const SELECT_COLUMNS = `
  id,
  tenant_id,
  user_id,
  brand_name,
  slug,
  status,
  rating,
  total_trips,
  documents,
  data,
  created_at,
  updated_at
`;

function hydrate(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...data,
    id: row.id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    brand_name: row.brand_name,
    slug: row.slug,
    status: row.status,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    total_trips: row.total_trips || 0,
    documents: row.documents || data.documents || {},
    created_at: row.created_at || data.created_at,
    updated_at: row.updated_at || data.updated_at,
  };
}

async function list(tenantId = null) {
  const p = getPool();
  if (!p) return [];
  const result = await p.query(`SELECT ${SELECT_COLUMNS} FROM vendors ${tenantId ? 'WHERE tenant_id = $1' : ''} ORDER BY created_at ASC, id ASC`);
  return result.rows.map(hydrate);
}

async function findById(id, tenantId = null) {
  if (!id) return null;
  const p = getPool();
  if (!p) return null;
  const result = await p.query(
    `SELECT ${SELECT_COLUMNS} FROM vendors WHERE id = $1 ${tenantId ? 'AND tenant_id = $2' : ''} LIMIT 1`,
    tenantId ? [String(id), String(tenantId)] : [String(id)]
  );
  return result.rows[0] ? hydrate(result.rows[0]) : null;
}

async function findByUserId(userId, tenantId = null) {
  if (!userId) return null;
  const p = getPool();
  if (!p) return null;
  const result = await p.query(
    `SELECT ${SELECT_COLUMNS} FROM vendors WHERE user_id = $1 ${tenantId ? 'AND tenant_id = $2' : ''} LIMIT 1`,
    tenantId ? [String(userId), String(tenantId)] : [String(userId)]
  );
  return result.rows[0] ? hydrate(result.rows[0]) : null;
}

async function save(vendor) {
  if (!vendor || !vendor.id) throw new Error('Vendor id is required');
  const p = getPool();
  if (!p) throw new Error('Supabase PostgreSQL pool is unavailable');

  const data = { ...vendor };
  const result = await p.query(
    `INSERT INTO vendors (
       id, tenant_id, user_id, brand_name, slug, status, rating, total_trips, documents, data, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       tenant_id = EXCLUDED.tenant_id,
       user_id = EXCLUDED.user_id,
       brand_name = EXCLUDED.brand_name,
       slug = EXCLUDED.slug,
       status = EXCLUDED.status,
       rating = EXCLUDED.rating,
       total_trips = EXCLUDED.total_trips,
       documents = EXCLUDED.documents,
       data = EXCLUDED.data,
       updated_at = NOW()
     RETURNING ${SELECT_COLUMNS}`,
    [
      String(vendor.id),
      String(vendor.tenant_id || 'tenant_default'),
      vendor.user_id ? String(vendor.user_id) : null,
      String(vendor.brand_name || 'Mitra TREXIO'),
      vendor.slug || null,
      vendor.status || 'active',
      Number.isFinite(Number(vendor.rating)) ? Number(vendor.rating) : 5,
      Number.isFinite(Number(vendor.total_trips)) ? Number(vendor.total_trips) : 0,
      JSON.stringify(vendor.documents || {}),
      JSON.stringify(data),
    ]
  );
  return hydrate(result.rows[0]);
}

async function remove(id, tenantId = null) {
  if (!id) return false;
  const p = getPool();
  if (!p) return false;
  const result = await p.query(`DELETE FROM vendors WHERE id = $1 ${tenantId ? 'AND tenant_id = $2' : ''}`, tenantId ? [String(id), String(tenantId)] : [String(id)]);
  return result.rowCount > 0;
}

module.exports = { list, findById, findByUserId, save, remove };
