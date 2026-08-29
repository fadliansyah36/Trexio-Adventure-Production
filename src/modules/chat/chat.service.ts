import { Injectable } from '@nestjs/common';
import { ConversationEntity, MessageEntity } from '../../core/entities/domain.entities';

@Injectable()
export class ChatService {
  private conversations: ConversationEntity[] = [];

  private messages: MessageEntity[] = [];

  async getConversations(userId: string): Promise<ConversationEntity[]> {
    return this.conversations.filter(c => !userId || c.user_id === userId || c.vendor_id === userId);
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
