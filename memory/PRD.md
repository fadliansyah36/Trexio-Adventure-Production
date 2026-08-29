# TREXIO — Product Requirement Document

## Original Problem Statement
Membangun platform TREXIO — marketplace open trip / adventure booking berbasis blueprint referensi open-trip.id. Mengambil kerangka UX, struktur informasi, dan pola funnel booking, tanpa mengambil identitas visual/brand referensi.

## Positioning
Marketplace trip adventure/open trip, booking outdoor experience, ekosistem eksplorasi dengan komunitas + trip + kebutuhan pendukung.

## Personas
- **Traveler / Petualang**: cari trip petualangan dengan mudah, transparan, aman.
- **Admin TREXIO**: kelola trip, verifikasi pembayaran manual, moderasi.
- **Organizer** (Phase 2+): kelola trip mereka sendiri.

## Core Requirements (MVP Hemat Credit)
1. Homepage discovery
2. Trip Listing / Explore + filter + sort
3. Trip Detail (gallery, itinerary, meeting point, sticky booking)
4. Booking multi-step (tanggal → jumlah peserta → data → meeting point)
5. Checkout (kupon, ringkasan, metode bayar)
6. Manual Payment Confirmation (upload bukti transfer)
7. Login / Register (JWT httpOnly cookies)
8. My Bookings (status tabs, detail booking)
9. Admin Dashboard (KPI + booking + payment verification + trip CRUD)

## Tech Stack
- Backend: FastAPI + Motor (MongoDB) + JWT (PyJWT) + bcrypt
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + Phosphor Icons
- Fonts: Cabinet Grotesk (heading) + Manrope (body)
- Theme: Earthy — bg #F7F5F0, primary terracotta #CC5A3F, secondary forest green #1E3F20

## Backend Structure (post-refactor)
```
/app/backend/
├── server.py       (63 lines — thin entry: app + CORS + include routers)
├── db.py           (mongo client + db + UPLOAD_DIR)
├── security.py     (JWT, bcrypt, cookies, deps get_current_user/get_admin_user)
├── schemas.py      (all Pydantic In-models)
├── seed.py         (seed_all: users/destinations/trips/coupons/communities/rentals)
└── routers/
    ├── auth.py         (/api/auth/*)
    ├── catalog.py      (/api/destinations, /api/trips, /api/coupons)
    ├── bookings.py     (/api/bookings/*)
    ├── community.py    (/api/communities/*, /api/community-posts/*, /api/community-events/*)
    ├── rental.py       (/api/rentals/*)
    ├── admin.py        (/api/admin/* except payments)
    └── payments.py     (/api/payments/midtrans/*)
```

## Enterprise Platform Roadmap (12 phases, in-progress)

### Phase 0 — Foundation ✅ COMPLETE (Feb 2026)
- `core/rbac.py` — 10-role hierarchy (Visitor→Member→Vendor family→Admin→Super Admin), permission matrix, `require_roles/require_permission/require_super_admin/require_admin` deps
- `core/tenant.py` — TenantCtx, `resolve_tenant()` (X-Tenant header → subdomain → custom domain), default tenant auto-seed
- `core/audit.py` — Fire-and-forget audit logger
- `core/ratelimit.py` — slowapi (500/min default) + custom 429 handler
- Security middleware: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- One-time `migrate_legacy_data()` on startup: adds `tenant_id` to 12 collections + `roles[]` to users (admin auto-elevated to super_admin)
- `security.clean_user()` now derives `roles[]` for backwards-compat

### Phase 1 — Multi-Tenant + Super Admin ✅ COMPLETE (Feb 2026)
- **Super Admin router** `/api/super/*` (protected by `require_super_admin()`):
  - `GET /stats` — global KPI (total_tenants, active_tenants, total_users, total_bookings, verified_bookings, total_revenue, total_domains, verified_domains)
  - `GET /tenants` + `POST /tenants` (slug validation: 3–40 chars, reserved set blocked, unique) + `GET /tenants/{id}` (with counts+domains) + `PATCH /tenants/{id}` + `DELETE /tenants/{id}` (guards default tenant)
  - `PATCH /tenants/{id}/branding` — logo, favicon, primary/secondary color, brand_name, tagline
  - `GET/POST/DELETE /tenants/{id}/domains` + `POST /tenants/{id}/domains/{did}/verify` — REAL DNS TXT lookup via `dnspython 2.6.1` (graceful fallback with dns_error field on failure)
  - `POST /users/{id}/assign-tenant` — Super Admin bisa migrate user antar tenant
- **Public tenant lookup** `GET /api/tenant/current` — no auth; resolved via Host header → subdomain → X-Tenant header → verified custom domain → default fallback
- **Frontend Super Panel** `/super/*` with dark themed layout:
  - Dashboard (KPI cards + tenant list)
  - Tenants (CRUD + inline delete confirmation + create modal)
  - Tenant Detail (info editor + branding editor with color pickers + domain manager with copy-to-clipboard TXT records + verify button)
- **Frontend TenantProvider** — fetches `/api/tenant/current` on mount, applies branding colors as CSS variables `--brand-primary`/`--brand-secondary`, updates document title + favicon
- **axios interceptor** — auto-injects `X-Tenant` header from `localStorage("trexio-tenant")` or subdomain
- **ProtectedRoute enhanced** — `superOnly`, `adminOnly`, `anyRole` props reading from user.roles[]
- **Startup migration idempotent** — ensures `default` tenant exists with full branding keys + unique indexes on `tenants.slug` and `tenant_domains.domain`
- **Audit trail** — every super admin mutation logged to `audit_logs` collection
- **Backend testing**: 32/32 pass on Phase 1 tests (`test_super_admin_tenants.py`); 115/116 full regression (1 pre-existing seat exhaustion, unrelated)

### Phase 2 — Multi-Vendor Foundation + Plan Gating ✅ COMPLETE (Feb 2026)
- **Plan matrix** (`core/plans.py`): Free (1 vendor, 5 trip/vendor, 0 domain, Rp0), Pro (5 vendor, 25 trip/vendor, 1 domain, Rp199k/bln), Enterprise (unlimited + white-label, custom price). `check_vendor_quota()`, `check_trip_quota()`, `check_domain_quota()` helpers enforce limits on onboarding and domain add.
- **6 vendor types**: organizer, guide, merchant, rental, community, event_org — user picks 1+ during onboarding, roles are auto-synced (type→user.roles append).
- **Vendor router `/api/vendor/*`** — `POST /onboard` (4-step wizard: types, brand+contact, legal+NIK+alamat, payout bank), `GET/PATCH /me`, `POST /me/documents/{ktp|izin_usaha}` (multipart, 5MB cap, image/pdf only), `GET /products`, `GET /bookings`, `GET /plan`. Products & bookings 403 until status='verified'.
- **Super Admin moderation** (`/api/super/vendors/*`): list with filter, detail with enriched user email, verify/reject (with reason)/suspend actions. Web push notification sent to vendor owner on approve/reject. Full audit log trail.
- **Seed migration**: `ensure_official_vendor()` creates "TREXIO Official" verified vendor and back-fills `vendor_id` on all existing trips (idempotent, safe on restart).
- **Frontend Vendor Panel** `/vendor/*` — status-aware layout (pending banner, rejected banner with reason, verified with unlocked products/bookings), 4-step onboarding wizard with type selector cards + inline validation, profile editor with document upload widget, dashboard with stats + plan usage bars, products catalog, bookings table.
- **Frontend Super Vendors** page — filter tabs (all/pending/verified/rejected/suspended), detail modal with all KYC/payout info, KTP+izin document viewer, verify/reject/suspend actions.
- **Navbar CTA** — "Jadi Mitra" for non-vendors, "Vendor Panel" for existing vendors, "Super Panel" for super_admin.
- **Testing**: 32/32 Phase 2 tests + 32/32 Phase 1 = **64/64 pass**. 1 Phase 1 test fixture auto-corrected by tester for domain-quota alignment.

### Phases 3-12 — PLANNED (RBAC enforcement, Marketplace full, Booking engine, Payment expanded, Wallet+Subscription, CMS, Communication, Reviews, Analytics, Enterprise Security)

## Implemented (Feb 2026)
- JWT auth (register/login/logout/me) with httpOnly cookies + admin seeding
- Trip catalog with search/filter/sort + featured/detail
- Booking creation with participant list, coupon, meeting point, seat reservation
- Manual payment proof upload (multipart, stored in /uploads)
- **Midtrans Snap payment gateway** (sandbox) — VA/GoPay/QRIS/ShopeePay/CC all-in-one popup, webhook with SHA512 signature verification, status polling endpoint
- **Community module** — 6 seed komunitas, join/leave, feed (post + like), events (create + RSVP), admin CRUD
- **Rental module** — 10 seed alat outdoor, filter kategori & lokasi pickup, order rental terpisah dari trip, my-rentals dashboard, admin CRUD + order status management
- **PWA (Progressive Web App)** — installable manifest + service worker (offline shell + cache-first static + network-first navigation), offline fallback page, icons 192/512, install prompt banner
- **Web Push Notifications** — VAPID-based subscribe/unsubscribe/broadcast/test endpoints (pywebpush), user opt-in card di MyBookings, admin broadcast API
- **Homepage layout mirror open-trip.id** — hero tab switcher (Open Trip / Private Tur / Rental Gear / Komunitas), trust strip, destinasi wisata grid, open trip grid, rental teaser, private tur, trending destinations, travel articles, CTA banner
- My Bookings + booking detail
- Admin: stats, booking queue, payment verify, trip CRUD, community CRUD, rental CRUD + order management
- 6 seed trips + 4 destinations + 2 kupon + 6 komunitas + 10 rental
- Modular backend structure (server.py 63 lines + db/security/schemas/seed + 8 routers)

## Backlog (P1/P2)
- Midtrans production keys (currently sandbox)
- Razorpay integration (deferred)
- Rental as add-on saat booking trip
- Community role/moderation
- Wishlist, review system
- Password reset flow
- WhatsApp/email notification
- Countdown push (H-3, H-1 keberangkatan) — butuh scheduler
- Harden `ObjectId()` parsing di admin router → 404 alih-alih 500
- Wishlist, review system
- Password reset flow
- Compare trip
- Organizer dashboard
- Advanced reporting
- Refund/reschedule center
- Notification center

---

## Security Remediation Log — Juni 2026 (6 Blocker CRITICAL) ✅

Hasil audit read-only ditindaklanjuti dengan perbaikan 6 kerentanan Critical. Diverifikasi testing_agent (20/20 backend tests PASS, 100%).

- **C-1 Backdoor password** dihapus dari `server.js` (login super admin) — 4 master password ditolak 401.
- **C-2 Webhook Midtrans** — `verifyMidtransNotificationSignature` kini wajib; request tanpa/invalid signature ditolak (403), 503 bila server key belum dikonfigurasi.
- **C-3 `simulate-paid`** — dinonaktifkan (404) kecuali `ALLOW_PAYMENT_SIMULATION=true`.
- **C-4 JWT_SECRET** — fail-fast (exit) bila tidak diset / < 32 char; fallback hardcoded dihapus.
- **C-5 Admin seed** — password dari `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (env); wajib di production; `admin123` yang lemah dihapus; dump `data/*.json` + `firebase-applet-config.json` dikeluarkan dari git (`.gitignore` + `git rm --cached`).
- **C-6 Endpoint AI** — `authenticateToken` + rate limit (`aiChatLimiter` 20/5m, `aiLimiter` 60/5m) pada `/ai/orchestrate`, `/ai/assistant/chat`, `/ai/safety/readiness` (+ rate limit pada recommendations).

### Production config — Supabase PostgreSQL (siap, migrasi data masih pending)
- `.env.example` lengkap (JWT, SEED_ADMIN, `DATABASE_URL` Supabase pooler + SSL, Midtrans, Gemini, CORS, flags).
- `src/db/cloudSqlSync.js` — pool opt-in, dukung `DATABASE_URL` + SSL (Supabase), no-op bila DB tak dikonfigurasi.
- `src/db/index.ts` & `drizzle.config.ts` — dukung `DATABASE_URL` + SSL untuk migrasi drizzle-kit.
- Runtime dijalankan `node server.js` (env-driven), `.env` dev disiapkan.

### Backlog keamanan tersisa (setelah HIGH batch)
- ✅ **H-1** rate limiter realistis (auth max 15 gagal/15m + `skipSuccessfulRequests` → 429; global 1000; booking 40) — verified 429 after 15
- ✅ **H-2** cookie `httpOnly + secure(prod) + sameSite=lax + maxAge` di 8 titik access_token + imp_token
- ✅ **H-5** error handler terpusat (`app.use('/api', errHandler)`) + seluruh `err.message` pada response (server.js 32 + ai.routes 78 + varian lain) diganti pesan generik; `console.error` internal dipertahankan
- ✅ **Booking checkout** — harga & diskon kupon dihitung server-side (client `total_amount` diabaikan); auth guard 401; diverifikasi (1.700.000 utk 2 pax, 765.000 dgn TREXIO10)
- ✅ **M-1 CSP diperketat** — `script-src 'self' 'nonce-<per-request>' 'strict-dynamic'` (tanpa `unsafe-inline`/`unsafe-eval`); nonce disuntik ke `<script>/<style>` index.html; ditambah `object-src 'none'`, `frame-ancestors 'self'`, `base-uri 'self'`, `Permissions-Policy`, COOP, HSTS
- ✅ **Hardening login & hardcode** — sisa `admin123` (enforcer) → `SEED_ADMIN_PASSWORD`; demo vendor/traveler → `SEED_VENDOR_PASSWORD`/`SEED_DEMO_PASSWORD` (fallback dev); admin-create-user default `trexio123` → password acak; register: email regex + password ≥ 8 + dedupe
- ✅ **Keamanan checkout Midtrans** — signature webhook wajib (503/403), validasi `gross_amount == total_amount` (anti-fraud), harga/diskon server-side (klien `total_amount` diabaikan)
- ⏳ **H-6 migrasi data JSON → Supabase** (prasyarat go-live; config siap)
- ⏳ purge git history kredensial lama; (opsional) style-src nonce/hash; pecah monolith 14k baris; rate limiter per-user utk endpoint authenticated mahal

