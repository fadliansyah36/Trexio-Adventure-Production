# TREXIO DEPENDENCY RECOVERY REGISTER

| Dependency Service | Category | Failure Mode | Impact on Trexio | Fallback / Recovery Mechanism | Recovery Owner | Current Status |
|---|---|---|---|---|---|---|
| Google Cloud SQL (PostgreSQL 18.3) | Primary Business Database | Instance Crash / Socket Timeout / Network Isolation | Critical (All read/write operations affected) | Automated failover to HA standby; PITR backup restore | DBA_ROLE | OPERATIONAL |
| Firebase Authentication | Identity Provider | Auth Service Outage / OAuth Verification Failure | Critical (User login & session verification down) | Serve cached JWT tokens for active sessions; block new logins gracefully | Security_Role | OPERATIONAL |
| Midtrans Payment Gateway | Payment Gateway | Webhook API Outage / Payment Gateway Failure | Critical (Checkout payment confirmation delayed) | Midtrans webhook queue & retry mechanism; background API reconciliation job | Backend_Role | OPERATIONAL |
| Cloud Storage (GCS) | Media Assets | Image / Document Upload Failure | Medium (Trip cover images & vendor KTP document upload fails) | Serve fallback CDN images; retry document upload on queue recovery | Backend_Role | OPERATIONAL |
| AI Matching & Recommendation Engine | AI Feature | Gemini API rate limit or outage | Low (Backpacker buddy matching recommendations slow) | Fallback to heuristic/location-based SQL matching query in PostgreSQL | Backend_Role | OPERATIONAL |
