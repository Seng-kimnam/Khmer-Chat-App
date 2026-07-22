import { Controller, Delete, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async listRooms() {
    return this.chatService.listRooms();
  }

  @Get('messages')
  async listOfMessages(){
    return this.chatService.listMessages();
  }

  @Get('messages/:id')
  async findMessageById(@Param('id' , ParseUUIDPipe) id : string){
    return this.chatService.fetchMessageById(id)
  }
  @Get('rooms/:name')
  async getHistory(
    @Param('name') name: string, // equal to Path Variable in Spring boot
    @Query('limit') limit?: string, // equal to Request Param in spring too
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getHistory(name, parsedLimit);
  }

  @Delete('messages/:id')
  async removeMessageById(@Param('id') id : string){
    return this.chatService.deleteMessageByUserId(id)
  }
}
