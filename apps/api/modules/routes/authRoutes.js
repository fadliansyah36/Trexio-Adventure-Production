/**
 * Trexio API route module: Auth.
 *
 * Extracted from apps/api/server.js during Mission 09C Phase 5B.
 * Dependencies are injected explicitly to keep the extraction dependency-safe.
 */
module.exports = function registerAuthRoutes(ctx) {
  const {
    api, users, bcrypt, jwt, JWT_SECRET, supabaseAuth, authLimiter,
    signAuthToken, getCurrentUser, requireAuth, requireRoles, requireSuperAdmin,
    requireAdmin, requireVendor, getUserRoles, hasAnyRole,
    getVerificationStatusForUser, saveUserToSupabasePostgres,
    loadUsersFromSupabasePostgres, recordAuditLog, recordSecurityIncident,
    logActivity, nowISO, uuidv4, speakeasy, QRCode,
    syncAllUsersToPostgres, saveUsersToDisk, tenants, vendors,
    conversations, messages, auditLogs, systemHealth, persistCollection,
    frontendUrl, sendVerificationEmail, createNotification,
    getClientIp, getRequestId
  } = ctx;

api.post('/auth/register', authLimiter, async (req, res) => {
  const { name, email, phone, password, confirmPassword, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email dan kata sandi wajib diisi.' });
  }

  const lowerEmail = String(email).toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lowerEmail)) {
    return res.status(400).json({ detail: 'Format email tidak valid.' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ detail: 'Kata sandi minimal 8 karakter.' });
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    return res.status(400).json({ detail: 'Konfirmasi kata sandi tidak cocok dengan kata sandi.' });
  }

  if (users.find(u => u.email.toLowerCase() === lowerEmail)) {
    return res.status(400).json({ detail: 'Email sudah terdaftar. Silakan login atau gunakan email lain.' });
  }

  const newUser = {
    id: `user_${uuidv4().substring(0, 8)}`,
    name: name || 'User Baru',
    email: lowerEmail,
    phone: phone || '',
    password_hash: bcrypt.hashSync(password, 10),
    tenant_id: 'tenant_default',
    activity_logs: [],
    transaction_history: [],
    scan_records: [],
    created_at: nowISO(),
  };

  assignRoleToUser(newUser, role);

  if (newUser.role === 'vendor') {
    newUser.name = name || 'Mitra Vendor';
  }

  // [Supabase Auth] Register credentials in Supabase Auth (authoritative store).
  if (supabaseAuth.supabaseAuthEnabled) {
    const created = await supabaseAuth.adminCreateUser(lowerEmail, password, { name: newUser.name, role: newUser.role });
    if (created.ok && created.user) {
      newUser.supabase_uid = created.user.id;
    } else if (created.error && (created.status === 422 || created.status === 409 || /(already|exists|registered)/i.test(JSON.stringify(created.error)))) {
      return res.status(400).json({ detail: 'Email sudah terdaftar. Silakan login atau gunakan email lain.' });
    }
    // If Supabase is temporarily unreachable, still create the local account
    // (bcrypt) so registration is not blocked; it will sync on next login.
  }

  users.push(newUser);

  if (newUser.role === 'vendor') {
    let brandName = name || 'Mitra Vendor TREXIO';
    let baseSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `vendor-${Date.now().toString().slice(-4)}`;
    let slug = baseSlug;
    let counter = 1;
    while (vendors.some(v => v.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    vendors.push({
      id: `vendor_${uuidv4().substring(0, 8)}`,
      user_id: newUser.id,
      tenant_id: 'tenant_default',
      slug,
      types: ['organizer'],
      brand_name: brandName,
      tagline: 'Mitra Resmi Penyelenggara Tour & Open Trip TREXIO',
      description: 'Penyelenggara paket perjalanan outdoor terverifikasi.',
      logo: '',
      cover_image: '',
      contact: { email: lowerEmail, phone: phone || '', whatsapp: phone || '' },
      legal: { nik: '', city: '', province: '' },
      documents: { ktp_url: '', izin_usaha_url: '' },
      payout: { bank_name: '', account_number: '', account_holder: '' },
      status: 'verified',
      verified_at: nowISO(),
      verified_by: 'system_auto',
      created_at: nowISO(),
      updated_at: nowISO(),
    });
    persistVendorRecord(vendors[vendors.length - 1]);
  }

  saveUsersToDisk();

  const token = signAuthToken(newUser);
  res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  const cleaned = cleanUser(newUser);
  res.json({ ...cleaned, user: cleaned, access_token: token, token });
});

api.post('/auth/login', authLimiter, async (req, res) => {
  const { email, password, totp_code } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email dan password wajib diisi' });
  }
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // User lookup by email or internal ID from memory with Supabase Postgres fallback
  let user = users.find(u =>
    (u.email && u.email.toLowerCase() === cleanEmail) ||
    u.id === cleanEmail
  );

  if (!user && typeof loadUsersFromSupabasePostgres === 'function') {
    try {
      const dbUsers = await loadUsersFromSupabasePostgres();
      user = dbUsers.find(u =>
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        u.id === cleanEmail
      );
      if (user) {
        const existingIdx = users.findIndex(x => x.id === user.id || (x.email && x.email.toLowerCase() === cleanEmail));
        if (existingIdx !== -1) users[existingIdx] = user;
        else users.push(user);
      }
    } catch (e) {}
  }

  if (!user) {
    recordAuditLog(cleanEmail, 'User Login Failed', `Attempted Email/ID: ${cleanEmail}`, '-', 'AUTH_FAILED', req, { status: 'FAILED' });
    return res.status(401).json({ detail: 'Email atau password salah. Silakan periksa kembali akun Anda.' });
  }

  if (user.status === 'deleted') {
    return res.status(403).json({ detail: 'Akun ini telah dihapus secara permanen. Silakan mendaftar akun baru jika ingin menggunakan TREXIO.' });
  }

  if (user.status === 'deactivated') {
    user.status = 'active';
    saveUsersToDisk();
  }

  // [Supabase Auth] Verify credentials against Supabase Auth when the account
  // is Supabase-managed; otherwise fall back to the local bcrypt hash (covers
  // the env-seeded admin before its first Supabase sync and any legacy record).
  let isValid = false;
  if (supabaseAuth.supabaseAuthEnabled && user.supabase_uid) {
    const v = await supabaseAuth.verifyPassword(user.email, cleanPassword);
    isValid = !!v.ok;
    if (!isValid) {
      console.warn('[Auth Login] Supabase Auth verify failed for', user.email, 'status:', v.status, 'error:', JSON.stringify(v.error));
    }
  }
  if (!isValid && user.password_hash) {
    try {
      isValid = bcrypt.compareSync(cleanPassword, user.password_hash);
      if (isValid && supabaseAuth.supabaseAuthEnabled) {
        supabaseAuth.ensureUser(user.email, cleanPassword, {
          name: user.name,
          role: user.role,
        }).catch(() => {});
      }
    } catch (e) {
      isValid = false;
    }
  }

  // If memory had a stale hash, refresh from Supabase Postgres and retry bcrypt comparison
  if (!isValid && typeof loadUsersFromSupabasePostgres === 'function') {
    try {
      const dbUsers = await loadUsersFromSupabasePostgres();
      const freshUser = dbUsers.find(u => (u.email && u.email.toLowerCase() === cleanEmail) || u.id === cleanEmail);
      if (freshUser && freshUser.password_hash) {
        if (bcrypt.compareSync(cleanPassword, freshUser.password_hash)) {
          isValid = true;
          Object.assign(user, freshUser);
          const uIdx = users.findIndex(x => x.id === user.id);
          if (uIdx !== -1) users[uIdx] = user;
          if (supabaseAuth.supabaseAuthEnabled) {
            supabaseAuth.ensureUser(user.email, cleanPassword, {
              name: user.name,
              role: user.role,
            }).catch(() => {});
          }
        }
      }
    } catch (e) {}
  }

  // [C-1] Removed insecure master/backup password backdoor for super admins.

  if (!isValid) {
    recordAuditLog(user.email, 'User Login Failed', `Invalid password attempt for ${user.email}`, '-', 'AUTH_FAILED', req, { role: user.role, status: 'FAILED' });
    return res.status(401).json({ detail: 'Email atau password salah. Silakan periksa kembali.' });
  }

  // --- Mandatory 2FA TOTP Protection for Super Admin if enabled ---
  const isSuperAdmin = user.role === 'super_admin' || (user.roles && user.roles.includes('super_admin'));
  if (isSuperAdmin && user.totp_enabled) {
    const cleanTotpCode = (totp_code || '').toString().trim().replace(/\s+/g, '');

    if (cleanTotpCode) {
      const activeSecret = user.totp_secret || user.temp_totp_secret;
      if (!activeSecret) {
        return res.status(400).json({ detail: '2FA belum diinisialisasi untuk akun ini.' });
      }

      const verified = speakeasy.totp.verify({
        secret: activeSecret,
        encoding: 'base32',
        token: cleanTotpCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ detail: 'Kode 2FA Authenticator tidak valid atau telah kedaluwarsa. Periksa jam perangkat Anda dan coba lagi.' });
      }

      user.totp_secret = activeSecret;
      delete user.temp_totp_secret;
      user.totp_enabled = true;
      user.totp_verified_at = nowISO();
      saveUsersToDisk();
    } else {
      const tempToken = jwt.sign(
        { sub: user.id, email: user.email, temp_2fa: true },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      return res.json({
        requires_2fa: true,
        temp_token: tempToken,
        email: user.email,
        totp_enabled: true,
        message: 'Otorisasi 2FA Wajib: Masukkan 6 digit kode dari aplikasi Google Authenticator / Authy Anda.'
      });
    }
  }

  logActivity(user, "Sesi Login Berhasil", "Autentikasi", `Login berhasil sebagai ${user.role || 'user'} (${user.email})`, req);
  recordAuditLog(user.email, 'User Login Success', `Role: ${(user.role || 'user').toUpperCase()}`, '-', 'AUTHENTICATED', req, { role: user.role, status: 'SUCCESS' });
  saveUsersToDisk();

  const token = signAuthToken(user);
  res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  const cleaned = cleanUser(user);
  res.json({ ...cleaned, user: cleaned, access_token: token, token });
});

api.post('/auth/verify-2fa', authLimiter, (req, res) => {
  const { temp_token, totp_code, email } = req.body;
  if (!totp_code) {
    return res.status(400).json({ detail: 'Kode 2FA Authenticator wajib diisi' });
  }

  let userId = null;
  let userEmail = (email || '').toLowerCase().trim();

  if (temp_token) {
    try {
      const decoded = jwt.verify(temp_token, JWT_SECRET);
      userId = decoded.sub;
      userEmail = decoded.email || userEmail;
    } catch (e) {
      return res.status(401).json({ detail: 'Sesi verifikasi 2FA telah kedaluwarsa. Silakan login kembali.' });
    }
  }

  const user = users.find(u => (userId && u.id === userId) || (userEmail && u.email.toLowerCase() === userEmail));
  if (!user) {
    return res.status(404).json({ detail: 'Pengguna tidak ditemukan' });
  }

  const activeSecret = user.totp_secret || user.temp_totp_secret;
  if (!activeSecret) {
    return res.status(400).json({ detail: '2FA belum diinisialisasi untuk akun ini.' });
  }

  const cleanCode = String(totp_code).trim().replace(/\s+/g, '');
  const verified = speakeasy.totp.verify({
    secret: activeSecret,
    encoding: 'base32',
    token: cleanCode,
    window: 2
  });

  if (!verified) {
    return res.status(401).json({ detail: 'Kode 2FA Authenticator tidak valid. Pastikan jam pada perangkat Anda sinkron.' });
  }

  user.totp_secret = activeSecret;
  delete user.temp_totp_secret;
  user.totp_enabled = true;
  user.totp_verified_at = nowISO();
  saveUsersToDisk();

  const token = signAuthToken(user);
  res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  const cleaned = cleanUser(user);
  res.json({ ...cleaned, user: cleaned, access_token: token, token });
});

// --- Dedicated 2FA Management Endpoints for Logged-In Users ---
api.get('/auth/2fa/status', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ detail: 'Silakan login terlebih dahulu' });

  res.json({
    totp_enabled: !!user.totp_secret,
    email: user.email,
    verified_at: user.totp_verified_at || null
  });
});

api.post('/auth/2fa/generate-secret', async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ detail: 'Silakan login terlebih dahulu' });

  const secretObj = speakeasy.generateSecret({
    length: 20,
    name: `TREXIO Super Admin (${user.email})`,
    issuer: 'TREXIO Platform'
  });

  user.temp_totp_secret = secretObj.base32;
  saveUsersToDisk();

  const qrCodeDataUrl = await QRCode.toDataURL(secretObj.otpauth_url);

  res.json({
    secret_key: secretObj.base32,
    otpauth_url: secretObj.otpauth_url,
    qr_code_url: qrCodeDataUrl,
    message: 'Secret key 2FA berhasil dibuat. Pindai QR Code di aplikasi Authenticator.'
  });
});

api.post('/auth/2fa/confirm-setup', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ detail: 'Silakan login terlebih dahulu' });

  const { totp_code } = req.body;
  const activeSecret = user.temp_totp_secret || user.totp_secret;
  if (!activeSecret) {
    return res.status(400).json({ detail: 'Belum ada secret key 2FA yang disiapkan.' });
  }

  const cleanCode = String(totp_code || '').trim().replace(/\s+/g, '');
  const verified = speakeasy.totp.verify({
    secret: activeSecret,
    encoding: 'base32',
    token: cleanCode,
    window: 2
  });

  if (!verified) {
    return res.status(400).json({ detail: 'Kode 2FA tidak valid. Periksa aplikasi Authenticator Anda.' });
  }

  user.totp_secret = activeSecret;
  delete user.temp_totp_secret;
  user.totp_enabled = true;
  user.totp_verified_at = nowISO();
  saveUsersToDisk();

  res.json({ ok: true, message: 'Dua-Faktor Otentikasi (2FA) berhasil diaktifkan dan dikunci.' });
});

api.post('/auth/2fa/disable', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ detail: 'Silakan login terlebih dahulu' });

  const { password, totp_code } = req.body;
  if (user.password_hash) {
    const isPassValid = bcrypt.compareSync(String(password || ''), user.password_hash);
    if (!isPassValid) {
      return res.status(400).json({ detail: 'Kata sandi tidak sesuai.' });
    }
  }

  if (user.totp_secret && totp_code) {
    const cleanCode = String(totp_code).trim().replace(/\s+/g, '');
    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: cleanCode,
      window: 2
    });
    if (!verified) {
      return res.status(400).json({ detail: 'Kode 2FA Authenticator salah.' });
    }
  }

  delete user.totp_secret;
  delete user.temp_totp_secret;
  user.totp_enabled = false;
  saveUsersToDisk();

  res.json({ ok: true, message: '2FA berhasil dinonaktifkan.' });
});

api.all('/auth/logout', (req, res) => {
  const cookieOpts = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    maxAge: 0,
  };
  res.clearCookie('access_token', cookieOpts);
  res.clearCookie('refresh_token', cookieOpts);
  res.clearCookie('imp_token', cookieOpts);
  res.clearCookie('_csrf', cookieOpts);
  res.cookie('access_token', '', cookieOpts);
  res.cookie('refresh_token', '', cookieOpts);
  res.cookie('imp_token', '', cookieOpts);
  res.json({ ok: true, message: 'Berhasil keluar.' });
});

api.get('/auth/me', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  if (user._is_impersonating) {
    return res.json({
      ...cleanUser(user),
      impersonation: {
        active: true,
        actor_id: user._impersonated_by,
        actor_email: user._impersonator_email,
      }
    });
  }
  res.json({ ...cleanUser(user), impersonation: { active: false } });
});

api.post(['/auth/refresh', '/auth/refresh-token'], requireAuth, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Sesi tidak valid untuk perpanjangan token.' });
  }
  const newToken = signAuthToken(user);
  res.cookie('access_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  res.json({
    ok: true,
    token: newToken,
    access_token: newToken,
    user: cleanUser(user)
  });
});

// --- OAuth Social Login & Supabase Auth Session ---
async function handleSupabaseSession(req, res) {
  const { access_token, supabase_uid, email, name, phone } = req.body || {};
  let targetEmail = (email || '').trim().toLowerCase();
  let sbUid = supabase_uid || '';
  let displayName = name || '';

  if (targetEmail) {
    targetEmail = targetEmail.toLowerCase();
  }

  if (!targetEmail && !sbUid) {
    return res.status(400).json({ detail: 'Email atau Supabase UID diperlukan untuk autentikasi' });
  }

  let user = users.find(u => (sbUid && u.supabase_uid === sbUid) || (targetEmail && u.email.toLowerCase() === targetEmail));

  if (!user) {
    user = {
      id: `user_sb_${uuidv4().substring(0, 8)}`,
      supabase_uid: sbUid,
      uid: sbUid || `uid_${uuidv4().substring(0, 8)}`,
      name: displayName || (targetEmail ? targetEmail.split('@')[0] : 'Pengguna Trexio'),
      email: targetEmail || `user_${uuidv4().substring(0, 6)}@trexio.id`,
      phone: phone || '',
      password_hash: '',
      role: 'user',
      roles: ['user'],
      tenant_id: 'tenant_default',
      activity_logs: [],
      transaction_history: [],
      scan_records: [],
      created_at: nowISO(),
    };
    users.push(user);
  } else {
    if (user.status === 'deleted') {
      return res.status(403).json({ detail: 'Akun ini telah dihapus secara permanen. Silakan mendaftar akun baru jika ingin menggunakan TREXIO.' });
    }
    if (user.status === 'deactivated') {
      user.status = 'active';
    }
    if (sbUid && !user.supabase_uid) {
      user.supabase_uid = sbUid;
    }
    if (displayName && (!user.name || user.name.startsWith('User '))) {
      user.name = displayName;
    }
    if (phone && !user.phone) {
      user.phone = phone;
    }
  }

  saveUsersToDisk();

  const token = signAuthToken(user);
  res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  const cleaned = cleanUser(user);

  return res.json({ ...cleaned, user: cleaned, access_token: token, provider: 'supabase' });
}

api.post('/auth/supabase-session', authLimiter, (req, res) => handleSupabaseSession(req, res));

async function handleSocialAuth(provider, req, res) {
  if (provider !== 'google' && provider !== 'supabase') {
    return res.status(400).json({ detail: `Autentikasi sosial ${provider} telah dinonaktifkan. Trexio hanya mendukung Google / Supabase untuk autentikasi sosial.` });
  }

  const { email, name, phone, supabase_uid } = req.body || req.query || {};
  let targetEmail = (email || '').trim().toLowerCase();
  let uidVal = supabase_uid || '';
  let displayName = name || '';

  if (!targetEmail && !uidVal) {
    return res.status(400).json({ detail: 'Email atau token autentikasi diperlukan' });
  }

  let user = users.find(u => (uidVal && (u.supabase_uid === uidVal || u.uid === uidVal)) || (targetEmail && u.email.toLowerCase() === targetEmail));

  if (!user) {
    user = {
      id: `user_${provider}_${uuidv4().substring(0, 8)}`,
      supabase_uid: uidVal,
      uid: uidVal || `uid_${uuidv4().substring(0, 8)}`,
      name: displayName || (targetEmail ? targetEmail.split('@')[0] : 'Pengguna Trexio'),
      email: targetEmail || `user_${uuidv4().substring(0, 6)}@trexio.id`,
      phone: phone || '',
      password_hash: '',
      role: 'user',
      roles: ['user'],
      tenant_id: 'tenant_default',
      activity_logs: [],
      transaction_history: [],
      scan_records: [],
      created_at: nowISO(),
    };
    users.push(user);
  } else {
    if (user.status === 'deleted') {
      return res.status(403).json({ detail: 'Akun ini telah dihapus secara permanen. Silakan mendaftar akun baru jika ingin menggunakan TREXIO.' });
    }
    if (user.status === 'deactivated') {
      user.status = 'active';
    }
    if (uidVal && !user.supabase_uid) {
      user.supabase_uid = uidVal;
    }
    if (displayName && (!user.name || user.name.startsWith('User '))) {
      user.name = displayName;
    }
    if (phone && !user.phone) {
      user.phone = phone;
    }
  }

  saveUsersToDisk();

  const token = signAuthToken(user);
  res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  const cleaned = cleanUser(user);

  if (req.method === 'GET') {
    return res.redirect('/');
  }
  return res.json({ ...cleaned, user: cleaned, access_token: token, provider });
}

api.post('/auth/google', authLimiter, (req, res) => handleSocialAuth('google', req, res));
api.get('/auth/google', (req, res) => handleSocialAuth('google', req, res));
api.get('/auth/google/callback', (req, res) => handleSocialAuth('google', req, res));

api.all(['/auth/apple', '/auth/apple/callback', '/auth/facebook', '/auth/facebook/callback'], (req, res) => {
  return res.status(400).json({ detail: 'Autentikasi Facebook dan Apple telah dinonaktifkan. Silakan gunakan Google atau Email/Password.' });
});

api.get('/auth/status', (req, res) => {
  res.json({
    status: 'Auth module active',
    provider: 'supabase',
    supabase_auth_enabled: supabaseAuth.supabaseAuthEnabled,
    database: systemHealth.database,
    timestamp: nowISO()
  });
});

api.get('/auth/diagnostics', async (req, res) => {
  const token = req.cookies?.access_token || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null);
  let tokenValid = false;
  let decodedPayload = null;
  let tokenError = null;

  if (token) {
    try {
      decodedPayload = jwt.verify(token, JWT_SECRET);
      tokenValid = true;
    } catch (err) {
      tokenError = err.message;
      try {
        decodedPayload = jwt.decode(token);
      } catch (_) {}
    }
  }

  res.json({
    timestamp: nowISO(),
    database: {
      status: systemHealth.database.connected ? 'healthy' : 'disconnected',
      provider: 'Supabase PostgreSQL',
      totalUsers: users.length
    },
    auth: {
      provider: 'Supabase Auth',
      configured: supabaseAuth.supabaseAuthEnabled,
    },
    jwt: {
      tokenProvided: Boolean(token),
      tokenValid,
      tokenError,
      decodedPayload
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      jwtSecretConfigured: Boolean(JWT_SECRET)
    }
  });
});

// Real OTP Store in memory
const otpStore = new Map();

api.post('/auth/otp/send', authLimiter, async (req, res) => {
  return res.status(400).json({ detail: 'Autentikasi login instan via WhatsApp OTP telah dinonaktifkan. Silakan gunakan Google atau Email/Password.' });
});

api.post('/auth/otp/verify', authLimiter, (req, res) => {
  return res.status(400).json({ detail: 'Autentikasi login instan via WhatsApp OTP telah dinonaktifkan. Silakan gunakan Google atau Email/Password.' });
});

// --- FORGOT PASSWORD & OTP ENGINE FOR ALL ROLES ---
const forgotPasswordStore = new Map();

function maskEmail(emailStr) {
  if (!emailStr || !emailStr.includes('@')) return emailStr || '';
  const [name, domain] = emailStr.split('@');
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name.substring(0, 2)}***${name.slice(-1)}@${domain}`;
}

function maskPhone(phoneStr) {
  if (!phoneStr) return '08*****';
  const clean = phoneStr.replace(/[^0-9]/g, '');
  if (clean.length < 6) return clean;
  return `${clean.substring(0, 4)}****${clean.slice(-3)}`;
}

function findUserByEmailOrPhone(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  const digits = clean.replace(/[^0-9]/g, '');

  return users.find(u => {
    // Email check
    if (u.email && u.email.toLowerCase() === clean) return true;
    
    // Phone check
    if (digits && digits.length >= 6 && u.phone) {
      const userPhoneDigits = String(u.phone).replace(/[^0-9]/g, '');
      if (userPhoneDigits.includes(digits) || digits.includes(userPhoneDigits)) return true;
    }

    // Role specific fallback identifiers
    if (clean === 'superadmin' && ['superadmin@trexio.id', 'trexioadventure@gmail.com'].includes(u.email.toLowerCase())) return true;
    if (clean === 'admin' && u.email.toLowerCase() === 'admin@trexio.id') return true;

    return false;
  });
}

api.post(['/auth/forgot-password/request', '/auth/reset-password/request', '/auth/forgot-password'], authLimiter, async (req, res) => {
  const { identifier, method = 'email' } = req.body || {};
  if (!identifier || !String(identifier).trim()) {
    return res.status(400).json({ detail: 'Email atau Nomor WhatsApp terdaftar wajib diisi.' });
  }

  const cleanIdent = String(identifier).trim().toLowerCase();
  const user = findUserByEmailOrPhone(cleanIdent);

  if (!user) {
    recordAuditLog(
      cleanIdent,
      'Account Recovery Attempt Failed',
      `Unregistered Identifier: ${cleanIdent}`,
      '-',
      'USER_NOT_FOUND',
      req,
      { status: 'FAILED' }
    );
    return res.status(404).json({
      detail: `Akun dengan ${cleanIdent.includes('@') ? 'email' : 'nomor WhatsApp/ID'} "${cleanIdent}" tidak ditemukan di aplikasi Trexio. Silakan periksa kembali data Anda.`,
      code: 'USER_NOT_FOUND'
    });
  }

  // Generate 6-digit verification code
  const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetTicketId = `rst_${uuidv4().substring(0, 8)}`;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Save in memory store
  const resetRecord = {
    userId: user.id,
    userEmail: user.email,
    userPhone: user.phone,
    userRole: user.role,
    code: generatedCode,
    resetTicketId,
    method: method === 'whatsapp' ? 'whatsapp' : 'email',
    verified: false,
    expiresAt
  };

  forgotPasswordStore.set(resetTicketId, resetRecord);
  forgotPasswordStore.set(user.email.toLowerCase(), resetRecord);
  if (user.phone) {
    const pDigits = user.phone.replace(/[^0-9]/g, '');
    if (pDigits) forgotPasswordStore.set(pDigits, resetRecord);
  }

  const maskedDest = method === 'whatsapp'
    ? maskPhone(user.phone || identifier)
    : maskEmail(user.email || identifier);

  // Send real WA message if credentials available
  const waApiToken = process.env.WA_API_TOKEN || process.env.FONNTE_TOKEN || process.env.WABLAS_TOKEN;
  const cleanPhone = (user.phone || identifier).replace(/[^0-9]/g, '');
  if (method === 'whatsapp' && waApiToken && cleanPhone) {
    try {
      await axios.post(process.env.WA_API_URL || 'https://api.fonnte.com/send', {
        target: cleanPhone,
        message: `[Trexio Security] Kode OTP Pemulihan Kata Sandi Anda: ${generatedCode}. Kode ini berlaku 10 menit. Jangan berikan kepada siapapun.`,
      }, { headers: { Authorization: waApiToken }, timeout: 5000 });
    } catch (e) {
      console.error('[WA Gateway Forgot Password Error]', e.message);
    }
  }

  logActivity(
    user,
    "Permintaan Reset Password",
    "Keamanan",
    `Permintaan pemulihan kata sandi diajukan via ${method.toUpperCase()} (${maskedDest})`,
    req
  );

  recordAuditLog(
    user.email,
    'Password Reset Requested',
    `Recovery Ticket ${resetTicketId} via ${method.toUpperCase()} (${maskedDest})`,
    '-',
    'OTP_DISPATCHED',
    req,
    { role: user.role, status: 'SUCCESS' }
  );

  res.json({
    ok: true,
    message: `Kode verifikasi pemulihan 6-digit telah dikirimkan via ${method === 'whatsapp' ? 'WhatsApp' : 'Email'} ke ${maskedDest}.`,
    reset_ticket_id: resetTicketId,
    method: method === 'whatsapp' ? 'whatsapp' : 'email',
    masked_destination: maskedDest,
    role: user.role,
    ...(process.env.NODE_ENV !== 'production' ? { dev_otp: generatedCode } : {})
  });
});

api.post(['/auth/forgot-password/verify-otp', '/auth/reset-password/verify'], authLimiter, (req, res) => {
  const { code, reset_ticket_id, identifier } = req.body || {};
  if (!code || String(code).trim().length < 4) {
    return res.status(400).json({ detail: 'Kode OTP 6-digit wajib diisi.' });
  }

  let record = null;
  if (reset_ticket_id) {
    record = forgotPasswordStore.get(reset_ticket_id);
  }
  if (!record && identifier) {
    const cleanIdent = String(identifier).trim().toLowerCase();
    const digits = cleanIdent.replace(/[^0-9]/g, '');
    record = forgotPasswordStore.get(cleanIdent) || (digits ? forgotPasswordStore.get(digits) : null);
  }

  if (!record) {
    return res.status(400).json({ detail: 'Sesi verifikasi reset password tidak ditemukan atau telah kedaluwarsa. Silakan minta kode baru.' });
  }

  if (Date.now() > record.expiresAt) {
    return res.status(400).json({ detail: 'Kode OTP pemulihan telah kedaluwarsa. Silakan minta kode baru.' });
  }

  if (record.code !== String(code).trim()) {
    recordAuditLog(
      record.userEmail,
      'Password Reset OTP Verification Failed',
      `Reset Ticket #${record.resetTicketId}`,
      'UNVERIFIED',
      'INVALID_OTP',
      req,
      { role: record.userRole, status: 'FAILED' }
    );
    return res.status(400).json({ detail: 'Kode OTP yang Anda masukkan salah. Periksa kembali pesan Anda.' });
  }

  // Mark as verified
  record.verified = true;
  const resetToken = `tok_${uuidv4().substring(0, 12)}`;
  record.resetToken = resetToken;
  forgotPasswordStore.set(resetToken, record);

  recordAuditLog(
    record.userEmail,
    'Password Reset OTP Verified',
    `Reset Ticket #${record.resetTicketId}`,
    'UNVERIFIED',
    'VERIFIED',
    req,
    { role: record.userRole, status: 'SUCCESS' }
  );

  res.json({
    ok: true,
    reset_token: resetToken,
    message: 'Kode OTP terverifikasi! Silakan buat kata sandi baru Anda.'
  });
});

api.post(['/auth/forgot-password/reset', '/auth/reset-password/reset', '/auth/reset-password'], authLimiter, (req, res) => {
  const { reset_token, new_password, email, password } = req.body || {};
  const targetPassword = new_password || password;
  const tokenToUse = reset_token;

  if (!targetPassword || targetPassword.length < 6) {
    return res.status(400).json({ detail: 'Kata sandi baru minimal harus 6 karakter.' });
  }

  let record = null;
  if (tokenToUse) {
    record = forgotPasswordStore.get(tokenToUse);
  } else if (email) {
    record = forgotPasswordStore.get(String(email).trim().toLowerCase());
  }

  if (!record || !record.verified) {
    return res.status(400).json({ detail: 'Otorisasi reset kata sandi tidak valid. Silakan selesaikan verifikasi OTP terlebih dahulu.' });
  }

  if (Date.now() > record.expiresAt) {
    return res.status(400).json({ detail: 'Sesi reset kata sandi telah kedaluwarsa. Silakan ulangi proses dari awal.' });
  }

  const user = users.find(u => u.id === record.userId);
  if (!user) {
    return res.status(404).json({ detail: 'Pengguna tidak ditemukan.' });
  }

  // Hash new password using bcrypt
  const salt = bcrypt.genSaltSync(10);
  user.password_hash = bcrypt.hashSync(targetPassword, salt);

  // Clear memory store for this record
  if (record.resetTicketId) forgotPasswordStore.delete(record.resetTicketId);
  if (record.resetToken) forgotPasswordStore.delete(record.resetToken);
  if (record.userEmail) forgotPasswordStore.delete(record.userEmail.toLowerCase());

  saveUsersToDisk();

  logActivity(
    user,
    "Pembaruan Kata Sandi Selesai",
    "Keamanan",
    `Kata sandi berhasil diperbarui melalui verifikasi ${record.method.toUpperCase()}.`,
    req
  );

  recordAuditLog(
    user.email,
    'Completed Self-Service Password Reset',
    `Role: ${user.role.toUpperCase()}`,
    'old_password_hash',
    'updated_password_hash',
    req,
    { role: user.role, status: 'SUCCESS' }
  );

  res.json({
    ok: true,
    message: `Kata sandi akun ${user.email} (${user.role.toUpperCase()}) berhasil diperbarui. Silakan login kembali dengan kata sandi baru Anda.`
  });
});

// Upload routes extracted in Mission 09C Phase 5.\n// --- User Profile & Comprehensive Role Update Features ---
};
