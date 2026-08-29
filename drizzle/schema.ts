import { pgTable, index, unique, pgPolicy, serial, text, timestamp, jsonb, integer, varchar, numeric, foreignKey, boolean, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	uid: text().notNull(),
	email: text().notNull(),
	name: text(),
	role: text().default('user'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	supabaseUid: text("supabase_uid"),
	data: jsonb().default({}),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_users_supabase_uid").using("btree", table.supabaseUid.asc().nullsLast().op("text_ops")),
	unique("users_uid_key").on(table.uid),
	pgPolicy("service_role_all_users", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const bookings = pgTable("bookings", {
	id: serial().primaryKey().notNull(),
	bookingCode: text("booking_code").notNull(),
	userId: integer("user_id"),
	vendorId: varchar("vendor_id", { length: 100 }),
	tripId: integer("trip_id"),
	totalAmount: numeric("total_amount").notNull(),
	paymentStatus: text("payment_status").default('pending'),
	bookingStatus: text("booking_status").default('pending_payment'),
	paymentMethod: text("payment_method"),
	paymentChannel: text("payment_channel"),
	midtransOrderId: text("midtrans_order_id"),
	midtransToken: text("midtrans_token"),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_bookings_booking_code").using("btree", table.bookingCode.asc().nullsLast().op("text_ops")),
	index("idx_bookings_payment_status").using("btree", table.paymentStatus.asc().nullsLast().op("text_ops")),
	index("idx_bookings_trip_id").using("btree", table.tripId.asc().nullsLast().op("int4_ops")),
	index("idx_bookings_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("idx_bookings_vendor_id").using("btree", table.vendorId.asc().nullsLast().op("text_ops")),
	unique("bookings_booking_code_key").on(table.bookingCode),
	pgPolicy("service_role_all_bookings", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const paymentTransactions = pgTable("payment_transactions", {
	id: serial().primaryKey().notNull(),
	txId: text("tx_id").notNull(),
	bookingCode: text("booking_code").notNull(),
	orderId: text("order_id").notNull(),
	amount: numeric().notNull(),
	status: text().default('pending'),
	paymentType: text("payment_type"),
	transactionId: text("transaction_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payment_tx_booking_code").using("btree", table.bookingCode.asc().nullsLast().op("text_ops")),
	index("idx_payment_tx_order_id").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	unique("payment_transactions_tx_id_key").on(table.txId),
	pgPolicy("service_role_all_payment_transactions", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const conversations = pgTable("conversations", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 100 }).notNull(),
	userName: text("user_name"),
	vendorId: varchar("vendor_id", { length: 100 }).notNull(),
	vendorName: text("vendor_name"),
	productId: text("product_id"),
	productTitle: text("product_title"),
	bookingId: text("booking_id"),
	bookingCode: text("booking_code"),
	lastMessage: text("last_message"),
	status: varchar({ length: 50 }).default('active'),
	unreadUserCount: integer("unread_user_count").default(0),
	unreadVendorCount: integer("unread_vendor_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_conversations_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_conversations_vendor_id").using("btree", table.vendorId.asc().nullsLast().op("text_ops")),
	pgPolicy("service_role_all_conversations", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const messages = pgTable("messages", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	conversationId: varchar("conversation_id", { length: 100 }).notNull(),
	senderId: varchar("sender_id", { length: 100 }).notNull(),
	senderRole: varchar("sender_role", { length: 50 }).default('user'),
	senderName: text("sender_name"),
	text: text().notNull(),
	read: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_messages_conversation_id").using("btree", table.conversationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("service_role_all_messages", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const notifications = pgTable("notifications", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	recipientId: varchar("recipient_id", { length: 100 }).notNull(),
	recipientRole: varchar("recipient_role", { length: 50 }).default('user'),
	title: text().notNull(),
	message: text().notNull(),
	type: varchar({ length: 50 }).default('info'),
	read: boolean().default(false),
	link: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_recipient").using("btree", table.recipientId.asc().nullsLast().op("text_ops"), table.recipientRole.asc().nullsLast().op("text_ops")),
	pgPolicy("service_role_all_notifications", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const news = pgTable("news", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	title: text().notNull(),
	slug: text(),
	content: text().notNull(),
	author: text().default('Admin TREXIO'),
	category: varchar({ length: 50 }).default('Umum'),
	published: boolean().default(true),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_news", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const travelIntents = pgTable("travel_intents", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 100 }).notNull(),
	destination: text().notNull(),
	travelDate: date("travel_date"),
	budget: numeric(),
	activities: text().array(),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_travel_intents", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const journeys = pgTable("journeys", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	creatorId: varchar("creator_id", { length: 100 }).notNull(),
	title: text().notNull(),
	destination: text().notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_journeys", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appPayments = pgTable("app_payments", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_payments", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appRentals = pgTable("app_rentals", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_rentals", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appDestinations = pgTable("app_destinations", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_destinations", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appCommunities = pgTable("app_communities", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_communities", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appCoupons = pgTable("app_coupons", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_coupons", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appTenants = pgTable("app_tenants", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_tenants", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appAnnouncements = pgTable("app_announcements", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_announcements", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appConversations = pgTable("app_conversations", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_conversations", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appMessages = pgTable("app_messages", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_messages", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appAdvertisingPackages = pgTable("app_advertising_packages", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_advertising_packages", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appAdvertisingCampaigns = pgTable("app_advertising_campaigns", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_advertising_campaigns", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appSubscriptionPlans = pgTable("app_subscription_plans", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_subscription_plans", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appTenantSubscriptions = pgTable("app_tenant_subscriptions", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_tenant_subscriptions", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const vendors = pgTable("vendors", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 100 }),
	brandName: text("brand_name").notNull(),
	slug: text(),
	status: varchar({ length: 50 }).default('active'),
	rating: numeric().default('5.0'),
	totalTrips: integer("total_trips").default(0),
	documents: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_vendors_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_vendors_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	pgPolicy("service_role_all_vendors", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const trips = pgTable("trips", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	destination: text().notNull(),
	price: numeric().notNull(),
	durationDays: integer("duration_days").default(1),
	availableSeats: integer("available_seats").default(10),
	category: text(),
	vendorId: varchar("vendor_id", { length: 100 }),
	slug: text(),
	status: varchar({ length: 50 }).default('published'),
	coverImage: text("cover_image"),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_trips_destination").using("btree", table.destination.asc().nullsLast().op("text_ops")),
	index("idx_trips_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_trips_vendor_id").using("btree", table.vendorId.asc().nullsLast().op("text_ops")),
	pgPolicy("service_role_all_trips", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const rides = pgTable("rides", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	creatorId: varchar("creator_id", { length: 100 }).notNull(),
	origin: text().notNull(),
	destination: text().notNull(),
	departureTime: timestamp("departure_time", { mode: 'string' }),
	totalSeats: integer("total_seats").default(4),
	availableSeats: integer("available_seats").default(4),
	pricePerSeat: numeric("price_per_seat").default('0'),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_rides", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appTrips = pgTable("app_trips", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_trips", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appVendors = pgTable("app_vendors", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_vendors", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appBookings = pgTable("app_bookings", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_bookings", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appBillingTransactions = pgTable("app_billing_transactions", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_billing_transactions", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appAuditLogs = pgTable("app_audit_logs", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_audit_logs", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appIncidents = pgTable("app_incidents", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_incidents", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appReviews = pgTable("app_reviews", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_reviews", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appArticles = pgTable("app_articles", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_articles", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appHomepageConfig = pgTable("app_homepage_config", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_homepage_config", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appMasterCategories = pgTable("app_master_categories", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_master_categories", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appMasterLocations = pgTable("app_master_locations", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_master_locations", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);

export const appMasterRoles = pgTable("app_master_roles", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("service_role_all_app_master_roles", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
]);
