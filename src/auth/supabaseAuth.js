// ==========================================================
// Supabase Auth (GoTrue) integration for the Express backend.
// Uses the Supabase Auth REST API directly (native fetch) so we don't add
// heavy SDK dependencies. Supabase Auth is the authoritative credential store
// for email/password; the app keeps its own JWT + roles table for RBAC.
// ==========================================================
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  ''
).replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';

const supabaseAuthEnabled = Boolean(SUPABASE_URL && SERVICE_KEY && ANON_KEY);

if (!supabaseAuthEnabled) {
  console.warn('[SupabaseAuth] Not configured (SUPABASE_URL / SERVICE_ROLE / ANON). Falling back to local password verification.');
}

async function adminHeaders() {
  return { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
}

// Create a user in Supabase Auth (email auto-confirmed for API-driven flows).
async function adminCreateUser(email, password, userMetadata = {}) {
  if (!supabaseAuthEnabled) return { ok: false, disabled: true };
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: await adminHeaders(),
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: userMetadata }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, status: r.status, error: data };
    return { ok: true, user: data };
  } catch (e) {
    return { ok: false, error: { message: e.message } };
  }
}

// Verify email/password against Supabase Auth. Returns { ok, user } on success.
async function verifyPassword(email, password) {
  if (!supabaseAuthEnabled) return { ok: false, disabled: true };
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.access_token) return { ok: true, user: data.user, session: data };
    return { ok: false, status: r.status, error: data };
  } catch (e) {
    return { ok: false, error: { message: e.message } };
  }
}

// Find a Supabase Auth user by email (scans admin list; fine for our scale).
async function findUserByEmail(email) {
  if (!supabaseAuthEnabled) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: await adminHeaders() });
    const d = await r.json().catch(() => ({}));
    const list = Array.isArray(d.users) ? d.users : [];
    return list.find((u) => (u.email || '').toLowerCase() === String(email).toLowerCase()) || null;
  } catch (e) {
    return null;
  }
}

// Update a Supabase Auth user's password by id.
async function adminUpdatePassword(userId, password) {
  if (!supabaseAuthEnabled || !userId) return { ok: false, disabled: true };
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: await adminHeaders(),
      body: JSON.stringify({ password }),
    });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, user: data } : { ok: false, status: r.status, error: data };
  } catch (e) {
    return { ok: false, error: { message: e.message } };
  }
}

// Ensure a user exists in Supabase Auth (create if missing, else update password).
async function ensureUser(email, password, userMetadata = {}) {
  if (!supabaseAuthEnabled) return { ok: false, disabled: true };
  const existing = await findUserByEmail(email);
  if (existing) {
    await adminUpdatePassword(existing.id, password);
    return { ok: true, user: existing, existed: true };
  }
  return adminCreateUser(email, password, userMetadata);
}

module.exports = {
  supabaseAuthEnabled,
  adminCreateUser,
  verifyPassword,
  findUserByEmail,
  adminUpdatePassword,
  ensureUser,
};
