const { getPool } = require('../persistence/supabasePostgres');

const SELECT_COLUMNS = `
  id,
  external_id,
  title,
  destination,
  price,
  duration_days,
  available_seats,
  category,
  vendor_id,
  slug,
  status,
  cover_image,
  description,
  data,
  created_at,
  updated_at
`;

function hydrate(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  const publicId = row.external_id || String(row.id);
  return {
    ...data,
    id: publicId,
    title: row.title,
    destination: row.destination,
    price: row.price !== null ? Number(row.price) : 0,
    duration_days: row.duration_days || 1,
    available_seats: row.available_seats ?? 10,
    category: row.category || data.category,
    vendor_id: row.vendor_id || data.vendor_id,
    slug: row.slug || data.slug,
    status: row.status || data.status || 'published',
    published: data.published !== undefined ? data.published : row.status !== 'draft',
    cover_image: row.cover_image || data.cover_image || '',
    description: row.description || data.description || '',
    created_at: row.created_at || data.created_at,
    updated_at: row.updated_at || data.updated_at,
  };
}

async function list() {
  const p = getPool();
  if (!p) return [];
  const result = await p.query(`SELECT ${SELECT_COLUMNS} FROM trips ORDER BY created_at ASC, id ASC`);
  return result.rows.map(hydrate);
}

async function findById(id) {
  if (!id) return null;
  const p = getPool();
  if (!p) return null;
  const value = String(id);
  const result = await p.query(
    `SELECT ${SELECT_COLUMNS}
     FROM trips
     WHERE external_id = $1 OR (external_id IS NULL AND id::text = $1)
     LIMIT 1`,
    [value]
  );
  return result.rows[0] ? hydrate(result.rows[0]) : null;
}

async function save(trip) {
  if (!trip || !trip.id) throw new Error('Trip id is required');
  const p = getPool();
  if (!p) throw new Error('Supabase PostgreSQL pool is unavailable');

  const data = { ...trip };
  const result = await p.query(
    `INSERT INTO trips (
       external_id, title, destination, price, duration_days, available_seats,
       category, vendor_id, slug, status, cover_image, description, data, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, NOW())
     ON CONFLICT (external_id) DO UPDATE SET
       title = EXCLUDED.title,
       destination = EXCLUDED.destination,
       price = EXCLUDED.price,
       duration_days = EXCLUDED.duration_days,
       available_seats = EXCLUDED.available_seats,
       category = EXCLUDED.category,
       vendor_id = EXCLUDED.vendor_id,
       slug = EXCLUDED.slug,
       status = EXCLUDED.status,
       cover_image = EXCLUDED.cover_image,
       description = EXCLUDED.description,
       data = EXCLUDED.data,
       updated_at = NOW()
     RETURNING ${SELECT_COLUMNS}`,
    [
      String(trip.id),
      String(trip.title || 'Trip TREXIO'),
      String(trip.destination || trip.location || 'Indonesia'),
      Number.isFinite(Number(trip.price)) ? Number(trip.price) : 0,
      Number.isFinite(Number(trip.duration_days))
        ? Number(trip.duration_days)
        : (String(trip.duration || '').match(/^\d+/)?.[0] || 1),
      Number.isFinite(Number(trip.available_seats))
        ? Number(trip.available_seats)
        : 10,
      trip.category || null,
      trip.vendor_id ? String(trip.vendor_id) : null,
      trip.slug || null,
      trip.published === false ? 'draft' : (trip.status || 'published'),
      trip.cover_image || null,
      trip.description || null,
      JSON.stringify(data),
    ]
  );
  return hydrate(result.rows[0]);
}

async function remove(id) {
  if (!id) return false;
  const p = getPool();
  if (!p) return false;
  const result = await p.query('DELETE FROM trips WHERE external_id = $1', [String(id)]);
  return result.rowCount > 0;
}

module.exports = { list, findById, save, remove };
