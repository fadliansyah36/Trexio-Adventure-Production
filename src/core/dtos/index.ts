export interface RegisterUserDto {
  email: string;
  password?: string;
  name: string;
  phone?: string;
}

export interface LoginUserDto {
  email: string;
  password?: string;
}

export interface CreateBookingDto {
  trip_id: string;
  participants_count: number;
  notes?: string;
  payment_method?: string;
}

export interface SendMessageDto {
  text: string;
  attachments?: string[];
}

export interface CreateTripDto {
  title: string;
  destination: string;
  price: number;
  duration_days: number;
  description?: string;
}

export interface CreateRentalOrderDto {
  rental_id: string;
  days_count: number;
  quantity: number;
}
