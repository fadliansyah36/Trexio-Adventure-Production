# TREXIO FEATURE DEPENDENCY MATRIX

| Feature Name | Primary Service Module | Critical Dependency | Secondary Dependency | Degraded Mode Plan | Failure Isolation Boundary | Owner Role |
|---|---|---|---|---|---|---|
| User Sign-in & Profile | Auth Module | Firebase Authentication | PostgreSQL `users` table | Serve cached JWT tokens for active sessions; disable profile updates | Auth failure blocks login but keeps trip catalog readable | Security_Role |
| Trip Marketplace Search | Catalog Module | PostgreSQL `trips` & `vendors` | CDN Media Assets | Serve cached trip catalog listings from memory/CDN | Catalog outage isolates booking engine; displays maintenance message | Backend_Role |
| Booking & Checkout | Booking Module | PostgreSQL `bookings` table | Transactional Row Lock | Disable checkout submit button; queue active pending orders | Booking outage does not impact existing confirmed bookings view | Backend_Role |
| Payment Confirmation | Payment Module | Midtrans Payment Gateway | PostgreSQL `payment_transactions` | Midtrans queues webhooks; automated reconciliation job on recovery | Payment failure isolates order confirmation without corrupting ledger | Backend_Role |
| Backpacker Companion Match | Backpacker Module | PostgreSQL `travel_intents` | AI Recommendation Engine | Fallback to location-based heuristic matching query in PostgreSQL | Matching engine failure does not affect core adventure marketplace | Backend_Role |
| Ride Sharing & Seat Join | Transport Module | PostgreSQL `rides` table | Atomic Transaction Lock | Reject new join requests gracefully; preserve active rides | Overbooking prevented atomically via SQL constraints | Backend_Role |
| Vendor Chat & Messages | Messaging Module | PostgreSQL `conversations` & `messages` | Push Notification Engine | Queue outgoing chat messages; retry on connection restore | Chat outage does not impact booking status or vendor inventory | Backend_Role |
