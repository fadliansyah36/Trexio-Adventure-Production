# TREXIO BUSINESS CONTINUITY REGISTER

| Service / Function | Business Criticality | RTO Target | RPO Target | Degraded Mode Plan | Recovery Priority | Owner Role | Runbook Ref | Current Status |
|---|---|---|---|---|---|---|---|---|
| User Authentication & Identity | CRITICAL (Tier 1) | 15 Mins | 0 Mins | Preserve active sessions via Firebase Auth tokens; block new signups if DB down | Priority 1 | Security_Role | `RB-001` | OPERATIONAL |
| Adventure Marketplace Catalog | CRITICAL (Tier 1) | 15 Mins | 5 Mins | Serve static read-only trip listings from cached CDN/Redis | Priority 2 | Backend_Role | `RB-001` | OPERATIONAL |
| Booking Engine & Reservations | CRITICAL (Tier 1) | 15 Mins | 1 Min | Pause new checkout forms; display maintenance notification; queue active orders | Priority 2 | Backend_Role | `RB-001` / `RB-003` | OPERATIONAL |
| Payment Gateway Webhook Ledger | CRITICAL (Tier 1) | 15 Mins | 0 Mins | Midtrans queues webhooks; automated replay upon DB recovery | Priority 2 | Backend_Role | `RB-003` | OPERATIONAL |
| Vendor Dashboard & Inventory | HIGH (Tier 2) | 30 Mins | 5 Mins | Read-only inventory view for vendors; delay new product creation | Priority 3 | Backend_Role | `RB-001` | OPERATIONAL |
| Backpacker Matching & Rides | HIGH (Tier 2) | 30 Mins | 5 Mins | Pause new companion match connections & ride bookings; maintain active journeys | Priority 3 | Backend_Role | `RB-006` | OPERATIONAL |
| Vendor Chat & Messaging | MEDIUM (Tier 3) | 60 Mins | 15 Mins | Queue chat messages; send email/SMS notification fallback | Priority 4 | Backend_Role | `RB-001` | OPERATIONAL |
| In-App Notifications | LOW (Tier 4) | 120 Mins | 30 Mins | Queue notification events; batch dispatch on recovery | Priority 5 | Backend_Role | `RB-001` | OPERATIONAL |
