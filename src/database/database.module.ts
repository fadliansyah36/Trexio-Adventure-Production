import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { UserOrmEntity } from './entities/user.entity';
import { TripOrmEntity, BookingOrmEntity } from './entities/trip.entity';
import { ChatConversationOrmEntity, ChatMessageOrmEntity } from './entities/chat.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_FILE || './trexio_database.sqlite',
      entities: [
        UserOrmEntity,
        TripOrmEntity,
        BookingOrmEntity,
        ChatConversationOrmEntity,
        ChatMessageOrmEntity,
      ],
      synchronize: process.env.NODE_ENV !== 'production' && !process.env.SQL_HOST, // Disabled in production / Cloud SQL
      logging: false,
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      TripOrmEntity,
      BookingOrmEntity,
      ChatConversationOrmEntity,
      ChatMessageOrmEntity,
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
