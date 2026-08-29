import { pgTable, text, jsonb, timestamp, varchar, numeric, integer, unique, serial, foreignKey, boolean, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const appArticles = pgTable("app_articles", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

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
});

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
	unique("users_uid_key").on(table.uid),
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
});

export const appReviews = pgTable("app_reviews", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

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
	unique("bookings_booking_code_key").on(table.bookingCode),
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
	unique("payment_transactions_tx_id_key").on(table.txId),
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
});

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
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_fkey"
		}).onDelete("cascade"),
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
});

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
});

export const travelIntents = pgTable("travel_intents", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 100 }).notNull(),
	destination: text().notNull(),
	travelDate: date("travel_date"),
	budget: numeric(),
	activities: text().array(),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const appVendors = pgTable("app_vendors", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const journeys = pgTable("journeys", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	creatorId: varchar("creator_id", { length: 100 }).notNull(),
	title: text().notNull(),
	destination: text().notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

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
});

export const appTrips = pgTable("app_trips", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appBookings = pgTable("app_bookings", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appBillingTransactions = pgTable("app_billing_transactions", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appPayments = pgTable("app_payments", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appRentals = pgTable("app_rentals", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appDestinations = pgTable("app_destinations", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appCommunities = pgTable("app_communities", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appCoupons = pgTable("app_coupons", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appTenants = pgTable("app_tenants", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appAnnouncements = pgTable("app_announcements", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appConversations = pgTable("app_conversations", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appAdvertisingPackages = pgTable("app_advertising_packages", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appMessages = pgTable("app_messages", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appSubscriptionPlans = pgTable("app_subscription_plans", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appTenantSubscriptions = pgTable("app_tenant_subscriptions", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appAdvertisingCampaigns = pgTable("app_advertising_campaigns", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appAuditLogs = pgTable("app_audit_logs", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appIncidents = pgTable("app_incidents", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appHomepageConfig = pgTable("app_homepage_config", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appMasterCategories = pgTable("app_master_categories", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appMasterLocations = pgTable("app_master_locations", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const appMasterRoles = pgTable("app_master_roles", {
	id: text().primaryKey().notNull(),
	data: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});
