import { Controller, Get, Param } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  getAllTrips() {
    return this.tripsService.findAll();
  }

  @Get('featured')
  getFeaturedTrips() {
    return this.tripsService.findFeatured();
  }

  @Get(':id')
  getTripById(@Param('id') id: string) {
    return this.tripsService.findById(id);
  }
}
