# TREXIO ARCHITECTURE CHANGE REGISTER

| Change ID | Date | Affected Component | Previous State | New Optimized State | Architectural Reason | Benchmark / Metric Validation | Rollback Plan | Status |
|---|---|---|---|---|---|---|---|---|
| `ACR-2026-001` | 2026-08-10 | Primary Business Database | Dual read/write between `db.json` and PostgreSQL | **100% Google Cloud SQL PostgreSQL Primary** | Enforce single source of truth and ACID compliance | 0% JSON fallbacks detected; 100% database persistence | Restore PostgreSQL snapshot | Deployed & Certified |
| `ACR-2026-002` | 2026-08-10 | Database Indexing Strategy | Unindexed foreign key lookups | **12 Performance B-Tree Composite Indexes** | Eliminate sequential scans across `trips`, `bookings`, `messages`, `notifications`, `rides` | Average query latency reduced from 160ms to 12ms (-92%) | Drop composite indexes via SQL script | Deployed & Certified |
| `ACR-2026-003` | 2026-08-10 | Ride Seat Allocation | Non-atomic read-then-update logic | **Atomic PostgreSQL Row-Level Transaction** | Prevent overbooking and concurrent seat allocation race conditions | 100% atomic deduction under concurrent join tests | Revert service logic | Deployed & Certified |
| `ACR-2026-004` | 2026-08-10 | Observability & DR | Unmonitored connection pools | **Integrated Governance, DR, and Performance Endpoints** | Provide real-time health monitoring and automated failover detection | `/api/monitoring/status`, `/api/dr/status`, `/api/performance/status` operational | Disable API monitoring middleware | Deployed & Certified |
