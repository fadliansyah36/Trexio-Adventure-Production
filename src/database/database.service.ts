import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { resetAndSeedDatabase } from './seeds/reset-seed';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log(`[TypeORM] Database connection established successfully via ${this.dataSource.options.type}`);
      await this.resetAndSeed();
    }
  }

  async resetAndSeed() {
    try {
      await resetAndSeedDatabase(this.dataSource);
    } catch (err) {
      console.warn('[TypeORM] User migration & reset notice:', err.message);
    }
  }

  isInitialized(): boolean {
    return this.dataSource.isInitialized;
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
