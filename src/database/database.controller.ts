import { Controller, Post } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('reset-seed')
  async resetAndSeed() {
    await this.databaseService.resetAndSeed();
    return {
      ok: true,
      message: 'Berhasil melakukan reset akun dan seeding kredensial pengujian baru di database!',
      credentials: [
        {
          role: 'Super Admin',
          email: 'superadmin@trexio.id',
          shorthand: 'superadmin',
          password: 'admin123',
          login_url: '/admin/login',
        },
        {
          role: 'Tenant Admin',
          email: 'admin@trexio.id',
          shorthand: 'admin',
          password: 'admin123',
          login_url: '/admin/login',
        },
        {
          role: 'Vendor / Mitra',
          email: 'vendor@trexio.id',
          shorthand: 'vendor',
          password: 'vendor123',
          login_url: '/partner/login',
        },
        {
          role: 'Traveler / User',
          email: 'traveler@trexio.id',
          shorthand: 'traveler',
          password: 'traveler123',
          login_url: '/login',
        },
      ],
    };
  }
}
