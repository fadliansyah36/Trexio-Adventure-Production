import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations() {
    return this.chatService.getConversations('me');
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.chatService.getMessages(id);
  }

  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Body() body: { text: string }) {
    return this.chatService.addMessage(id, 'user_me', 'User', body.text || '');
  }
}
