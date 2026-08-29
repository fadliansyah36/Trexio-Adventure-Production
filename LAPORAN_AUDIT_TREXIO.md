# LAPORAN AUDIT KEAMANAN & KESIAPAN PRODUCTION — Trexio PWA + Backpacker

**Repo:** `github.com/fadliansyah36/Trexio-PWA-Full-AI-dan-Trexio-Backpacker`
**Peran auditor:** Senior Software Architect + Security Auditor (OWASP Top 10 / ASVS)
**Metode:** Analisis kode sumber langsung (berbasis bukti file:baris). Read-only, tanpa perubahan kode.
**Tanggal:** Juni 2026

---

## 1. EXECUTIVE SUMMARY

Trexio adalah marketplace adventure/open-trip berbasis **PWA React (frontend)** dengan **backend monolith Express** (`server.js`, **13.984 baris**), memakai **"database" file JSON** (`/data/*.json`) + array in-memory, serta integrasi **Gemini AI, Midtrans, Firebase Auth, 2FA (speakeasy)**, dan **Web Push**.

**Kondisi keseluruhan: BELUM LAYAK PRODUCTION (NOT GO-LIVE).** Ditemukan **6 kerentanan Critical** yang memungkinkan **pengambilalihan akun Super Admin** dan **penipuan pembayaran (booking/subscription gratis)** — keduanya berdampak langsung ke keamanan data user dan pendapatan bisnis.

**5 risiko terbesar (harus nol sebelum go-live):**
1. 🔴 **Backdoor master password** untuk semua akun Super Admin (`server.js:2842`).
2. 🔴 **Bypass verifikasi signature webhook Midtrans** → tandai order apa pun "PAID" (`server.js:12384, 12865`).
3. 🔴 **Endpoint `simulate-paid` aktif di produksi** → user bisa lunasi booking-nya sendiri gratis (`server.js:12788`).
4. 🔴 **JWT secret default hardcoded** → pemalsuan token bila env tak diset (`server.js:38`).
5. 🔴 **Kredensial admin lemah (`admin123`) di-hardcode & di-commit**, dipaksa ulang tiap boot (`server.js:145-299`, `data/db_users.json`).

Selain itu, **penyimpanan berbasis file JSON tidak layak produksi** (kehilangan data di filesystem ephemeral seperti Cloud Run, race condition, tidak bisa scale horizontal), dan terdapat **dua arsitektur backend paralel** (Express aktif + NestJS `src/` yang mati) yang menambah utang teknis.

---

## 2. TAHAP 1 — PEMETAAN STRUKTUR & ARSITEKTUR

### 2.1 Struktur folder (inti)
| Path | Peran | Status |
|---|---|---|
| `server.js` (13.984 baris) | **Backend nyata** (Express monolith) — `npm start` = `node server.js` | AKTIF |
| `src/` (NestJS: `main.ts`, `modules/*`, `database/*`, TypeORM) | Arsitektur NestJS TypeScript | **DEAD CODE / tidak dijalankan** |
| `src/ai/` | Engine AI (Gemini provider + 18 service + routes) | AKTIF (di-mount dari server.js) |
| `src/backpacker/` | Modul Backpacker (routes + store) | AKTIF |
| `src/db/cloudSqlSync.js` | Sync opsional ke Postgres (pg) | Parsial/opsional |
| `frontend/` | React 18 (CRA + CRACO), Tailwind, Radix/shadcn, framer-motion | AKTIF |
| `data/*.json` | **"Database" produksi** (users, bookings, payments, vendors, dll) | AKTIF (⚠️ ter-commit) |
| `public/service-worker.js`, `frontend/public/manifest.json` | PWA | AKTIF |
| `docs/*` (30+ register/runbook) | Dokumentasi governance | Ada |

### 2.2 Tech stack
- **Backend:** Node.js + Express 4, `bcryptjs`, `jsonwebtoken`, `express-rate-limit`, `speakeasy` (TOTP), `multer`, `midtrans-client`, `firebase-admin`.
- **Frontend:** React 18.3, react-router 6, TanStack Query + SWR, Tailwind 3, Radix UI, framer-motion, recharts, `@google/genai`.
- **AI:** Gemini via `@google/genai` (server-side).
- **Deploy target:** Cloud Run (`*.run.app` di-whitelist CORS).

### 2.3 Arsitektur
Monolith client-server. Backend = 1 file raksasa Express. Data disimpan sebagai array JavaScript in-memory yang di-`writeFileSync` ke file JSON. Ada niatan sinkron ke Cloud SQL (Postgres) namun bukan sumber kebenaran.

### 2.4 Alur data utama
- **Auth:** login → cek bcrypt → **(backdoor password)** → 2FA khusus super_admin → JWT di cookie `httpOnly` (7 hari).
- **Booking:** in-memory `bookings[]` → `db_bookings.json`.
- **Payment:** Midtrans Snap token → webhook `/api/payments/midtrans/notification` → update status. Ada juga `simulate-paid`.
- **AI:** `/api/ai/*` → GeminiProvider (server-side key).

### 2.5 Environment variable & secret
| Var | Dipakai di | Catatan |
|---|---|---|
| `JWT_SECRET` | `server.js:38` | ⚠️ ada fallback hardcoded |
| `MIDTRANS_SERVER_KEY / CLIENT_KEY / MERCHANT_ID / IS_PRODUCTION` | Midtrans | OK (env) |
| `GEMINI_API_KEY`, `AI_MODEL`, `AI_TIMEOUT` | `gemini-provider.js` | OK (server-side) |
| `ALLOWED_ORIGINS`, `NODE_ENV` | CORS | Lihat temuan CORS |
| `WA_API_URL/TOKEN`, `FONNTE_TOKEN`, `WABLAS_TOKEN` | Notifikasi WA | OK (env) |
| **`firebase-applet-config.json`** | Firebase (root + `frontend/src/`) | 🔴 **ter-commit** (apiKey, oAuthClientId) |

`.env` sudah benar di-`.gitignore` (baris 83-88). Namun `firebase-applet-config.json` **tidak** di-ignore dan berisi kunci.

---

## 3. TAHAP 2 & 3 — DAFTAR TEMUAN (diurutkan berdasarkan severity)

### 🔴 CRITICAL

#### C-1 — Backdoor Master Password Super Admin — OWASP A07 (Auth Failures)
- **Lokasi:** `server.js:2841-2848`
- **Bukti:**
  ```js
  // Backup master password acceptance for production super admins
  if (!isValid && (user.role === 'super_admin' || user.roles?.includes('super_admin'))) {
    if (['admin123', 'trexio123', 'SuperAdmin2026!', 'superadmin123'].includes(cleanPassword)) {
      isValid = true;
      user.password_hash = bcrypt.hashSync(cleanPassword, 10);
  ```
- **Dampak:** Siapa pun yang tahu salah satu dari 4 password ini bisa login sebagai **Super Admin** ke akun mana pun (email super admin diketahui publik dari kode). Pengambilalihan penuh platform.
- **Eksploitasi:** `POST /api/auth/login {"email":"superadmin@trexio.id","password":"admin123"}` → dapat sesi super_admin.
- **Mitigasi:** **HAPUS blok ini sepenuhnya.** Tidak boleh ada backup/master password. Gunakan flow reset password resmi.

#### C-2 — Bypass Signature Webhook Midtrans — OWASP A08/A04
- **Lokasi:** `server.js:12384` (fungsi) + `server.js:12865` (pemanggil)
- **Bukti:**
  ```js
  function verifyMidtransNotificationSignature(body, serverKey) {
    if (!serverKey || !body || !body.signature_key) return true;  // ← bila tak ada signature → dianggap VALID
  ...
  if (midtransConfig.server_key && signature_key) {   // ← signature hanya dicek bila keduanya ada
  ```
- **Dampak:** Attacker mengirim webhook **tanpa** `signature_key` → lolos verifikasi → order (booking / subscription / iklan) ditandai **PAID**. Penipuan pembayaran & pendapatan.
- **Eksploitasi:** `POST /api/payments/midtrans/notification {"order_id":"<order korban>","transaction_status":"settlement","status_code":"200","gross_amount":"..."}` tanpa signature.
- **Mitigasi:** Signature **wajib**. `return false` bila `signature_key` tidak ada; tolak (403) bila server_key belum dikonfigurasi. Verifikasi selalu, tanpa syarat.

#### C-3 — Endpoint `simulate-paid` aktif di produksi — OWASP A04 (Insecure Design)
- **Lokasi:** `server.js:12788`
- **Bukti:** `api.post('/payments/midtrans/simulate-paid/:booking_id', requireAuth, ...)` → memanggil `applyVerifiedPaymentStatus(booking, 'verified', 'confirmed', 'SIMULATION_TEST')`.
- **Dampak:** User terautentikasi bisa menandai **booking miliknya sendiri** sebagai lunas **tanpa membayar** → trip gratis.
- **Mitigasi:** Hapus di produksi, atau kunci ketat di balik flag `NODE_ENV!=='production'` **dan** role super_admin sandbox saja.

#### C-4 — JWT Secret Default Hardcoded — OWASP A02/A07
- **Lokasi:** `server.js:38`
- **Bukti:** `const JWT_SECRET = process.env.JWT_SECRET || 'trexio-secret-key-change-in-prod';`
- **Dampak:** Bila env tidak diset (mis. misconfig deploy), attacker tahu secret → memalsukan JWT super_admin.
- **Mitigasi:** Hilangkan fallback; **fail fast** bila `JWT_SECRET` kosong (`throw`/exit). Gunakan secret acak ≥32 byte.

#### C-5 — Kredensial Admin Lemah Hardcoded & Dipaksa Ulang — OWASP A07/A05
- **Lokasi:** `server.js:145-299` (seed + `loadUsersFromDisk`), `data/db_users.json` (ter-commit)
- **Bukti:** 4 akun super_admin dibuat dengan `bcrypt.hashSync('admin123', 10)`, dan blok "Mandatory Super Admin Promotion Enforcer" mem-reset role + password setiap boot. Hash asli ikut ter-commit di `data/db_users.json`.
- **Dampak:** Password `admin123` trivial; walau di-ganti, di-enforce ulang saat restart. Email admin diketahui publik.
- **Mitigasi:** Seed admin hanya sekali dari **env** (`SEED_ADMIN_EMAIL/PASSWORD`), password kuat acak, hapus enforcer, keluarkan `data/*.json` dari git.

#### C-6 — Endpoint AI Tanpa Auth & Tanpa Rate Limit (Cost Abuse) — OWASP A04 + Tahap 3.G
- **Lokasi:** `src/ai/routes/ai.routes.js:244` (`/orchestrate`), `:273` (`/assistant/chat`), `:71/193` (`/recommendations`), `:676` (`/safety/readiness`)
- **Bukti:** Rute-rute ini memanggil Gemini tetapi **tidak** memakai `authenticateToken` maupun limiter.
- **Dampak:** Siapa pun (anonim) bisa memanggil LLM tanpa batas → **biaya API membengkak / DoS finansial**. Juga vektor prompt-injection tanpa rate limit.
- **Mitigasi:** Wajibkan auth pada endpoint AI mahal + rate limit per-user (mis. 20/menit) + batas token per request + kuota harian per user.

---

### 🟠 HIGH

#### H-1 — Rate Limiter Praktis Nonaktif (Brute-force) — OWASP A07
- **Lokasi:** `server.js:2099-2137` — `globalApiLimiter`, `authLimiter`, `bookingLimiter` semua `max: 50000` / 15 menit.
- **Dampak:** Brute-force login & OTP tidak dicegah. Komentar kode: *"Extremely high threshold"*.
- **Mitigasi:** `authLimiter` → mis. `max: 10` / 15 menit per IP+email; tambah lockout bertahap.

#### H-2 — Cookie Auth Tanpa `Secure` & `SameSite` — OWASP A05
- **Lokasi:** `server.js:2785, 2937, 2990, 3187, 8421, 8503, 8568, 10649` — `res.cookie('access_token', token, { httpOnly: true, path: '/' })`.
- **Dampak:** Tanpa `Secure` → bisa terkirim via HTTP (MITM). Tanpa `SameSite` + `credentials:true` → risiko CSRF.
- **Mitigasi:** `{ httpOnly:true, secure:true, sameSite:'lax'/'strict', path:'/', maxAge }`.

#### H-3 — Data User + PII Ter-commit — OWASP A01/A02
- **Lokasi:** `data/db_users.json` (email, phone, hash bcrypt, activity_logs), plus `db_payments.json`, `db_bookings.json`, `db_billing_transactions.json`.
- **Dampak:** Kebocoran PII & hash yang bisa di-crack (password lemah) via repo publik.
- **Mitigasi:** Keluarkan seluruh `data/*.json` dari git, `.gitignore`-kan, rotasi kredensial, purge git history.

#### H-4 — Kunci Firebase Ter-commit — OWASP A05
- **Lokasi:** `firebase-applet-config.json` + `frontend/src/firebase-applet-config.json` (apiKey `AIza…PSao`, oAuthClientId).
- **Dampak:** Firebase web apiKey memang semi-publik, namun sebaiknya tidak di-commit; kombinasikan dengan pembatasan domain & App Check. oAuthClientId sebaiknya via env.
- **Mitigasi:** Pindah ke env, aktifkan restriksi HTTP referrer + Firebase App Check + aturan keamanan ketat.

#### H-5 — Kebocoran Detail Error ke Klien — OWASP A05
- **Lokasi:** 32 lokasi di `server.js` mengirim `err.message`; banyak rute AI mengirim `error: err.message`.
- **Dampak:** Bocornya struktur internal/stack ke penyerang.
- **Mitigasi:** Error generik ke klien + logging internal terstruktur; error handler terpusat.

#### H-6 — Penyimpanan File JSON = Risiko Kehilangan Data & Race Condition — OWASP A04
- **Lokasi:** `server.js:239-1203` (`writeFileSync`/`readFileSync` sinkron), seluruh `saveXToDisk`.
- **Dampak:** Di filesystem ephemeral (Cloud Run) **semua data hilang** saat container restart/scale. `writeFileSync` sinkron memblok event-loop & tak ada penguncian → korupsi data saat concurrent write. Tidak bisa multi-instance.
- **Mitigasi:** Migrasi ke DB sesungguhnya (Postgres via pg/drizzle yang sudah ada, atau MongoDB). Ini prasyarat go-live.

---

### 🟡 MEDIUM

- **M-1 — CSP lemah** (`server.js:125`): `'unsafe-inline' 'unsafe-eval'` melemahkan proteksi XSS. → perketat, hapus `unsafe-eval`, pakai nonce.
- **M-2 — CORS izinkan semua origin di non-production** (`server.js:96-98`): `if (NODE_ENV!=='production') return callback(null,true)`. Pastikan `NODE_ENV=production` di-set; hilangkan pintu ini.
- **M-3 — Body limit 50MB** (`server.js:105-106`): rawan DoS payload besar. → turunkan (mis. 1–2MB; upload lewat multer terpisah).
- **M-4 — Tanpa `helmet`**: header keamanan diset manual & tak lengkap (tak ada COOP/COEP/Permissions-Policy). → pakai `helmet`.
- **M-5 — PORT hardcoded 3000** (`server.js:37`): → `process.env.PORT`.
- **M-6 — Dead code NestJS `src/`**: dua arsitektur, membingungkan & memperbesar attack surface. → hapus atau konsolidasi ke satu.
- **M-7 — Fitur impersonation** (`server.js:1596`, cookie `imp_token`): pastikan audit ketat + secure/sameSite pada cookie ini.

### ⚪ LOW
- 23 `console.log` di server.js (logging bising, potensi bocor data di log). Gunakan logger leveled.
- `README.md` placeholder ("Here are your Instructions").
- 2FA hanya wajib untuk super_admin & baru dipicu jika user tak mengirim kode; alurnya perlu diperketat agar tak bisa di-skip.

---

## 4. TAHAP 4 — CHECKLIST KESIAPAN PRODUCTION PWA

| Item | Status | Catatan |
|---|---|---|
| `manifest.json` (name, icons, theme_color, display standalone, start_url) | ✅ | Lengkap & benar (`frontend/public/manifest.json`) |
| Service worker (versioning, skipWaiting, purge cache lama) | ✅ | Baik (`public/service-worker.js` v3.3.0) |
| SW tidak cache endpoint sensitif (api/auth/payment) | ✅ | Dikecualikan eksplisit (baris 121-132) |
| Offline fallback | ✅ | `/offline.html` |
| Add to Home Screen | ✅ | Manifest mendukung |
| Push notification origin validation | ⚠️ | Handler push tidak memvalidasi asal payload |
| Lighthouse audit | ❓ | **Limitasi audit** — tidak dijalankan (butuh runtime ter-deploy) |
| Error tracking (Sentry, dsb) | ❌ | Tidak ada |
| Health check endpoint | ✅ | Ada (mis. `/api/.../health`, monitoring listener) |
| CI/CD + test otomatis sebelum deploy | ⚠️ | Hanya `.github/workflows/security-sast.yml`; tak ada unit/integration test gate |
| Backup DB & Disaster Recovery | ❌ | Data = file JSON; tak ada backup nyata (runbook DR bersifat dokumen) |
| Staging terpisah dari production | ❓ | Tidak terlihat di repo |

---

## 5. TAHAP 5 — REKOMENDASI REFACTORING

1. **Pecah `server.js` (14k baris)** → modul: `routes/`, `services/`, `middleware/`, `data/` (repository). Satu file raksasa menyulitkan review keamanan & maintenance.
2. **Konsolidasi arsitektur:** pilih satu — pertahankan Express **atau** aktifkan NestJS `src/`. Hapus yang tidak dipakai (hilangkan dependency TypeORM/drizzle/pg yang menganggur bila tetap Express).
3. **Migrasi data layer** dari JSON file → Postgres/Mongo (repository pattern), pisahkan business logic vs data access.
4. **Tambah test** untuk modul kritikal (auth, payment/webhook, booking) — unit + integration + gate di CI.
5. **Hilangkan magic string** (daftar password, email admin) & duplikasi (`saveXToDisk` berulang).
6. **Dokumentasi:** perbarui `README.md`, sinkronkan `memory/PRD.md` (menyebut FastAPI+MongoDB, padahal realita Express+JSON) dengan arsitektur nyata; tambah diagram + API docs.

---

## 6. RENCANA AKSI PRIORITAS

### 🔴 BLOCKER — WAJIB sebelum production
| # | Aksi | Estimasi |
|---|---|---|
| 1 | Hapus backdoor master password (C-1) | 0.5 jam |
| 2 | Perbaiki verifikasi signature Midtrans wajib (C-2) | 2–3 jam |
| 3 | Hapus/kunci `simulate-paid` di produksi (C-3) | 1 jam |
| 4 | JWT_SECRET fail-fast tanpa fallback (C-4) | 0.5 jam |
| 5 | Seed admin dari env + password kuat, hapus enforcer (C-5) | 2 jam |
| 6 | Auth + rate limit + kuota token pada endpoint AI (C-6) | 3–4 jam |
| 7 | Keluarkan `data/*.json` & `firebase-applet-config.json` dari git + purge history + rotasi kunci (H-3, H-4) | 2 jam |
| 8 | **Migrasi ke DB nyata** (H-6) | 3–5 hari |

### 🟠 HIGH — sangat disarankan
| # | Aksi | Estimasi |
|---|---|---|
| 9 | Rate limiter realistis + lockout (H-1) | 1–2 jam |
| 10 | Cookie `secure` + `sameSite` (H-2) | 1 jam |
| 11 | Error handler terpusat, stop bocorkan err.message (H-5) | 2–3 jam |
| 12 | Perketat CSP, tambah helmet, pastikan NODE_ENV=production (M-1,2,4) | 2–3 jam |

### 🟢 NICE-TO-HAVE — pasca-launch
- Pecah monolith & hapus dead code (M-6) — 3–5 hari
- Integrasi Sentry + logging terstruktur — 1 hari
- CI gate test + staging environment — 2–3 hari
- Jalankan Lighthouse & optimasi performa — 1 hari

---

## 7. LIMITASI AUDIT
- **Lighthouse & runtime testing tidak dijalankan** (butuh instance ter-deploy). Skor PWA/Performance/A11y belum terukur.
- Analisis berbasis **snapshot repo publik** (3 commit, shallow). Riwayat git lama tidak sepenuhnya diperiksa.
- Endpoint yang bergantung env eksternal (Midtrans/Gemini/Firebase live) tidak diuji end-to-end.
- Bagian yang tidak bisa diverifikasi eksplisit ditandai ❓ pada checklist — **tidak diasumsikan aman**.
