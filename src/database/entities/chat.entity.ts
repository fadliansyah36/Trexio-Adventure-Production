import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_conversations')
export class ChatConversationOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  user_id: string;

  @Column()
  vendor_id: string;

  @Column()
  vendor_name: string;

  @Column({ nullable: true })
  last_message: string;

  @CreateDateColumn()
  updated_at: Date;
}

@Entity('chat_messages')
export class ChatMessageOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  conversation_id: string;

  @Column()
  sender_id: string;

  @Column()
  sender_name: string;

  @Column('text')
  text: string;

  @CreateDateColumn()
  created_at: Date;
}
