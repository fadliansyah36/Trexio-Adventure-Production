# Panduan Kontribusi & Aturan Permanen Trexio

Dokumen ini memuat aturan tata kelola permanen dan standar pengembangan untuk repositori **Trexio**. Aturan ini mengikat secara mutlak bagi setiap pengembang manusia, CI/CD pipeline, maupun AI coding agent (Claude, Gemini, Antigravity, Copilot, dll).

---

## 1. Aturan Wajib & Kebijakan Nol-Toleransi

### 1.1. Basis Data Tunggal: Supabase PostgreSQL
- Seluruh penyimpanan data persisten **WAJIB** terhubung ke **Supabase PostgreSQL** menggunakan environment variable resmi (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, dll).
- **DILARANG KERAS**:
  - Menginisialisasi basis data lokal (SQLite, NeDB, LowDB, LevelDB, dll).
  - Menyimpan data transaksional ke file JSON atau file disk lokal sebagai pengganti database.
  - Membuat *in-memory mock store* permanen untuk mengelabui tes.
- Apabila terjadi kegagalan koneksi database, pengembang/AI agent **WAJIB** melaporkannya sebagai *blocker*, bukan membuat database lokal tiruan.

### 1.2. Kebijakan Anti-Mock Data
- **DILARANG KERAS** membuat atau menyuntikkan mock data, dummy data, data simulasi, atau *hardcoded values* untuk menggantikan integrasi nyata.
- Integrasi Payment Gateway (**Midtrans**) dan AI/LLM (**@google/genai**) harus membaca kredensial dari environment variable (`MIDTRANS_SERVER_KEY`, `GEMINI_API_KEY`), bukan simulasi statis di lingkungan produksi.

### 1.3. Larangan Pengalihan Arsitektur Tanpa Izin
- Tidak diperkenankan mengganti atau mendesain ulang fondasi teknologi utama (seperti mengganti Midtrans dengan gateway lain, mengganti Supabase dengan ORM/DB lain) tanpa persetujuan eksplisit dari *project owner*.

---

## 2. Pemeriksaan Otomatis Sebelum Pull / Push (Automated CI/CD Gate)

Repositori Trexio dilengkapi pemeriksaan otomatis yang akan **GAGAL (FAIL / BLOCKED)** di pipeline GitHub Actions (`.github/workflows/security-sast.yml`) maupun pre-push hook jika terdeteksi salah satu dari kondisi berikut:

1. **Deteksi Database Lokal / Terlarang**: Penggunaan driver `sqlite3`, `better-sqlite3`, `nedb`, `lowdb`, atau string koneksi `sqlite://`, `postgres://localhost`.
2. **Deteksi Hardcoded Secret**: Kunci privat, API key, atau token rahasia yang tertulis langsung di kode sumber.
3. **Deteksi Pola Mock Data**: File mock terlarang atau pemalsuan respon API.
4. **Pelanggaran SAST / Keamanan**: SQL injection string concatenation, bypass auth, atau unsafe DOM rendering.

### Menjalankan Pemeriksaan Secara Lokal:
```bash
# 1. Jalankan pemeriksaan integritas arsitektur & database
npm run verify-integrity

# 2. Jalankan pemindaian SAST & secret scanner
npm run security-scan

# 3. Jalankan verifikasi lengkap sebelum push
npm run pre-push
```

---

## 3. Format Pelaporan Perubahan (Commit / Turn Summary)

Setiap pengajuan perubahan wajib menyertakan ringkasan terstruktur:
1. **Daftar File yang Diubah**
2. **Alasan / Kebutuhan Perubahan**
3. **Konfirmasi Dampak / Efek Samping** terhadap modul lain di ekosistem Trexio.
