import { Controller, Post } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('reset-seed')
  async resetAndSeed() {
    if (process.env.NODE_ENV === 'production') {
      return {
        ok: false,
        message: 'Endpoint seeding dinonaktifkan di lingkungan produksi.',
      };
    }
    await this.databaseService.resetAndSeed();
    return {
      ok: true,
      message: 'Proses seeding database selesai dari konfigurasi environment.',
    };
  }
}
