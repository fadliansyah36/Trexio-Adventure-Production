import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

// Users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Trips table
export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  destination: text('destination').notNull(),
  price: numeric('price').notNull(),
  durationDays: integer('duration_days').default(1),
  availableSeats: integer('available_seats').default(10),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tripId: integer('trip_id').references(() => trips.id),
  totalAmount: numeric('total_amount').notNull(),
  paymentStatus: text('payment_status').default('pending'),
  bookingStatus: text('booking_status').default('pending_payment'),
  paymentMethod: text('payment_method'),
  paymentChannel: text('payment_channel'),
  midtransOrderId: text('midtrans_order_id'),
  midtransToken: text('midtrans_token'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Transactions table
export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  txId: text('tx_id').notNull().unique(),
  bookingCode: text('booking_code').notNull(),
  orderId: text('order_id').notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').default('pending'),
  paymentType: text('payment_type'),
  transactionId: text('transaction_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  bookings: many(bookings),
}));
