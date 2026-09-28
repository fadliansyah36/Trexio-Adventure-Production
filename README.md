# TREXIO Adventure Platform & Backpacker Hub

Production-ready Open Trip Marketplace, Outdoor Gear Rental, Backpacker Matching, and Multi-Tenant SaaS Platform for Indonesian Adventure Operators.

---

## 1. System Architecture Overview

TREXIO operates as a high-performance full-stack web application designed for cloud-native deployment:

- **Frontend**: React 18 (PWA with offline capabilities, Tailwind CSS, Radix UI, Lucide icons, responsive navigation).
- **Backend API Layer**: Node.js & Express Monolith (`server.js`) with modular service layers:
  - `src/ai/`: Google Gemini AI Multi-Service Intelligence Engine.
  - `src/backpacker/`: Multi-modal transit routing, buddy matching, and live journey tracking.
  - `src/db/`: Supabase PostgreSQL connection and database governance.
- **Database Engine (Single Source of Truth)**: Supabase PostgreSQL via the `pg` connection pool and `@supabase/supabase-js`.
- **Payment Gateway**: Midtrans Snap & Core API with SHA-512 notification signature verification.
- **AI / LLM Engine**: Official `@google/genai` TypeScript/JavaScript SDK with PostgreSQL data grounding.
- **Authentication & RBAC**: Supabase Auth + the active Express/JWT authorization runtime with 10 discrete roles (`user`, `vendor`, `admin`, `super_admin`, `guide`, `driver`, `renter`, `backpacker`, `agent`, `staff`) with server-side middleware guards.

---

## 2. Environment Variables & Secret Configuration

Copy `.env.example` to `.env` and supply production values:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=<SUPABASE_POSTGRES_CONNECTION_STRING>
SUPABASE_URL=https://<REF>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_PROJECT_REF=<REF>

# Authentication
JWT_SECRET=<STRONG_RANDOM_SECRET>

# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=<SERVER_KEY>
MIDTRANS_CLIENT_KEY=<CLIENT_KEY>
MIDTRANS_MERCHANT_ID=<MERCHANT_ID>
MIDTRANS_IS_PRODUCTION=false # Set to true for live environment

# Google Gemini AI
GEMINI_API_KEY=<GEMINI_API_KEY>
AI_MODEL=gemini-2.5-flash
AI_TIMEOUT=30000

# Frontend Client Config (.env in frontend/)
REACT_APP_SUPABASE_URL=https://<REF>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<ANON_KEY>
REACT_APP_MIDTRANS_CLIENT_KEY=<CLIENT_KEY>
REACT_APP_MIDTRANS_IS_PRODUCTION=false
```

---

## 3. Getting Started & Development

### Installation
```bash
npm install
cd frontend && npm install && cd ..
```

### Verification & Security Scans
```bash
# Automated integrity verification
npm run verify-integrity

# Automated SAST & security compliance scan
npm run security-scan
```

### Running the Application
```bash
# Build frontend
npm run build

# Start backend server (Port 3000)
npm start
```

---

## 4. API Reference Summary

### System & Health
- `GET /api/system/health`: Live health status across Supabase PostgreSQL, Midtrans Gateway, and Gemini AI.
- `GET /api/monitoring/metrics`: System performance metrics, active connections, and latency telemetry.
- `GET /api/dr/status`: Disaster Recovery & Business Continuity status.

### Authentication (`/api/auth`)
- `POST /api/auth/register`: User registration with email/password.
- `POST /api/auth/login`: User login returning HTTP-only JWT.
- `GET /api/auth/me`: Fetch authenticated user profile and roles.
- `POST /api/auth/logout`: Invalidate session and clear auth cookies.

### Trips & Marketplace (`/api/trips`)
- `GET /api/trips`: List and search available open trips with multi-tenant filtering.
- `GET /api/trips/:id`: Retrieve detailed trip itinerary, pricing, and quota.
- `POST /api/trips`: Create new trip listing (Vendor/Admin role required).

### Bookings & Payments (`/api/bookings`, `/api/payments`)
- `POST /api/bookings`: Create a new trip booking with real-time seat locking.
- `GET /api/bookings/my`: List user's active and historical bookings.
- `POST /api/payments/midtrans/snap-token`: Generate Midtrans Snap payment token.
- `POST /api/payments/midtrans/notification`: Midtrans webhook endpoint with mandatory SHA-512 signature verification.

### Backpacker Hub (`/api/backpacker`)
- `POST /api/backpacker/routes/search`: Multi-modal transit route calculation.
- `POST /api/backpacker/intents`: Publish travel intent and match with travel buddies.
- `POST /api/backpacker/journeys/track`: Update live journey coordinates with explicit user location consent.

### AI Multi-Agent Services (`/api/ai`)
- `POST /api/ai/assistant/chat`: AI adventure concierge with real-time trip grounding.
- `POST /api/ai/copilot/vendor`: Vendor copilot for pricing optimization and itinerary generation.
- `POST /api/ai/growth/insights`: Business intelligence recommendations for platform administrators.

---

## 5. Disaster Recovery & Business Continuity

- Backup, PITR, and recovery targets are governed by the active Supabase project configuration and Trexio recovery runbooks.
- **Integrity Guarantee**: Production business persistence uses Supabase PostgreSQL; local SQLite/JSON persistence is not a production source of truth.
