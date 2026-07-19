import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async listRooms() {
    return this.chatService.listRooms();
  }

  @Get('rooms/:name')
  async getHistory(
    @Param('name') name: string, // equal to Path Variable in Spring boot
    @Query('limit') limit?: string, // equal to Request Param in spring too
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getHistory(name, parsedLimit);
  }
}
