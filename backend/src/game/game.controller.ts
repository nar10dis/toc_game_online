import { GameService } from './game.service';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from 'src/auth/decorators/current-user.decorator';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @UseGuards(AuthGuard)
    @Post()
    createGame(@CurrentUser() user: JwtPayload) {
        return this.gameService.createGame(user.sub, user.username)
    }

    @UseGuards(AuthGuard)
    @Post('join/:inviteCode')
    joinGame(@Param('inviteCode') inviteCode: string ,@CurrentUser() user: JwtPayload) {
        return this.gameService.joinGame(inviteCode, user.sub, user.username);
    }
    

    @UseGuards(AuthGuard)
    @Post(':gameId/start')
    startGame(@Param('gameId') gameId: number, @CurrentUser() user: JwtPayload) {
        return this.gameService.startGame(gameId, user.sub)
    }

    
}