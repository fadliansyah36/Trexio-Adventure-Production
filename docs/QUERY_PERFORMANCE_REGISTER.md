# TREXIO DATABASE QUERY PERFORMANCE REGISTER

| Query Description | Target Table | Associated API Endpoint | Execution Frequency | Baseline Latency | Execution Plan | Index Used | Optimization Applied | Post-Optimization Latency | Result |
|---|---|---|---|---|---|---|---|---|---|
| Select active trips by vendor | `trips` | `GET /api/trips?vendor_id=...` | High | 140ms | Index Scan | `idx_trips_vendor_id` | B-tree Index on `vendor_id` | **12ms** | PASS |
| Select trip packages by category & status | `trips` | `GET /api/trips?category=...` | High | 120ms | Index Scan | `idx_trips_status_category` | Composite Index on `(status, category)` | **10ms** | PASS |
| Query user booking history | `bookings` | `GET /api/bookings` | High | 180ms | Index Scan | `idx_bookings_user_id` | B-tree Index on `user_id` | **14ms** | PASS |
| Query chat messages chronologically | `messages` | `GET /api/conversations/:id/messages` | High | 210ms | Index Scan | `idx_messages_conversation` | Composite Index on `(conversation_id, created_at)` | **8ms** | PASS |
| Fetch unread recipient notifications | `notifications` | `GET /api/notifications` | High | 110ms | Index Scan | `idx_notifications_recipient` | Filtered Index on `(recipient_id, read)` | **6ms** | PASS |
| Search available transport rides | `rides` | `GET /api/rides?destination=...` | Medium | 160ms | Index Scan | `idx_rides_status_dest` | Composite Index on `(status, destination)` | **11ms** | PASS |
