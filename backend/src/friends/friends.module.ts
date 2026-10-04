import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsGateway } from './friends.gateway';
import { PresenceService } from './presence.service';

@Module({
    controllers: [FriendsController],
    providers: [FriendsService, FriendsGateway, PresenceService],
})
export class FriendsModule {}
