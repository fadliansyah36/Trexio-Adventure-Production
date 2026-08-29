# TREXIO PERFORMANCE BOTTLENECK REGISTER

| Bottleneck ID | System / Component | Query / Endpoint | Current Latency | Frequency | Impact | Root Cause | Optimization / Fix Applied | Expected Improvement | Actual Improvement | Risk Level | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `PBN-001` | Cloud SQL / Marketplace | `GET /api/trips?vendor_id=...` | 140ms | High | Trip filtering slow for vendor dashboards | Sequential scan on `trips.vendor_id` without index | Created B-tree index `idx_trips_vendor_id` | Latency < 15ms | **12ms (-91%)** | Low | Resolved |
| `PBN-002` | Cloud SQL / Booking | `GET /api/bookings?user_id=...` | 180ms | High | User booking history loading delay | Full table scan on `bookings` table | Created composite B-tree index `idx_bookings_user_id` | Latency < 20ms | **14ms (-92%)** | Low | Resolved |
| `PBN-003` | Cloud SQL / Chat | `GET /api/conversations/:id/messages` | 210ms | High | Chat message list scrolling lag | Unindexed message timeline sorting | Created composite index `idx_messages_conversation(conversation_id, created_at)` | Latency < 10ms | **8ms (-96%)** | Low | Resolved |
| `PBN-004` | Cloud SQL / Notifications | `GET /api/notifications?recipient_id=...` | 110ms | High | Unread notification count badge delay | Full scan on `notifications` table | Created filtered index `idx_notifications_recipient(recipient_id, read)` | Latency < 10ms | **6ms (-94%)** | Low | Resolved |
| `PBN-005` | Cloud SQL / Backpacker | `GET /api/rides?destination=...` | 160ms | Medium | Transport ride search delay | Sequential scan on ride route filter | Created B-tree index `idx_rides_status_dest(status, destination)` | Latency < 15ms | **11ms (-93%)** | Low | Resolved |
