# Mission 09B — Trexio Business Architecture Alignment & Domain Boundary Mapping

Status: COMPLETE
Scope: Architecture discovery and domain-boundary mapping only
Predecessor: Mission 09A — Current Repository Architecture Discovery
Next: Mission 09C — Monorepo Architecture Refactor

## 1. Objective
Translate the current Trexio implementation into explicit business domains and technical boundaries before physical repository refactoring. No application source was moved, renamed, or deleted in this mission.

Target architecture:
WEB / ADMIN / VENDOR / SUPER ADMIN / BACKPACKER
                    |
                    v
               TREXIO API
                    |
                    v
                 SUPABASE

Frontend applications must not become database clients. Database access remains an API/backend responsibility.

## 2. Business Domain Map

### Marketplace / Discovery
Public marketplace capabilities include Home, Explore, Categories, Destinations, Trip Detail, Rentals, Vendor Storefront, Search, Promotions, Articles, Reviews, and Safety.
Representative pages: Home.jsx, Explore.jsx, CategoryPage.jsx, Destinations.jsx, DestinationDetail.jsx, TripDetail.jsx, Rentals.jsx, RentalDetail.jsx, Storefront.jsx, Promos.jsx, Articles.jsx, Reviews.jsx.
Target application: apps/web.

### Commerce / Booking / Payment
Customer commerce includes cart, booking, checkout, payment confirmation, booking history, transactions, wishlist, wallet, messages, and support.
Representative pages: Cart.jsx, Booking.jsx, Checkout.jsx, PaymentConfirmation.jsx, MyBookings.jsx, UserTransactions.jsx, Wallet.jsx, Wishlist.jsx, UserMessages.jsx, UserSupport.jsx.
Established backend repositories: src/repositories/bookingRepository.js and src/repositories/paymentRepository.js.
Primary relational entities: public.bookings and public.payment_transactions.
Payment provider credentials and payment persistence remain backend-only.

### Vendor / Partner
Vendor capabilities include onboarding, profile, product management, bookings, customers, finance, promotions, analytics, communications, community, and AI Copilot.
Representative pages: VendorDashboard.jsx, VendorOnboard.jsx, VendorProfile.jsx, VendorProducts.jsx, VendorBookings.jsx, VendorCustomers.jsx, VendorFinance.jsx, VendorPromotions.jsx, VendorAnalytics.jsx, VendorCommunications.jsx, VendorCommunity.jsx, VendorAICopilot.jsx.
Backend repositories: vendorRepository.js and tripRepository.js.
Primary relational entities: public.vendors and public.trips.

### Tenant / Agency SaaS
Trexio contains a SaaS-style tenant layer: storefronts, public preview, subscriptions, custom domains, branding, page builder, templates, navigation, SEO, analytics, settings, advertising, and billing.
Representative areas: TenantPublicPreview.jsx and frontend/src/pages/admin/website/* plus TenantSubscription.jsx.
Target domain: Tenant / Agency SaaS.
This domain is logically separate from the consumer marketplace even when delivered by the same PWA during the monorepo phase.

### Backpacker / Adventure Social & Journey
Backend module: src/backpacker/routes.js and src/backpacker/store.js. Frontend service: frontend/src/services/backpackerService.js. Main surface: BackpackerDashboard.jsx.
Capabilities include profile, travel intents, buddy matching, connections, assistance requests, guided recommendations, shared rides, journeys, journey stops, location consent, journey locations, expenses, cost splitting, booking references, route search, and local transport.
Location, contact, booking-reference ownership, and eligibility validation remain server responsibilities.

### Community / Social / Moderation
Community surfaces include Communities.jsx, CommunityDetail.jsx, CommunityDiscussion.jsx, vendor community, and super-admin community operations.
Server-side concepts include members, posts, comments, events, bookmarks, reports, moderation logs, suspended users, and categories.
Target domain: Community / Social / Moderation.
Cross-domain access must use explicit service contracts rather than private repository internals.

### AI / Intelligence
Dedicated module: src/ai with routes, services, providers, and types.
Observed services cover orchestration, assistant, data, evaluation, events, feature flags, growth intelligence, homepage ranking, recommendation configuration, recommendation engine, risk, security, SEO, smart search, super-admin command center, usage, vendor copilot, and adventure intelligence.
API mount: /api/ai/*.
Target domain: AI Platform / Intelligence.
AI may consume domain data through application/service contracts but must not become an alternative persistence layer.

### Identity / Access
Authentication is represented by src/auth/supabaseAuth.js plus frontend AuthContext and ProtectedRoute.
Current model: Supabase Auth as identity provider, application user records in PostgreSQL, and application JWT/RBAC behavior in Express.
Roles visible in routing include user, vendor, partner, admin, platform_admin, and super_admin.
Target domain: Identity / Access / RBAC. Authentication is cross-cutting infrastructure.

### Admin
An explicit admin application boundary already exists at /admin/* with AdminLayout.jsx.
Capabilities include dashboard, bookings, payments, trips, communities, rentals, subscriptions, website builder/configuration, and AI command/risk/growth panels.
Target application: apps/admin.
Admin is an application boundary, not merely a route prefix.

### Super Admin / Platform Operations
An explicit platform boundary exists at /super/*.
Capabilities include master data, tenants, vendors, subscriptions, advertising, billing requests, website platform, payments, customer care, security, AI control, SEO, community, backpacker operations, and settings.
Target domain: Platform Operations / Super Admin.

## 3. Backend Boundary
The current production runtime remains root server.js. Express exposes /api and /api/v1.
Newer modular boundaries already exist for AI, Backpacker, authentication, middleware, and repositories, while many legacy/business routes remain in server.js.
Target: apps/api becomes the explicit backend application boundary.
Preferred logical modules: auth, marketplace, commerce, vendors, tenants, community, backpacker, ai, admin, platform.

## 4. Persistence Boundary
Current repositories: appDocumentRepository.js, bookingRepository.js, paymentRepository.js, tripRepository.js, vendorRepository.js.
Relational repositories are established for booking, payment, trip, and vendor.
appDocumentRepository.js remains a transitional JSONB compatibility boundary for non-core domains.
Preferred direction:
Route/Controller -> Application Service -> Domain Repository -> Supabase PostgreSQL.
Frontend direction:
React/PWA -> API client -> HTTP API -> Backend -> Repository -> Supabase.

## 5. Database Mapping
Core relational entities include users, vendors, trips, bookings, and payment_transactions.
Supporting relational/application entities include conversations, messages, journeys, rides, travel_intents, news, and notifications.
Generic app_* compatibility tables cover areas such as advertising, billing, announcements, articles, audit logs, communities, conversations, coupons, destinations, homepage configuration, incidents, master data, messages, rentals, reviews, subscriptions, and tenants.
Booking/payment compatibility tables have entered the Mission 08 retirement workflow. Their historical presence in migration files must not be treated as proof of runtime dependency.

## 6. Domain Dependency Matrix
| Domain | Frontend | Backend | Persistence | Target |
|---|---|---|---|---|
| Marketplace | public pages | marketplace API | trips/vendors + future catalog | web |
| Commerce | booking/cart/checkout | commerce API | bookings/payments | web |
| Vendor | /vendor/* | vendor API | vendors/trips | web/vendor boundary |
| Tenant SaaS | storefront/admin website | tenant API | tenant/subscription/config | web/admin |
| Backpacker | /backpacker | src/backpacker | journey/rides/intents | web |
| Community | community pages | community API | community data | web |
| AI | discovery + AI panels | src/ai | AI events/config/usage | api + web/admin |
| Identity | auth pages/context | src/auth | Supabase Auth + users | shared |
| Admin | /admin/* | admin API | operational data | admin |
| Platform | /super/* | platform API | master/platform data | admin |

## 7. Shared Contract Candidates
packages/types: User, Role, Vendor, Trip, Rental, Booking, Payment, Tenant, Community, Backpacker Profile, Journey, AI Recommendation, API Error, Pagination, Audit metadata.
packages/validation: authentication, booking, checkout, vendor, trip/product, tenant configuration, community content, journey/location payloads.
packages/api-client: typed endpoint clients, authentication/session handling, API errors, pagination, request metadata.
packages/ui: only genuinely reusable presentation components. Domain-specific admin/vendor components remain in their application boundary.

## 8. Dependency Rules
Allowed: web/admin -> api-client/types/validation/ui; api -> domain modules; domain -> repositories; repository -> database; AI -> application/domain contracts.
Not allowed: web/admin/vendor UI -> direct Supabase; shared UI -> business repositories; AI UI -> direct database; domain A -> private implementation of domain B.
Cross-domain communication must use explicit application services/contracts.

## 9. Physical Repository Mapping
Current: frontend/, server.js, src/, supabase/, scripts/, docs/, backend/ residual, drizzle/ historical/typed artifacts.
Target: apps/web, apps/admin, apps/api, packages/types, packages/validation, packages/api-client, packages/ui, packages/config, supabase, tests, docs.
Mapping: frontend public surface -> apps/web; frontend/src/pages/admin -> apps/admin; frontend/src/pages/super -> apps/admin platform area; server.js -> apps/api; src/ai -> API AI module; src/backpacker -> API Backpacker module; src/auth -> API auth module; src/repositories and src/db -> API persistence boundary.
No source files are moved by Mission 09B.

## 10. Boundary Classification
Stable and clearly identifiable: Identity/Auth, Commerce, Payment, Vendor, Trip, AI, Backpacker, Admin, Super Admin/Platform.
Logical but transitional: Community, Tenant SaaS, Content/SEO, Rentals, Notifications/Messaging, Advertising/Billing, Master Data.
Requires later domain migration work: User relational cutover, generic app_* retirement, unified content, rental relational model, community relational model, tenant/subscription relational model, messaging/notification architecture.

## 11. Current Architectural Tensions
1. Root server.js remains the largest coupling point. Mission 09C should extract modules incrementally.
2. Frontend contains multiple logical applications. Preserve boundaries first, then extract build/application boundaries.
3. appDocumentRepository remains transitional. Do not delete until each collection has a verified replacement or retirement decision.
4. Supabase migrations are the schema authority; historical Drizzle and custom tooling must not become competing migration authorities.
5. Domain persistence maturity is uneven. Booking/payment/vendor/trip are farther along than other domains.

## 12. Locked Invariants
1. Frontend never owns database persistence.
2. Admin is an application boundary.
3. Super Admin is a platform-operations boundary.
4. Vendor is a business domain, not merely an admin role.
5. Backpacker is an explicit API-owned domain.
6. AI is an intelligence layer, not a second persistence layer.
7. Payment secrets remain backend-only.
8. Repositories own persistence mechanics.
9. Cross-domain communication uses explicit contracts.
10. Legacy compatibility stores are not automatically active domains.
11. No source deletion without verified usage/provenance.
12. Monorepo separation must preserve runtime behavior before repository extraction.
13. Final repository extraction occurs only after standalone build and E2E integrity gates.

## 13. Result
Business domains identified: PASS.
Frontend application surfaces identified: PASS.
Admin boundary identified: PASS.
Super Admin/platform boundary identified: PASS.
Backend module boundaries identified: PASS.
Repository/persistence boundaries identified: PASS.
Database/domain mapping identified: PASS.
Shared contract candidates identified: PASS.
Refactor invariants documented: PASS.
Source movement/deletion: NO — intentional.

Mission 09B status: COMPLETE.

## 14. Next Mission
Mission 09C — Monorepo Architecture Refactor.
The next mission is the first physical restructuring mission. It must establish apps/web, apps/admin, apps/api and packages/* while preserving behavior. It must begin with dependency-aware migration and must not blindly move server.js or frontend directories without updating import, build, and runtime boundaries.

The repository remains a monorepo during development. Independent repository extraction occurs only after standalone build, API contract, deployment, and E2E integrity gates are satisfied.