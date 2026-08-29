import { Injectable } from '@nestjs/common';
import { TripEntity } from '../../core/entities/domain.entities';

@Injectable()
export class TripsService {
  private trips: TripEntity[] = [
    {
      id: 'trip_1',
      title: 'Open Trip Gunung Rinjani 4D3N Via Sembalun',
      slug: 'open-trip-rinjani-4d3n',
      destination: 'Lombok, NTB',
      price: 2450000,
      rating: 4.9,
      duration_days: 4,
      featured: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'trip_2',
      title: 'Pendakian Gunung Semeru 3D2N Mahameru',
      slug: 'pendakian-semeru-3d2n',
      destination: 'Lumajang, Jawa Timur',
      price: 1850000,
      rating: 4.8,
      duration_days: 3,
      featured: true,
      created_at: new Date().toISOString(),
    },
  ];

  async findAll(): Promise<TripEntity[]> {
    return this.trips;
  }

  async findFeatured(): Promise<TripEntity[]> {
    return this.trips.filter((t) => t.featured);
  }

  async findById(id: string): Promise<TripEntity | null> {
    return this.trips.find((t) => t.id === id || t.slug === id) || null;
  }
}
