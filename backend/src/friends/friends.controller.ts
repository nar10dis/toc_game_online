import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@UseGuards(AuthGuard)
@Controller('friends')
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) {}

    @Get()
    list(@CurrentUser() user: { sub: number }) {
        return this.friendsService.list(user.sub);
    }

    @Post('requests')
    sendRequest(@CurrentUser() user: { sub: number }, @Body() dto: SendFriendRequestDto) {
        return this.friendsService.sendRequest(user.sub, dto?.name);
    }

    @Post('requests/:userId/accept')
    accept(@CurrentUser() user: { sub: number }, @Param('userId', ParseIntPipe) requesterId: number) {
        return this.friendsService.accept(user.sub, requesterId);
    }

    @Delete(':userId')
    remove(@CurrentUser() user: { sub: number }, @Param('userId', ParseIntPipe) otherId: number) {
        return this.friendsService.remove(user.sub, otherId);
    }
}
