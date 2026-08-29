import { Controller, Get, Post, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from '../../core/dtos';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('mine')
  getMyBookings() {
    return this.bookingsService.getMyBookings('user_me');
  }

  @Get(':id')
  getBookingById(@Param('id') id: string) {
    return this.bookingsService.getBookingById(id);
  }

  @Post()
  handleBooking(@Body() dto: CreateBookingDto, @Req() req?: any) {
    const userRole = (req?.user?.role || req?.user?.roles?.[0] || 'USER').toUpperCase();
    if (userRole !== 'USER' && userRole !== 'CUSTOMER') {
      throw new ForbiddenException("Akses Ditolak: Hanya pengguna dengan role 'USER' yang dapat melakukan pemesanan.");
    }
    return this.bookingsService.handleBooking(req?.user?.id || 'user_me', dto, userRole);
  }

  @Post('create')
  createBooking(@Body() dto: CreateBookingDto, @Req() req?: any) {
    return this.handleBooking(dto, req);
  }

  @Post(':id/cancel')
  cancelBooking(@Param('id') id: string, @Req() req?: any, @Body() body?: any) {
    const userRole = (req?.user?.role || req?.user?.roles?.[0] || 'USER').toUpperCase();
    if (userRole !== 'USER' && userRole !== 'CUSTOMER') {
      throw new ForbiddenException("Akses Ditolak: Hanya pengguna dengan role 'USER' yang dapat membatalkan pemesanan.");
    }
    return this.bookingsService.cancelBooking(req?.user?.id || 'user_me', id, userRole, body?.reason);
  }
}
