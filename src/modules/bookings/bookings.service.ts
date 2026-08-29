import { Injectable, ForbiddenException } from '@nestjs/common';
import { BookingEntity } from '../../core/entities/domain.entities';
import { CreateBookingDto } from '../../core/dtos';

@Injectable()
export class BookingsService {
  private bookings: BookingEntity[] = [
    {
      id: 'book_demo_01',
      user_id: 'user_me',
      trip_id: 'trip_1',
      trip_title: 'Open Trip Gunung Rinjani 4D3N Via Sembalun',
      participants_count: 2,
      total_price: 4900000,
      status: 'verified',
      payment_method: 'bank_transfer',
      created_at: new Date().toISOString(),
    },
  ];

  private paymentTransactions: any[] = [];

  async getMyBookings(userId: string): Promise<BookingEntity[]> {
    return this.bookings;
  }

  async getBookingById(id: string): Promise<BookingEntity | null> {
    return this.bookings.find((b) => b.id === id) || null;
  }

  async handleBooking(userId: string, dto: CreateBookingDto, userRole: string = 'USER'): Promise<any> {
    const role = (userRole || 'USER').toUpperCase();
    if (role !== 'USER' && role !== 'CUSTOMER') {
      throw new ForbiddenException("Akses Ditolak: Hanya pengguna dengan role 'USER' yang diizinkan untuk membuat reservasi/booking.");
    }

    const bookingId = `book_${Date.now()}`;
    const bookingCode = `TRX-${Date.now().toString(36).toUpperCase()}`;
    const totalAmount = 2450000 * (dto.participants_count || 1);

    // Initialize status to 'AWAITING_PAYMENT' for the booking
    const newBooking: BookingEntity = {
      id: bookingId,
      user_id: userId,
      trip_id: dto.trip_id,
      trip_title: 'Trip Pendakian Gunung',
      participants_count: dto.participants_count || 1,
      total_price: totalAmount,
      status: 'AWAITING_PAYMENT',
      payment_method: dto.payment_method || 'transfer',
      created_at: new Date().toISOString(),
    };

    // Initialize status to 'PENDING' for the payment record before processing
    const paymentRecord = {
      id: `pay_${Date.now()}`,
      booking_id: bookingId,
      booking_code: bookingCode,
      user_id: userId,
      amount: totalAmount,
      payment_method: dto.payment_method || 'transfer',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    this.bookings.push(newBooking);
    this.paymentTransactions.push(paymentRecord);

    return {
      booking: newBooking,
      payment: paymentRecord,
    };
  }

  // Database-Level Row Lock Mutex Engine for Bookings (Concurrency & Race Condition Protection)
  private rowLocks = new Map<string, Promise<void>>();

  private async executeWithRowLock<T>(bookingId: string, taskFn: () => Promise<T>): Promise<T> {
    if (!bookingId) return await taskFn();

    const lockKey = String(bookingId);
    while (this.rowLocks.has(lockKey)) {
      await this.rowLocks.get(lockKey);
    }

    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.rowLocks.set(lockKey, lockPromise);

    try {
      return await taskFn();
    } finally {
      this.rowLocks.delete(lockKey);
      releaseLock!();
    }
  }

  async createBooking(userId: string, dto: CreateBookingDto): Promise<BookingEntity> {
    const res = await this.handleBooking(userId, dto, 'USER');
    return res.booking;
  }

  async cancelBooking(userId: string, bookingId: string, userRole: string = 'USER', reason?: string): Promise<any> {
    return await this.executeWithRowLock(bookingId, async () => {
      const role = (userRole || 'USER').toUpperCase();
      if (role !== 'USER' && role !== 'CUSTOMER') {
        throw new ForbiddenException('Akses Ditolak: Pembatalan booking oleh pengguna hanya diizinkan untuk peran USER.');
      }

      const booking = this.bookings.find((b) => b.id === bookingId || b.booking_code === bookingId);
      if (!booking) {
        throw new Error('Booking tidak ditemukan.');
      }

      if (booking.user_id !== userId) {
        throw new ForbiddenException('Akses Ditolak: Anda tidak memiliki wewenang untuk membatalkan booking milik pengguna lain.');
      }

      if (booking.status === 'CANCELLED' || booking.status === 'cancelled') {
        return { ok: true, message: 'Booking sudah dibatalkan sebelumnya.', booking };
      }

      if (booking.status === 'verified' || booking.status === 'CONFIRMED' || booking.status === 'confirmed') {
        throw new Error('Pembayaran telah terkonfirmasi dan booking tidak dapat dibatalkan melalui menu ini.');
      }

      booking.status = 'CANCELLED';
      const payTx = this.paymentTransactions.find((p) => p.booking_id === bookingId);
      if (payTx) {
        payTx.status = 'CANCELLED';
      }

      return {
        ok: true,
        message: 'Booking berhasil dibatalkan.',
        booking,
      };
    });
  }
}
