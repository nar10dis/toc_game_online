import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import * as GameTypes from './game.types';
import { initGame, addPlayer, initStartingGame, startRound, playTurn} from './engine/state';
import { chooseAIAction } from './engine/AI';

// Pause entre deux coups de bot, sinon le joueur ne voit rien passer.
const BOT_DELAY_MS = 1000;

@Injectable()
export class GameService {
    constructor(private prisma: PrismaService) {}

    private games = new Map<number, GameTypes.Game>();
    // donne par la gateway -> envoie letat du game a tous les clients de la partie.
    private broadcast?: (game: GameTypes.Game, event: GameTypes.GameEvent | null) => void;

    setBroadcaster(fn : (game: GameTypes.Game, event: GameTypes.GameEvent | null) => void) {
        this.broadcast = fn;
    }

    // set + broadcast : le serveur s'en souvient ET les joueurs le voient.
    private commit(game : GameTypes.Game, event: GameTypes.GameEvent | null = null) {
        this.games.set(game.id, game);
        this.broadcast?.(game, event);
    }

    // La partie la plus recente du joueur (pour la resynchro d'un client).
    findGameOfUser(userId: number): GameTypes.Game | null {
        let found: GameTypes.Game | null = null;

        for (const game of this.games.values()) {
            if (game.players.some(p => p.userId === userId))
                found = game;
        }
        return found;
    }

    private readonly CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private generateInviteCode(): string {
        let inviteCode: string;
        do {
            inviteCode = '';
            for (let i = 0; i < 8; i++) {
            const index = randomInt(0, this.CHARSET.length);
            inviteCode += this.CHARSET[index];
            }
        } while (
            [...this.games.values()].some(game => game.inviteCode === inviteCode,)
        );
        return inviteCode;
    }

    async createGame(userId: number, pseudo: string)
    {
        const inviteCode = this.generateInviteCode();

        const dbGame = await this.prisma.game.create({
            data: {
                inviteCode,
                phase: 'waiting'
            },
        });

        await this.prisma.gamePlayer.create({
            data: {
                gameId: dbGame.idGame,
                userId,
                seat: 0
            },
        });

        //MODIFICATION DE GAME.
        let game: GameTypes.Game = initGame(dbGame.idGame, inviteCode);
        game = addPlayer(game, userId, pseudo);

        this.commit(game);

        return { gameId: game.id, inviteCode };
    }

    async joinGame(inviteCode: string, userId: number,  pseudo: string) {
        let game = [...this.games.values()].find(g=>g.inviteCode === inviteCode);
        if (!game)
            throw new NotFoundException('Invalid invite code');
        if (game.phase !== 'waiting')
            throw new ConflictException('Game already started');
        if (game.players.length >= 4)
            throw new ConflictException('Room is full, sorry');

        const alreadyIn = game.players.some(p => p.userId === userId);
        // on ne renvoie jamais la Game entiere : l'etat passe par le websocket (viewFor)
        if (alreadyIn)
            return { gameId: game.id, inviteCode };

        const seat = game.players.length as GameTypes.Seat;

        await this.prisma.gamePlayer.create({
            data: {
                gameId: game.id,
                userId,
                seat
            },
        });

        //MODIFICATION DE GAME
        game = addPlayer(game, userId, pseudo);

        //commit le nouvel etat dans la map.
        this.commit(game);

        return { gameId: game.id, inviteCode };
    }

    async startGame(gameId: number, requesterUserId: number) {
        let game = this.games.get(gameId);
        if(!game)
            throw new NotFoundException('Game not found');

        const isHost = game.players[0]?.userId === requesterUserId;
        if (!isHost)
            throw new ForbiddenException('Only the host can lock the team');
        if (game.phase !== 'waiting')
            throw new ConflictException('Game already started');

        game = startRound(initStartingGame(game));
        this.commit(game);

        await this.prisma.game.update({
            where: { idGame: gameId },
            data: { phase: 'playing' },
        });

        // le siege 0 est toujours un humain (l'hote), mais au cas ou.
        void this.runBots(gameId);

        return { gameId };
    }

    playAction(gameId: number, userId: number, action: GameTypes.GameAction) {
        const game = this.games.get(gameId);
        if (!game)
            throw new NotFoundException('Game not found');
        if (game.phase !== 'playing')
            throw new ConflictException('Game is not running');

        const player = game.players.find(p => p.userId === userId);
        if (!player)
            throw new ForbiddenException('You are not in this game');
        // ce check sert aussi de verrou pendant que les bots jouent
        if (game.currentSeat !== player.seat)
            throw new ConflictException('Not your turn');

        const out = playTurn(game, player.seat, action);
        if (!out)
            throw new BadRequestException('Illegal move');

        this.commit(out.game, out.event);
        // pas de await : on repond tout de suite, les bots jouent en fond
        void this.runBots(gameId);
    }

    // Fait jouer les bots tant que c'est a eux, un commit par coup.
    private async runBots(gameId: number) {
        let game = this.games.get(gameId);

        while (game && game.phase === 'playing' && GameTypes.isAI(game.players[game.currentSeat])) {
            await new Promise(resolve => setTimeout(resolve, BOT_DELAY_MS));
            const seat = game.currentSeat;
            const action = chooseAIAction(game, seat);
            const out = action && playTurn(game, seat, action);
            if (!out)
                break;
            game = out.game;
            this.commit(game, out.event);
        }
    }
}
