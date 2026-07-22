import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async getOrCreateRoom(name: string): Promise<Room> {
    let room = await this.roomRepository.findOne({ where: { name } });
    if (!room) {
      room = this.roomRepository.create({ name });
      room = await this.roomRepository.save(room);
    }
    return room;
  }

  async listRooms(): Promise<Room[]> {
    return this.roomRepository.find({ order: { createdAt: 'ASC' } });
  }
  async listMessages() : Promise<Message[]> {
    
    return this.messageRepository.find({order : {createdAt : 'ASC'}});
  }

  async deleteMessageByUserId(id : string) : Promise<any> {
    const message = this.messageRepository.findOne({where : {id : id}})
    if(!message){
      throw new NotFoundException(`Message with id ${id} not found`);
    }

    this.messageRepository.delete({id})
    return `Message with id ${id} delete successfully. `

  }

  async fetchMessageById(id : string) : Promise<Message | null> {
    const message = this.messageRepository.findOne({where : {id : id}})
    if(!message){
      throw new NotFoundException(`Message with id ${id} not found`);
    }
    return message
  }

  async saveMessage(
    roomName: string,
    username: string,
    content: string,
  ): Promise<Message> {
    const room = await this.getOrCreateRoom(roomName);
    const message = this.messageRepository.create({
      room,
      roomId: room.id,
      username,
      content,
    });
    return this.messageRepository.save(message);
  }

  async getHistory(roomName: string, limit = 50): Promise<Message[]> {
    const room = await this.roomRepository.findOne({ where: { name: roomName } });
    if (!room) return [];

    const messages = await this.messageRepository.find({
      where: { roomId: room.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return messages.reverse();
  }
}
