import { Injectable } from '@nestjs/common';
import { ConversationEntity, MessageEntity } from '../../core/entities/domain.entities';

@Injectable()
export class ChatService {
  private conversations: ConversationEntity[] = [
    {
      id: 'conv_official_01',
      user_id: 'default',
      vendor_id: 'vendor_official',
      vendor_name: 'Mitra TREXIO Official',
      last_message: 'Halo! Ada yang bisa kami bantu terkait trip / pendakian Anda?',
      updated_at: new Date().toISOString(),
    },
  ];

  private messages: MessageEntity[] = [
    {
      id: 'msg_welcome_01',
      conversation_id: 'conv_official_01',
      sender_id: 'vendor_official',
      sender_name: 'CS TREXIO Official',
      text: 'Halo! Selamat datang di Layanan Bantuan & Chat Mitra TREXIO. Ada yang bisa kami bantu mengenai jadwal trip, perlengkapan, atau pendaftaran vendor?',
      attachments: [],
      created_at: new Date().toISOString(),
    },
  ];

  async getConversations(userId: string): Promise<ConversationEntity[]> {
    return this.conversations;
  }

  async getMessages(convId: string): Promise<MessageEntity[]> {
    return this.messages.filter((m) => m.conversation_id === convId);
  }

  async addMessage(convId: string, senderId: string, senderName: string, text: string): Promise<MessageEntity> {
    const newMsg: MessageEntity = {
      id: `msg_${Date.now()}`,
      conversation_id: convId,
      sender_id: senderId,
      sender_name: senderName,
      text,
      created_at: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    return newMsg;
  }
}
