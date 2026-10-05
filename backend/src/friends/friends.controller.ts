import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { currentUser } from '../auth/decorators/current-user.decorator';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@UseGuards(AuthGuard)
@Controller('friends')
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) {}

    @Get()
    list(@currentUser() user: { sub: number }) {
        return this.friendsService.list(user.sub);
    }

    @Post('requests')
    sendRequest(@currentUser() user: { sub: number }, @Body() dto: SendFriendRequestDto) {
        return this.friendsService.sendRequest(user.sub, dto?.name);
    }

    @Post('requests/:userId/accept')
    accept(@currentUser() user: { sub: number }, @Param('userId', ParseIntPipe) requesterId: number) {
        return this.friendsService.accept(user.sub, requesterId);
    }

    @Delete(':userId')
    remove(@currentUser() user: { sub: number }, @Param('userId', ParseIntPipe) otherId: number) {
        return this.friendsService.remove(user.sub, otherId);
    }
}
