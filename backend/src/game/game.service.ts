import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import * as GameTypes from './game.types';
import { initGame, addPlayer, initStartingGame, startRound} from './engine/state';

@Injectable()
export class GameService {
    constructor(private prisma: PrismaService) {}

    private games = new Map<number, GameTypes.Game>();
    //en attente -> envoie letat du game a tous les clients de la partie.
    private broadcast?: (game: GameTypes.Game) => void;

    setBroadcaster(fn : (game: GameTypes.Game) => void) {
        this.broadcast = fn;
    }

    private commit(game : GameTypes.Game) {
        this.games.set(game.id, game);
        this.broadcast?.(game);
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
        if (alreadyIn)
            return game;

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

        return game;
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

        return game;
    }

    // playAction(/*param de la requete*/) {

    //     let currentPlayer = game.players.find(p => (p.userId === userId));

    //     if (!currentPlayer)
    //         throw ...;
    // 	if (game.currentSeat !== currentPlayer?.seat)
    // 		throw new
        // playTurn(game, seat, action);
        //this.commit();
        //runBots();
    // }

}
