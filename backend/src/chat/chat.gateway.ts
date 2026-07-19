import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface SocketMeta {
  room?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Tracks which room/username each connected socket belongs to,
  // so we can announce departures and clean up presence on disconnect.
  private readonly socketMeta = new Map<string, SocketMeta>();

  constructor(private readonly chatService: ChatService) {}

  handleDisconnect(client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (meta?.room && meta?.username) {
      client.to(meta.room).emit('userLeft', {
        username: meta.username,
        room: meta.room,
      });
      this.emitRoomPresence(meta.room);
    }
    this.socketMeta.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const { room, username } = dto;

    // Leave any previously joined room first (one active room per socket).
    const previous = this.socketMeta.get(client.id);
    if (previous?.room && previous.room !== room) {
      client.leave(previous.room);
      client.to(previous.room).emit('userLeft', {
        username: previous.username,
        room: previous.room,
      });
    }

    await client.join(room);
    this.socketMeta.set(client.id, { room, username });

    await this.chatService.getOrCreateRoom(room);
    const history = await this.chatService.getHistory(room);

    client.emit('roomHistory', history);
    client.to(room).emit('userJoined', { username, room });
    this.emitRoomPresence(room);

    this.logger.log(`${username} joined room "${room}"`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const { room, username, content } = dto;
    if (!content?.trim()) return;

    const message = await this.chatService.saveMessage(
      room,
      username,
      content.trim(),
    );

    this.server.to(room).emit('newMessage', {
      id: message.id,
      username: message.username,
      content: message.content,
      createdAt: message.createdAt,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { room: string; username: string; isTyping: boolean },
  ) {
    client.to(dto.room).emit('userTyping', {
      username: dto.username,
      isTyping: dto.isTyping,
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { room: string; username: string },
  ) {
    client.leave(dto.room);
    client.to(dto.room).emit('userLeft', dto);
    this.socketMeta.delete(client.id);
    this.emitRoomPresence(dto.room);
  }

  private async emitRoomPresence(room: string) {
    const sockets = await this.server.in(room).fetchSockets();
    const usernames = sockets
      .map((s) => this.socketMeta.get(s.id)?.username)
      .filter((u): u is string => Boolean(u));
    this.server.to(room).emit('presence', { room, users: usernames });
  }
}
