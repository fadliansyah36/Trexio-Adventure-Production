# TREXIO DATABASE DATA DICTIONARY

**Database System**: Google Cloud SQL (PostgreSQL 18.3)  
**Database Name**: `cloud_sql_development_database`  

---

### 1. TABLE: `users`
Primary entity for registered users, customers, vendors, and admins.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `INTEGER` | NO | `nextval('users_id_seq')` | PK | Internal | Internal sequence ID |
| `uid` | `TEXT` | NO | None | Unique | Private | Firebase Auth User Unique ID |
| `email` | `TEXT` | NO | None | - | PII | User email address |
| `name` | `TEXT` | YES | None | - | PII | User full display name |
| `role` | `TEXT` | YES | `'user'` | - | Internal | User access role (`user`, `vendor`, `admin`, `super_admin`) |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Public | Account creation timestamp |

---

### 2. TABLE: `vendors`
Verified adventure tour operators and service providers.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Internal | Unique vendor identifier |
| `user_id` | `VARCHAR(100)` | YES | None | - | Private | Associated user account ID |
| `brand_name` | `TEXT` | NO | None | - | Public | Commercial brand/business name |
| `slug` | `TEXT` | YES | None | - | Public | URL-friendly unique identifier |
| `status` | `VARCHAR(50)` | YES | `'active'` | - | Internal | Verification status (`active`, `pending`, `suspended`) |
| `rating` | `NUMERIC` | YES | `5.0` | - | Public | Average vendor rating |
| `total_trips` | `INT` | YES | `0` | - | Public | Total published packages count |
| `documents` | `JSONB` | YES | `'{}'` | - | Private/PII | Verification legal documents (KTP, NIB, APGI/BNSP certs) |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Public | Registration timestamp |

---

### 3. TABLE: `trips`
Adventure tour packages and trip offerings.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `INTEGER` | NO | `nextval('trips_id_seq')` | PK | Public | Unique trip identifier |
| `title` | `TEXT` | NO | None | - | Public | Trip package title |
| `destination` | `TEXT` | NO | None | - | Public | Destination location |
| `price` | `NUMERIC` | NO | None | - | Public | Price per person (IDR) |
| `duration_days` | `INT` | YES | `1` | - | Public | Trip duration in days |
| `available_seats` | `INT` | YES | `10` | - | Public | Remaining seat quota |
| `category` | `TEXT` | YES | None | - | Public | Trip category (`Open Trip`, `Private Trip`, `Hiking`, etc.) |
| `vendor_id` | `VARCHAR(100)` | YES | None | FK -> `vendors.id` | Public | Owning vendor identifier |
| `slug` | `TEXT` | YES | None | - | Public | URL slug |
| `status` | `VARCHAR(50)` | YES | `'published'` | - | Internal | Listing status (`published`, `draft`, `archived`) |
| `cover_image` | `TEXT` | YES | None | - | Public | Main display image URL |
| `description` | `TEXT` | YES | None | - | Public | Detailed itinerary & description |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Public | Creation timestamp |

---

### 4. TABLE: `bookings`
Transaction records for trip reservations.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `INTEGER` | NO | `nextval('bookings_id_seq')` | PK | Private | Unique booking record ID |
| `booking_code` | `TEXT` | NO | None | Unique | Private | Unique human-readable booking code (e.g. `TRX-2026-XXXX`) |
| `user_id` | `INTEGER` | YES | None | FK -> `users.id` | Private | Customer user ID |
| `vendor_id` | `VARCHAR(100)` | YES | None | FK -> `vendors.id` | Private | Target vendor ID |
| `trip_id` | `INTEGER` | YES | None | FK -> `trips.id` | Private | Reserved trip ID |
| `total_amount` | `NUMERIC` | NO | None | - | Private | Total transaction amount (IDR) |
| `payment_status` | `TEXT` | YES | `'pending'` | - | Private | Payment status (`pending`, `paid`, `cancelled`, `failed`) |
| `booking_status` | `TEXT` | YES | `'pending_payment'` | - | Private | Reservation status (`pending_payment`, `confirmed`, `completed`) |
| `payment_method` | `TEXT` | YES | None | - | Private | Payment method used (`QRIS`, `Bank Transfer`, `Credit Card`) |
| `payment_channel` | `TEXT` | YES | None | - | Private | Specific channel (`BCA`, `Mandiri`, `GoPay`) |
| `midtrans_order_id` | `TEXT` | YES | None | - | Sensitive | Midtrans payment gateway order reference |
| `midtrans_token` | `TEXT` | YES | None | - | Sensitive | Midtrans payment snap transaction token |
| `paid_at` | `TIMESTAMP` | YES | None | - | Private | Payment completion timestamp |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Private | Reservation timestamp |
| `updated_at` | `TIMESTAMP` | YES | `now()` | - | Private | Last status update timestamp |

---

### 5. TABLE: `payment_transactions`
Payment gateway ledger and webhook events audit table.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `INTEGER` | NO | `nextval('payment_transactions_id_seq')` | PK | Sensitive | Payment log entry ID |
| `tx_id` | `TEXT` | NO | None | Unique | Sensitive | Unique internal transaction identifier |
| `booking_code` | `TEXT` | NO | None | FK -> `bookings.booking_code` | Sensitive | Linked booking code |
| `order_id` | `TEXT` | NO | None | - | Sensitive | Gateway transaction order reference |
| `amount` | `NUMERIC` | NO | None | - | Sensitive | Transaction monetary amount |
| `status` | `TEXT` | YES | `'pending'` | - | Sensitive | Transaction state (`pending`, `settlement`, `expire`, `deny`) |
| `payment_type` | `TEXT` | YES | None | - | Sensitive | Gateway payment type code |
| `transaction_id` | `TEXT` | YES | None | - | Sensitive | External gateway transaction reference |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Sensitive | Creation timestamp |
| `updated_at` | `TIMESTAMP` | YES | `now()` | - | Sensitive | Status update timestamp |

---

### 6. TABLE: `conversations`
Chat channels between users and vendors.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Private | Conversation channel ID |
| `user_id` | `VARCHAR(100)` | NO | None | - | Private | Customer user ID |
| `user_name` | `TEXT` | YES | None | - | Private | Customer display name |
| `vendor_id` | `VARCHAR(100)` | NO | None | FK -> `vendors.id` | Private | Vendor ID |
| `vendor_name` | `TEXT` | YES | None | - | Private | Vendor brand name |
| `product_id` | `TEXT` | YES | None | - | Private | Related trip ID |
| `product_title` | `TEXT` | YES | None | - | Private | Related trip title |
| `booking_id` | `TEXT` | YES | None | - | Private | Related booking ID |
| `booking_code` | `TEXT` | YES | None | - | Private | Related booking code |
| `last_message` | `TEXT` | YES | None | - | Private | Snippet of latest message |
| `status` | `VARCHAR(50)` | YES | `'active'` | - | Internal | Channel status (`active`, `archived`) |
| `unread_user_count` | `INT` | YES | `0` | - | Private | Unread messages count for customer |
| `unread_vendor_count` | `INT` | YES | `0` | - | Private | Unread messages count for vendor |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Private | Creation timestamp |
| `updated_at` | `TIMESTAMP` | YES | `now()` | - | Private | Last activity timestamp |

---

### 7. TABLE: `messages`
Individual chat messages inside a conversation.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Private | Message ID |
| `conversation_id` | `VARCHAR(100)` | NO | None | FK -> `conversations.id` | Private | Owning conversation ID |
| `sender_id` | `VARCHAR(100)` | NO | None | - | Private | Sender user ID |
| `sender_role` | `VARCHAR(50)` | YES | `'user'` | - | Private | Role of sender (`user`, `vendor`, `system`) |
| `sender_name` | `TEXT` | YES | None | - | Private | Display name of sender |
| `text` | `TEXT` | NO | None | - | Private | Message body content |
| `read` | `BOOLEAN` | YES | `false` | - | Private | Read status flag |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Private | Sent timestamp |

---

### 8. TABLE: `notifications`
System and in-app user notifications.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Private | Notification ID |
| `recipient_id` | `VARCHAR(100)` | NO | None | - | Private | Target user ID |
| `recipient_role` | `VARCHAR(50)` | YES | `'user'` | - | Private | Target recipient role |
| `title` | `TEXT` | NO | None | - | Private | Notification header title |
| `message` | `TEXT` | NO | None | - | Private | Notification body text |
| `type` | `VARCHAR(50)` | YES | `'info'` | - | Private | Category (`booking`, `payment`, `chat`, `system`) |
| `read` | `BOOLEAN` | YES | `false` | - | Private | Read status flag |
| `link` | `TEXT` | YES | None | - | Private | Target UI route/action link |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Private | Created timestamp |

---

### 9. TABLE: `news`
Articles, announcements, and adventure stories.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Public | Article ID |
| `title` | `TEXT` | NO | None | - | Public | Article headline |
| `slug` | `TEXT` | YES | None | - | Public | Article URL slug |
| `content` | `TEXT` | NO | None | - | Public | Article body content |
| `author` | `TEXT` | YES | `'Admin TREXIO'` | - | Public | Author name |
| `category` | `VARCHAR(50)` | YES | `'Umum'` | - | Public | Article category |
| `published` | `BOOLEAN` | YES | `true` | - | Public | Visibility flag |
| `published_at` | `TIMESTAMP` | YES | `now()` | - | Public | Publication timestamp |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Public | Creation timestamp |

---

### 10. TABLE: `travel_intents`
Trexio Backpacker user travel preferences and companion requests.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Private | Intent ID |
| `user_id` | `VARCHAR(100)` | NO | None | FK -> `users.uid` | Private | Creator user ID |
| `destination` | `TEXT` | NO | None | - | Public | Desired travel destination |
| `travel_date` | `DATE` | YES | None | - | Public | Planned travel date |
| `budget` | `NUMERIC` | YES | None | - | Public | Budget ceiling (IDR) |
| `activities` | `TEXT[]` | YES | None | - | Public | List of preferred activities |
| `status` | `VARCHAR(50)` | YES | `'active'` | - | Internal | Status (`active`, `matched`, `closed`) |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Public | Creation timestamp |

---

### 11. TABLE: `journeys`
Backpacker multi-destination trip itineraries and route sharing.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Public | Journey ID |
| `creator_id` | `VARCHAR(100)` | NO | None | - | Private | Journey author user ID |
| `title` | `TEXT` | NO | None | - | Public | Journey title |
| `destination` | `TEXT` | NO | None | - | Public | Key destination |
| `start_date` | `DATE` | YES | None | - | Public | Start date |
| `end_date` | `DATE` | YES | None | - | Public | End date |
| `status` | `VARCHAR(50)` | YES | `'active'` | - | Public | Status (`active`, `completed`) |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Public | Creation timestamp |

---

### 12. TABLE: `rides`
Backpacker ride sharing & local transport pooling offers.

| Column | Type | Nullable | Default | PK/FK | Sensitivity | Description |
|---|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | None | PK | Public | Ride offer ID |
| `creator_id` | `VARCHAR(100)` | NO | None | - | Private | Vehicle driver/host user ID |
| `origin` | `TEXT` | NO | None | - | Public | Departure location |
| `destination` | `TEXT` | NO | None | - | Public | Arrival location |
| `departure_time` | `TIMESTAMP` | YES | None | - | Public | Scheduled departure time |
| `total_seats` | `INT` | YES | `4` | - | Public | Total passenger capacity |
| `available_seats` | `INT` | YES | `4` | - | Public | Remaining open seats |
| `price_per_seat` | `NUMERIC` | YES | `0` | - | Public | Cost sharing amount per seat |
| `status` | `VARCHAR(50)` | YES | `'active'` | - | Public | Status (`active`, `full`, `completed`) |
| `created_at` | `TIMESTAMP` | YES | `now()` | - | Public | Creation timestamp |
