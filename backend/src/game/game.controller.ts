import { GameService } from './game.service';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @UseGuards(AuthGuard)
    @Post()
    createGame(@Req() req: Request) {
        const user = (req as any).user;
        return this.gameService.createGame(user.sub, user.username)
    }

    @UseGuards(AuthGuard)
    @Post()
    joinGame(@Param('inviteCode') inviteCode: string ,@Req() req: Request) {
        const user = (req as any).user;
        return this.gameService.joinGame(inviteCode, user.sub, user.username);
    }
}