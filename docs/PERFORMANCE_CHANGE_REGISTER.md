# TREXIO PERFORMANCE CHANGE REGISTER

| Change ID | Date | Affected Feature | Change Description | Metric Before | Metric After | Latency Gain | Connection Impact | Error Rate | Infrastructure Cost Impact | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `PCR-2026-001` | 2026-08-10 | Cloud SQL Indexing | Added B-tree composite indexes across core FKs (`trips`, `bookings`, `messages`, `rides`, `notifications`) | 160ms average query latency | 12ms average query latency | **-92% Query Time** | Reduced connection hold duration | 0% | $0 (Included in Cloud SQL) | Deployed & Certified |
| `PCR-2026-002` | 2026-08-10 | PostgreSQL Connection Pool | Set `max: 10` connections per Express instance with explicit client release | Pool exhaustion on peak spikes | Stable 1-3 active connections | **-40ms Connection Wait** | Connection saturation prevented | 0% | $0 | Deployed & Certified |
| `PCR-2026-003` | 2026-08-10 | Atomic Seat Decrement | Replaced read-then-write ride join logic with atomic SQL transaction `UPDATE rides SET available_seats = available_seats - 1 WHERE available_seats > 0` | Overbooking risk on concurrent joins | 100% Atomic seat decrement | **-25ms Transaction Time** | Reduced lock contention | 0% | $0 | Deployed & Certified |
