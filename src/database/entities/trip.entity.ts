import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('trips')
export class TripOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  destination: string;

  @Column('decimal', { precision: 12, scale: 2 })
  price: number;

  @Column('float', { default: 5.0 })
  rating: number;

  @Column({ default: 1 })
  duration_days: number;

  @Column({ nullable: true })
  image: string;

  @Column({ default: false })
  featured: boolean;

  @Column({ nullable: true })
  vendor_id: string;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('bookings')
export class BookingOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  user_id: string;

  @Column()
  trip_id: string;

  @Column()
  trip_title: string;

  @Column({ default: 1 })
  participants_count: number;

  @Column('decimal', { precision: 12, scale: 2 })
  total_price: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ nullable: true })
  payment_proof: string;

  @CreateDateColumn()
  created_at: Date;
}
