import { GameService } from './game.service';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete, Req, Res, ParseIntPipe} from '@nestjs/common';
import { CurrentUser, type JwtPayload } from 'src/auth/decorators/current-user.decorator';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @UseGuards(AuthGuard)
    @Post()
    createGame(@CurrentUser() user: JwtPayload) {
        return this.gameService.createGame(user.sub, user.username)
    }

    // La partie pas finie du user, pour le menu (reprendre / quitter).
    @UseGuards(AuthGuard)
    @Get('current')
    getCurrentGame(@CurrentUser() user: JwtPayload) {
        return this.gameService.getCurrentGame(user.sub);
    }

    @UseGuards(AuthGuard)
    @Post('leave')
    leaveGame(@CurrentUser() user: JwtPayload) {
        return this.gameService.leaveGame(user.sub);
    }

    @UseGuards(AuthGuard)
    @Post('join/:inviteCode')
    joinGame(@Param('inviteCode') inviteCode: string ,@CurrentUser() user: JwtPayload) {
        return this.gameService.joinGame(inviteCode, user.sub, user.username);
    }

    @UseGuards(AuthGuard)
    @Post(':gameId/start')
    // ParseIntPipe : sinon gameId est une string et games.get() ne trouve rien
    startGame(@Param('gameId', ParseIntPipe) gameId: number, @CurrentUser() user: JwtPayload) {
        return this.gameService.startGame(gameId, user.sub)
    }

    @UseGuards(AuthGuard)
    @Post('ai-level/:gameId/:seat/:level')
    setAILevel(@Param('gameId', ParseIntPipe) gameId: number, @Param('seat', ParseIntPipe) seat: number,
            @Param('level') level: string, @Req() req: Request) {
        const user = (req as any).user;
        return this.gameService.setAILevel(gameId, user.sub, seat, level);
    }
}
