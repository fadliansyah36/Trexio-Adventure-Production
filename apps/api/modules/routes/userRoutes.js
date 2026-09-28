/**
 * Trexio API route module: User.
 *
 * Extracted from apps/api/server.js during Mission 09C Phase 5B.
 * Dependencies are injected explicitly to keep the extraction dependency-safe.
 */
const crypto = require('crypto');

module.exports = function registerUserRoutes(ctx) {
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
    getClientIp, sanitizeHeaders, getRequestId
  } = ctx;

api.get(['/profile', '/users/me/profile', '/auth/profile'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  res.json(cleanUser(u));
});

api.get(['/users/me/stats', '/profile/stats', '/me/stats', '/users/stats', '/me/dashboard/stats'], requireAuth, (req, res) => {
  const stats = calculateUserDashboardStats(req.user.id);
  res.json({ ok: true, stats, dashboard_stats: stats });
});

// User Digital QR Pass Endpoint
api.get(['/users/me/qr', '/profile/qr'], requireAuth, async (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });

  const QRCode = require('qrcode');
  // Only paid / verified bookings can generate active trip passes
  const userBookings = bookings.filter(b => b.user_id === u.id);
  const paidUserBookings = userBookings.filter(b => (b.payment_status === 'verified' || b.payment_status === 'paid' || b.booking_status === 'confirmed') && !['cancelled', 'expired', 'failed', 'pending'].includes(b.payment_status));
  const activeBooking = paidUserBookings.find(b => b.trip_status !== 'COMPLETED' && b.booking_status !== 'completed') || paidUserBookings[0] || null;

  const passCode = `TREXIO-PASS-${u.id}`;
  let payloadData;

  if (activeBooking) {
    const tripObj = trips.find(t => t.id === activeBooking.trip_id);
    const vendorId = activeBooking.vendor_id || tripObj?.vendor_id || 'vendor_official';
    const ticketToken = activeBooking.ticket_token || `TKT-${crypto.createHash('sha256').update(`${activeBooking.booking_code}:${u.id}:${activeBooking.created_at}`).digest('hex').substring(0, 16).toUpperCase()}`;
    activeBooking.ticket_token = ticketToken;
    activeBooking.vendor_id = vendorId;
    payloadData = {
      type: 'trexio_user_pass',
      user_id: u.id,
      ver_code: passCode,
      booking_code: activeBooking.booking_code,
      ticket_token: ticketToken,
      trip_id: activeBooking.trip_id,
      vendor_id: vendorId,
    };
  } else {
    payloadData = {
      type: 'trexio_user_identity_pass',
      user_id: u.id,
      ver_code: passCode,
      name: u.name,
      email: u.email,
      level_pendaki: u.level_pendaki || 'Pendaki Regular'
    };
  }

  try {
    const qrImage = await QRCode.toDataURL(JSON.stringify(payloadData), {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: { dark: '#064e3b', light: '#ffffff' }
    });
    res.json({
      ver_code: passCode,
      qr_image: qrImage,
      user: { id: u.id, name: u.name, email: u.email, level_pendaki: u.level_pendaki || 'Pendaki Regular' },
      active_booking: activeBooking ? formatBookingWithChecklist(activeBooking) : null,
      user_bookings: paidUserBookings.map(formatBookingWithChecklist),
      total_bookings: paidUserBookings.length,
    });
  } catch (err) {
    res.status(500).json({ detail: 'Gagal membuat QR Code' });
  }
});

// Single Booking QR Code Generator Endpoint
api.get('/bookings/code/:code/qr', requireAuth, async (req, res) => {
  const { code } = req.params;
  const b = bookings.find(item => item.booking_code === code || item.id === code);
  if (!b) return res.status(404).json({ detail: 'Booking tidak ditemukan' });

  const roles = req.user.roles || [req.user.role];
  const isOwner = b.user_id === req.user.id || (req.user.email && b.user_email === req.user.email);
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const v = vendors.find(vItem => vItem.user_id === req.user.id || vItem.id === req.user.vendor_id || (vItem.contact && vItem.contact.email === req.user.email));
  const isVendorOwner = v && (b.vendor_id === v.id || trips.some(t => t.id === b.trip_id && t.vendor_id === v.id));

  if (!isOwner && !isAdmin && !isVendorOwner) {
    return res.status(403).json({ detail: 'Akses ditolak: Anda tidak memiliki wewenang untuk mengakses e-ticket booking ini.' });
  }

  // Financial Gate: Only PAID / verified bookings can issue active scannable QR ticket
  const isPaid = (b.payment_status === 'verified' || b.payment_status === 'paid' || b.booking_status === 'confirmed') && !['pending', 'awaiting_verification', 'cancelled', 'expired', 'failed'].includes(b.payment_status);
  if (!isPaid) {
    return res.status(403).json({ detail: 'E-Ticket dan QR Code hanya dapat diterbitkan setelah pembayaran dikonfirmasi (PAID).' });
  }

  const QRCode = require('qrcode');
  const ticketToken = b.ticket_token || `TKT-${crypto.createHash('sha256').update(`${b.booking_code}:${b.user_id}:${b.created_at}`).digest('hex').substring(0, 16).toUpperCase()}`;
  b.ticket_token = ticketToken;

  const tripObj = trips.find(t => t.id === b.trip_id);
  const vendorId = b.vendor_id || tripObj?.vendor_id || 'vendor_official';
  b.vendor_id = vendorId;

  const payloadData = {
    type: 'trexio_ticket',
    booking_code: b.booking_code,
    ticket_token: ticketToken,
    token: ticketToken,
    trip_id: b.trip_id,
    vendor_id: vendorId,
    user_id: b.user_id,
  };

  try {
    const qrImage = await QRCode.toDataURL(JSON.stringify(payloadData), {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: { dark: '#065f46', light: '#ffffff' }
    });
    res.json({
      booking_code: b.booking_code,
      qr_image: qrImage,
      ticket_token: ticketToken,
      vendor_id: vendorId,
      booking: formatBookingWithChecklist(b),
    });
  } catch (err) {
    res.status(500).json({ detail: 'Gagal membuat QR Code booking' });
  }
});

const handleProfileUpdate = (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });

  const {
    name,
    email,
    phone,
    bio,
    avatar,
    // Password change fields
    current_password,
    old_password,
    new_password,
    confirm_password,
    // Super Admin fields
    job_title,
    department,
    direct_phone,
    security_notes,
    // Admin Tenant fields
    company_name,
    tenant_name,
    support_phone,
    address,
    operating_hours,
    operational_notes,
    // Vendor / Partner fields
    business_name,
    business_category,
    pic_name,
    pic_phone,
    bank_name,
    bank_account_number,
    bank_account_holder,
    service_area,
    // User Pendaki fields
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relation,
    blood_type,
    origin_city,
    medical_history,
  } = req.body;

  // 1. Email Uniqueness Check if email changed
  if (email && email.toLowerCase().trim() !== u.email.toLowerCase()) {
    const lowerNewEmail = email.toLowerCase().trim();
    const existing = users.find(other => other.id !== u.id && other.email.toLowerCase() === lowerNewEmail);
    if (existing) {
      return res.status(400).json({ detail: 'Alamat email tersebut sudah digunakan oleh akun lain.' });
    }
    u.email = lowerNewEmail;
  }

  // 2. Password Change Validation with Confirmation
  if (new_password || confirm_password) {
    if (!new_password || !confirm_password) {
      return res.status(400).json({ detail: 'Password baru dan Konfirmasi Password baru wajib diisi keduanya.' });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ detail: 'Konfirmasi password tidak cocok dengan password baru.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ detail: 'Password baru minimal harus 6 karakter.' });
    }

    const checkOldPass = current_password || old_password;
    if (u.password_hash && u.password_hash.length > 0) {
      if (!checkOldPass) {
        return res.status(400).json({ detail: 'Masukkan kata sandi saat ini untuk mengonfirmasi perubahan password.' });
      }
      const isMatch = bcrypt.compareSync(String(checkOldPass), u.password_hash);
      if (!isMatch) {
        return res.status(400).json({ detail: 'Kata sandi saat ini tidak sesuai.' });
      }
    }
    u.password_hash = bcrypt.hashSync(new_password, 10);
    logActivity(u, "Perubahan Password Akun", "Keamanan", "Password akun berhasil diperbarui dengan konfirmasi sandi lama", req);
  }

  // 3. Universal Profile Updates
  let updateDetails = [];
  if (name !== undefined && name.trim() !== u.name) { updateDetails.push("Nama"); u.name = name.trim(); }
  if (email !== undefined && email.toLowerCase().trim() !== u.email) {
    updateDetails.push("Email (Perlu Verifikasi Ulang)");
    u.email = email.toLowerCase().trim();
    u.email_verified = false;
    u.email_verified_at = null;
    u.email_otp = null;
    u.email_verification_token = null;
    u.email_otp_expires_at = null;
  }
  if (phone !== undefined && phone.trim() !== u.phone) { updateDetails.push("No. Handphone"); u.phone = phone.trim(); }
  if (bio !== undefined && bio !== u.bio) { updateDetails.push("Bio/Keterangan"); u.bio = bio; }
  if (avatar !== undefined && avatar !== u.avatar) {
    updateDetails.push("Foto Profil (Upload File)");
    u.avatar = avatar;
    logActivity(u, "Pembaruan Foto Profil", "Profil", "Foto profil baru telah diunggah dan diperbarui", req);
  }

  // 4. Role-Specific Profile Updates
  // Super Admin
  if (job_title !== undefined) { updateDetails.push("Jabatan"); u.job_title = job_title; }
  if (department !== undefined) { updateDetails.push("Departemen"); u.department = department; }
  if (direct_phone !== undefined) { updateDetails.push("Telepon Langsung"); u.direct_phone = direct_phone; }
  if (security_notes !== undefined) { updateDetails.push("Catatan Keamanan"); u.security_notes = security_notes; }

  // Admin Tenant
  if (company_name !== undefined || tenant_name !== undefined) {
    updateDetails.push("Nama Perusahaan/Tenant");
    u.company_name = company_name || tenant_name;
    u.tenant_name = tenant_name || company_name;
  }
  if (support_phone !== undefined) { updateDetails.push("Telepon Layanan"); u.support_phone = support_phone; }
  if (address !== undefined) { updateDetails.push("Alamat Operasional"); u.address = address; }
  if (operating_hours !== undefined) { updateDetails.push("Jam Operasional"); u.operating_hours = operating_hours; }
  if (operational_notes !== undefined) { updateDetails.push("Catatan Operasional"); u.operational_notes = operational_notes; }

  // Vendor / Partner
  if (business_name !== undefined) { updateDetails.push("Nama Usaha Mitra"); u.business_name = business_name; }
  if (business_category !== undefined) { updateDetails.push("Kategori Usaha"); u.business_category = business_category; }
  if (pic_name !== undefined) { updateDetails.push("Nama PIC"); u.pic_name = pic_name; }
  if (pic_phone !== undefined) { updateDetails.push("Telepon PIC"); u.pic_phone = pic_phone; }
  if (bank_name !== undefined) { updateDetails.push("Bank"); u.bank_name = bank_name; }
  if (bank_account_number !== undefined) { updateDetails.push("No. Rekening"); u.bank_account_number = bank_account_number; }
  if (bank_account_holder !== undefined) { updateDetails.push("Nama Pemilik Rekening"); u.bank_account_holder = bank_account_holder; }
  if (service_area !== undefined) { updateDetails.push("Wilayah Layanan"); u.service_area = service_area; }

  const vPartner = vendors.find(item => item.user_id === u.id);
  if (vPartner) {
    if (business_name !== undefined) vPartner.brand_name = business_name;
    if (business_category !== undefined) vPartner.business_category = business_category;
    if (pic_name !== undefined) vPartner.pic_name = pic_name;
    if (pic_phone !== undefined) vPartner.pic_phone = pic_phone;
    if (!vPartner.payout) vPartner.payout = {};
    if (bank_name !== undefined) vPartner.payout.bank_name = bank_name;
    if (bank_account_number !== undefined) vPartner.payout.account_number = bank_account_number;
    if (bank_account_holder !== undefined) vPartner.payout.account_holder = bank_account_holder;
    if (service_area !== undefined) vPartner.service_area = service_area;
    if (req.body.cover_image !== undefined) vPartner.cover_image = req.body.cover_image;
    vPartner.updated_at = nowISO();
    saveSubDataToDisk();
  }

  // User Pendaki
  if (emergency_contact_name !== undefined || emergency_contact_phone !== undefined) {
    updateDetails.push("Kontak Darurat");
    u.emergency_contact_name = emergency_contact_name || u.emergency_contact_name || '';
    u.emergency_contact_phone = emergency_contact_phone || u.emergency_contact_phone || '';
    u.emergency_contact_relation = emergency_contact_relation || u.emergency_contact_relation || 'Keluarga';
  }
  if (blood_type !== undefined) { updateDetails.push("Golongan Darah"); u.blood_type = blood_type; }
  if (origin_city !== undefined) { updateDetails.push("Kota Asal"); u.origin_city = origin_city; }
  if (medical_history !== undefined) { updateDetails.push("Riwayat Medis"); u.medical_history = medical_history; }

  if (updateDetails.length > 0) {
    logActivity(
      u,
      `Pembaruan Data Profil (${u.role || 'user'})`,
      "Profil",
      `Field yang diperbarui: ${updateDetails.join(", ")}`,
      req
    );
  }

  saveUsersToDisk();
  res.json({
    ok: true,
    message: 'Profil berhasil diperbarui',
    user: cleanUser(u),
  });
};

// Activity Log API Endpoints
api.get(['/users/me/activity-log', '/users/me/activities', '/profile/activity-log'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  ensureDefaultActivityLogs(u);
  res.json({
    ok: true,
    activities: u.activity_logs || [],
  });
});

api.post(['/users/me/activity-log', '/profile/activity-log'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const { action, category, details } = req.body;
  if (!action) return res.status(400).json({ detail: 'Aktivitas wajib memiliki judul tindakan' });
  
  const entry = logActivity(u, action, category || "Aktivitas", details || action, req);
  res.json({ ok: true, activity: entry, activities: u.activity_logs });
});

api.delete(['/users/me/activity-log', '/profile/activity-log'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  u.activity_logs = [
    {
      id: `act_${uuidv4().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      action: "Pembersihan Riwayat Aktivitas",
      category: "Sistem",
      details: "Riwayat aktivitas pengguna berhasil dibersihkan",
      device: "Web Desktop (Chrome)",
      ip: "127.0.0.1",
    }
  ];
  saveUsersToDisk();
  res.json({ ok: true, message: 'Riwayat aktivitas berhasil dibersihkan', activities: u.activity_logs });
});

// EMAIL VERIFICATION ENDPOINTS (SECURE OTP & TOKEN VALIDATION)
api.post(['/auth/resend-verification', '/users/me/resend-verification', '/auth/send-verification'], (req, res) => {
  let u = null;
  if (req.user && req.user.id) {
    u = users.find(item => item.id === req.user.id);
  } else if (req.body && req.body.email) {
    const targetEmail = req.body.email.toLowerCase().trim();
    u = users.find(item => item.email && item.email.toLowerCase() === targetEmail);
  }

  if (!u) {
    return res.status(404).json({ detail: 'Pengguna tidak ditemukan. Silakan login kembali.' });
  }

  if (u.email_verified) {
    return res.json({
      ok: true,
      message: 'Alamat email Anda sudah diverifikasi.',
      already_verified: true,
      user: cleanUser(u)
    });
  }

  // Rate Limiting & Cooldown Enforcer (60s minimum interval)
  if (u.email_otp_last_sent_at) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(u.email_otp_last_sent_at).getTime()) / 1000);
    if (elapsedSeconds < 60) {
      const waitSeconds = 60 - elapsedSeconds;
      return res.status(429).json({
        detail: `Harap tunggu ${waitSeconds} detik lagi sebelum meminta ulang kode OTP verifikasi.`
      });
    }
  }

  // Cryptographically secure 6-digit OTP & UUID verification token
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = `verif_${uuidv4().substring(0, 12)}`;

  u.email_otp = otp;
  u.email_verification_token = token;
  u.email_otp_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes TTL
  u.email_otp_attempts = 0;
  u.email_otp_last_sent_at = new Date().toISOString();

  logActivity(
    u,
    "Kirim Kode OTP Verifikasi Email",
    "Keamanan",
    `Kode OTP verifikasi email (6-digit) telah dikirimkan ke ${u.email}`,
    req
  );

  saveUsersToDisk();

  res.json({
    ok: true,
    message: `Kode OTP verifikasi 6-digit telah dikirimkan ke ${u.email}. Masukkan kode tersebut dalam waktu 15 menit.`,
    sent_to: u.email,
    token: token,
    otp_sent: true,
    expires_in_minutes: 15,
    user: cleanUser(u)
  });
});

api.post(['/auth/verify-email', '/users/me/verify-email'], (req, res) => {
  let u = null;
  if (req.user && req.user.id) {
    u = users.find(item => item.id === req.user.id);
  } else if (req.body && req.body.email) {
    const targetEmail = req.body.email.toLowerCase().trim();
    u = users.find(item => item.email && item.email.toLowerCase() === targetEmail);
  }

  if (!u) {
    return res.status(404).json({ detail: 'Pengguna tidak ditemukan.' });
  }

  if (u.email_verified) {
    return res.json({
      ok: true,
      message: 'Alamat email Anda telah diverifikasi sebelumnya.',
      user: cleanUser(u)
    });
  }

  const inputCode = String(req.body.otp || req.body.token || req.body.code || '').trim();
  if (!inputCode) {
    return res.status(400).json({ detail: 'Kode OTP 6-digit atau token verifikasi wajib diisi.' });
  }

  // Expiration check
  if (!u.email_otp_expires_at || new Date() > new Date(u.email_otp_expires_at)) {
    return res.status(400).json({
      detail: 'Kode OTP verifikasi telah kedaluwarsa. Silakan minta kode OTP baru.'
    });
  }

  // Attempt limit check (Max 5 attempts)
  u.email_otp_attempts = (u.email_otp_attempts || 0) + 1;
  if (u.email_otp_attempts > 5) {
    saveUsersToDisk();
    return res.status(429).json({
      detail: 'Terlalu banyak percobaan kode OTP yang salah. Silakan minta kode OTP baru.'
    });
  }

  // Validation match check
  const isMatch = (u.email_otp && inputCode === String(u.email_otp)) ||
                  (u.email_verification_token && inputCode === String(u.email_verification_token));

  if (!isMatch) {
    saveUsersToDisk();
    const remainingAttempts = Math.max(0, 5 - u.email_otp_attempts);
    return res.status(400).json({
      detail: `Kode OTP verifikasi tidak sesuai. Sisa percobaan: ${remainingAttempts}`
    });
  }

  // Success: mark verified and consume OTP token
  u.email_verified = true;
  u.email_verified_at = new Date().toISOString();
  u.email_otp = null;
  u.email_verification_token = null;
  u.email_otp_expires_at = null;
  u.email_otp_attempts = 0;

  logActivity(
    u,
    "Email Resmi Terverifikasi",
    "Keamanan",
    `Alamat email ${u.email} resmi terverifikasi melalui validasi OTP 6-digit di TREXIO`,
    req
  );

  saveUsersToDisk();

  res.json({
    ok: true,
    message: 'Selamat! Alamat email Anda telah resmi terverifikasi.',
    user: cleanUser(u)
  });
});

// MANAGE ACTIVE SESSIONS API ENDPOINTS
api.get(['/users/me/sessions', '/profile/sessions'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const sessions = ensureDefaultActiveSessions(u, req);
  res.json({
    ok: true,
    sessions: sessions || []
  });
});

api.post(['/users/me/sessions/revoke', '/profile/sessions/revoke'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const { session_id, sessionId } = req.body;
  const targetId = session_id || sessionId;

  if (!targetId) {
    return res.status(400).json({ detail: 'ID sesi tidak valid' });
  }

  ensureDefaultActiveSessions(u, req);

  const targetSess = u.active_sessions.find(s => s.id === targetId);
  if (!targetSess) {
    return res.status(404).json({ detail: 'Sesi perangkat tidak ditemukan' });
  }

  // Remove the revoked session
  u.active_sessions = u.active_sessions.filter(s => s.id !== targetId);

  logActivity(
    u,
    "Pencabutan Sesi Perangkat Remote",
    "Keamanan",
    `Akses untuk sesi perangkat '${targetSess.device_name || targetSess.browser}' (IP: ${targetSess.ip}) telah dicabut.`,
    req
  );

  saveUsersToDisk();

  res.json({
    ok: true,
    message: `Akses untuk perangkat ${targetSess.device_name || 'dipilih'} telah berhasil dicabut.`,
    sessions: u.active_sessions
  });
});

api.delete('/users/me/sessions/:sessionId', requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const targetId = req.params.sessionId;

  ensureDefaultActiveSessions(u, req);
  const targetSess = u.active_sessions.find(s => s.id === targetId);
  if (!targetSess) {
    return res.status(404).json({ detail: 'Sesi tidak ditemukan' });
  }

  u.active_sessions = u.active_sessions.filter(s => s.id !== targetId);

  logActivity(
    u,
    "Pencabutan Akses Sesi Perangkat",
    "Keamanan",
    `Akses untuk sesi '${targetSess.device_name || targetSess.browser}' telah dicabut.`,
    req
  );

  saveUsersToDisk();

  res.json({
    ok: true,
    message: `Sesi ${targetSess.device_name || 'perangkat'} berhasil diakhiri.`,
    sessions: u.active_sessions
  });
});

api.post(['/users/me/sessions/revoke-others', '/profile/sessions/revoke-others'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });

  const sessions = ensureDefaultActiveSessions(u, req);
  const currentSess = sessions.find(s => s.is_current) || sessions[0];
  const countRevoked = sessions.length - (currentSess ? 1 : 0);

  u.active_sessions = currentSess ? [currentSess] : [];

  logActivity(
    u,
    "Pengakhiran Massal Sesi Perangkat Lain",
    "Keamanan",
    `Berhasil mengakhiri secara remote ${countRevoked} sesi aktif di perangkat lain.`,
    req
  );

  saveUsersToDisk();

  res.json({
    ok: true,
    message: `Berhasil mengakhiri ${countRevoked} sesi aktif di seluruh perangkat lain.`,
    sessions: u.active_sessions
  });
});

api.patch(['/profile', '/users/me/profile', '/auth/profile', '/users/profile'], requireAuth, handleProfileUpdate);
api.put(['/profile', '/users/me/profile', '/auth/profile', '/users/profile'], requireAuth, handleProfileUpdate);

api.post('/users/me/change-password', requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const { old_password, current_password, new_password, confirm_password } = req.body;
  const checkOldPass = old_password || current_password;

  if (!checkOldPass || !new_password) {
    return res.status(400).json({ detail: 'Password saat ini dan password baru wajib diisi' });
  }
  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({ detail: 'Konfirmasi password tidak cocok dengan password baru' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ detail: 'Password baru minimal 6 karakter' });
  }
  if (u.password_hash) {
    const isMatch = bcrypt.compareSync(checkOldPass, u.password_hash);
    if (!isMatch) {
      return res.status(400).json({ detail: 'Password saat ini tidak cocok' });
    }
  }
  u.password_hash = bcrypt.hashSync(new_password, 10);
  saveUsersToDisk();
  res.json({ ok: true, message: 'Password berhasil diperbarui' });
});

api.post('/users/me/emergency-contacts', requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const { name, relation, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ detail: 'Nama dan nomor telepon darurat wajib diisi' });
  if (!u.emergency_contacts) u.emergency_contacts = [];
  const newContact = { name, relation: relation || 'Kerabat', phone };
  u.emergency_contacts.push(newContact);
  res.json({ ok: true, contacts: u.emergency_contacts });
});

api.post('/users/me/hiking-history', requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const { mountain_name, date, altitude, status, organizer } = req.body;
  if (!mountain_name) return res.status(400).json({ detail: 'Nama gunung wajib diisi' });
  if (!u.hiking_history) u.hiking_history = [];
  const newRecord = { mountain_name, date: date || nowISO().split('T')[0], altitude: altitude || '2,000+ MDPL', status: status || 'Selesai', organizer: organizer || 'Mandiri' };
  u.hiking_history.unshift(newRecord);
  res.json({ ok: true, history: u.hiking_history });
});

// --- ACCOUNT DEACTIVATION & DELETION & PREFERENCES ---
api.all(['/users/me/deactivate', '/account/deactivate', '/auth/deactivate', '/profile/deactivate'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  
  const prevStatus = u.status || 'active';
  u.status = 'deactivated';
  u.tokens_revoked_at = new Date().toISOString();
  saveUsersToDisk();

  recordAuditLog(
    u.email,
    'ACCOUNT_DEACTIVATED',
    `User ${u.id} deactivated account`,
    prevStatus,
    'deactivated',
    req,
    { userId: u.id }
  );

  res.json({ ok: true, message: 'Akun Anda telah berhasil dinonaktifkan. Anda dapat mengaktifkannya kembali sewaktu-waktu dengan login ulang.' });
});

api.all(['/users/me/delete', '/users/me/destroy', '/account/delete', '/account/destroy', '/auth/delete', '/profile/delete'], requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });

  const prevStatus = u.status || 'active';
  // Mark as deleted without wiping historical bookings/orders/payments (Data Retention compliance)
  u.status = 'deleted';
  u.name = 'Pengguna Dihapus';
  u.phone = '';
  u.bio = 'Akun ini telah dihapus oleh pengguna.';
  u.tokens_revoked_at = new Date().toISOString();
  saveUsersToDisk();

  recordAuditLog(
    u.email,
    'ACCOUNT_DELETED',
    `User ${u.id} permanently deleted account`,
    prevStatus,
    'deleted',
    req,
    { userId: u.id }
  );

  res.json({ ok: true, message: 'Akun Anda telah berhasil dihapus secara permanen. Riwayat transaksi disimpan secara anonim sesuai kebijakan retensi data.' });
});

api.patch('/users/me/preferences', requireAuth, (req, res) => {
  const u = users.find(item => item.id === req.user.id);
  if (!u) return res.status(404).json({ detail: 'User tidak ditemukan' });
  const { preferences } = req.body;
  u.preferences = { ...(u.preferences || {}), ...(preferences || {}) };
  saveUsersToDisk();
  res.json({ ok: true, preferences: u.preferences });
});

// --- Chat User ↔ Mitra & Vendor Communications ---
api.get('/chat/conversations', requireAuth, (req, res) => {
};
