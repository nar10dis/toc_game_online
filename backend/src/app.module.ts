import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { GameModule } from './game/game.module';
import { LoggerConfig } from './config/logger.config';
import { FriendsModule } from './friends/friends.module';
import { ChatModule } from './chat/chat.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionFilter } from './config/all-exceptions.filter';

@Module({
  imports: [PrismaModule, AuthModule, ProfileModule, GameModule, FriendsModule, ChatModule, LoggerConfig],
  controllers: [AppController],
  providers: [AppService,
    {provide: APP_FILTER, useClass: AllExceptionFilter},
  ],
})
export class AppModule {};
