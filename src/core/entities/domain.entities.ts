export interface UserEntity {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'vendor' | 'tenant_admin' | 'superadmin';
  phone?: string;
  avatar?: string;
  created_at: string;
}

export interface TripEntity {
  id: string;
  title: string;
  slug: string;
  destination: string;
  price: number;
  rating: number;
  duration_days: number;
  image?: string;
  featured?: boolean;
  vendor_id?: string;
  created_at: string;
}

export interface BookingEntity {
  id: string;
  user_id: string;
  trip_id: string;
  trip_title: string;
  participants_count: number;
  total_price: number;
  status: 'pending' | 'paid' | 'verified' | 'cancelled' | 'completed';
  payment_method?: string;
  payment_proof?: string;
  created_at: string;
}

export interface CommunityEntity {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  members_count: number;
  image?: string;
  created_at: string;
}

export interface RentalEntity {
  id: string;
  name: string;
  category: string;
  price_per_day: number;
  stock: number;
  image?: string;
  vendor_id?: string;
  created_at: string;
}

export interface VendorEntity {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
  created_at: string;
}

export interface WalletEntity {
  user_id: string;
  balance: number;
  transactions: Array<{
    id: string;
    type: 'topup' | 'payment' | 'withdrawal';
    amount: number;
    description: string;
    created_at: string;
  }>;
}

export interface ConversationEntity {
  id: string;
  user_id: string;
  vendor_id: string;
  vendor_name: string;
  last_message: string;
  updated_at: string;
}

export interface MessageEntity {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  attachments?: string[];
  created_at: string;
}

