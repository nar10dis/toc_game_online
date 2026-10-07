import { GameService } from './game.service';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete, Req, Res, ParseIntPipe } from '@nestjs/common';

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
    @Post('join/:inviteCode')
    joinGame(@Param('inviteCode') inviteCode: string ,@Req() req: Request) {
        const user = (req as any).user;
        return this.gameService.joinGame(inviteCode, user.sub, user.username);
    }

    @UseGuards(AuthGuard)
    @Post('start/:gameId')
    // ParseIntPipe : sinon gameId est une string et games.get() ne trouve rien
    startGame(@Param('gameId', ParseIntPipe) gameId: number, @Req() req: Request) {
        const requesterUserId = (req as any).user;
        return this.gameService.startGame(gameId, requesterUserId.sub)
    }

    @UseGuards(AuthGuard)
    @Post('ai-level/:gameId/:seat/:level')
    setAILevel(@Param('gameId', ParseIntPipe) gameId: number, @Param('seat', ParseIntPipe) seat: number,
            @Param('level') level: string, @Req() req: Request) {
        const user = (req as any).user;
        return this.gameService.setAILevel(gameId, user.sub, seat, level);
    }
}
// Je ne veux qu'un bouton start game/lockteam , si il manque des joueurs humains, alors le reste des places est complete par des IA. Je voudrais que tu m'expliques comment mettre en place les websockets, sachant que je veux que les salles d'attentes soit actualisees en temps reel et qu'un joueur peut tres bien fermer la fenetre sans cliquer sur un bouton leave(que je veux ajouter aussi cependant), et je veux evidemment diffencier quand une partie est abandonner a cause d'un joueur qui ferme tout, d'une partie qui se termine avec une gagnant. Je ne veux pas de simplification, je veux que ca soit parfaitement correct et quil n'y ait pas a revenir dessus plus tard 