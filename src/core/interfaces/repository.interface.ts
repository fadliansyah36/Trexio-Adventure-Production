import {
  UserEntity,
  TripEntity,
  BookingEntity,
  CommunityEntity,
  RentalEntity,
  VendorEntity,
  WalletEntity,
  ConversationEntity,
  MessageEntity,
} from '../entities/domain.entities';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: Partial<UserEntity>): Promise<UserEntity>;
}

export interface ITripRepository {
  findAll(): Promise<TripEntity[]>;
  findById(id: string): Promise<TripEntity | null>;
  findBySlug(slug: string): Promise<TripEntity | null>;
  create(trip: Partial<TripEntity>): Promise<TripEntity>;
}

export interface IBookingRepository {
  findByUserId(userId: string): Promise<BookingEntity[]>;
  findById(id: string): Promise<BookingEntity | null>;
  create(booking: Partial<BookingEntity>): Promise<BookingEntity>;
}

export interface ICommunityRepository {
  findAll(): Promise<CommunityEntity[]>;
  findById(id: string): Promise<CommunityEntity | null>;
}

export interface IRentalRepository {
  findAll(): Promise<RentalEntity[]>;
  findById(id: string): Promise<RentalEntity | null>;
}

export interface IChatRepository {
  getConversations(userId: string): Promise<ConversationEntity[]>;
  getMessages(conversationId: string): Promise<MessageEntity[]>;
  createMessage(msg: Partial<MessageEntity>): Promise<MessageEntity>;
}

export interface IWalletRepository {
  getByUserId(userId: string): Promise<WalletEntity>;
  topup(userId: string, amount: number): Promise<WalletEntity>;
}
