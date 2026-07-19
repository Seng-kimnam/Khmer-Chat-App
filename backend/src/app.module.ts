import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { Room } from './chat/entities/room.entity';
import { Message } from './chat/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: parseInt(config.get('DB_PORT', '5432'), 10),
        username: config.get('DB_USER', 'chat'),
        password: config.get('DB_PASSWORD', 'chat_password'),
        database: config.get('DB_NAME', 'chatdb'),
        entities: [Room, Message],
        synchronize: true, // fine for dev; use migrations in production
      }),
    }),
    ChatModule,
  ],
})
export class AppModule {}
