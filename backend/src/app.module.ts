import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { GameModule } from './game/game.module';
import { LoggerConfig } from './config/logger.config';

@Module({
  imports: [PrismaModule, AuthModule, ProfileModule, GameModule, LoggerConfig],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
