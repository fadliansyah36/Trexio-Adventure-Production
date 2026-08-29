# TREXIO DATABASE MIGRATION REGISTER

| Migration ID | Applied Date | Description | Tables Created/Modified | Change Type | Risk Level | Staging Result | Production Result |
|---|---|---|---|---|---|---|---|
| `MIG_001_INIT_USERS` | 2026-08-10 | Initialize Users Table | `users` | CREATE TABLE | High | PASS | PASS |
| `MIG_002_INIT_VENDORS` | 2026-08-10 | Initialize Vendors & Verification Documents | `vendors` | CREATE TABLE | High | PASS | PASS |
| `MIG_003_INIT_TRIPS` | 2026-08-10 | Initialize Trips & Adventure Packages | `trips` | CREATE TABLE | High | PASS | PASS |
| `MIG_004_INIT_BOOKINGS` | 2026-08-10 | Initialize Bookings & Payment Gateway Refs | `bookings` | CREATE TABLE | Critical | PASS | PASS |
| `MIG_005_INIT_PAYMENTS` | 2026-08-10 | Initialize Payment Transactions Audit Table | `payment_transactions` | CREATE TABLE | Critical | PASS | PASS |
| `MIG_006_INIT_CONVERSATIONS` | 2026-08-10 | Initialize Communication Channels | `conversations` | CREATE TABLE | Medium | PASS | PASS |
| `MIG_007_INIT_MESSAGES` | 2026-08-10 | Initialize Chat Messages | `messages` | CREATE TABLE | Medium | PASS | PASS |
| `MIG_008_INIT_NOTIFICATIONS` | 2026-08-10 | Initialize In-App Notifications | `notifications` | CREATE TABLE | Low | PASS | PASS |
| `MIG_009_INIT_NEWS` | 2026-08-10 | Initialize News & Articles Table | `news` | CREATE TABLE | Low | PASS | PASS |
| `MIG_010_INIT_INTENTS` | 2026-08-10 | Initialize Backpacker Travel Intents | `travel_intents` | CREATE TABLE | Medium | PASS | PASS |
| `MIG_011_INIT_JOURNEYS` | 2026-08-10 | Initialize Backpacker Route Journeys | `journeys` | CREATE TABLE | Medium | PASS | PASS |
| `MIG_012_INIT_RIDES` | 2026-08-10 | Initialize Backpacker Transport Rides | `rides` | CREATE TABLE | Medium | PASS | PASS |
