import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import * as GameTypes from './game.types';
// import { initGame, addPlayer} from './engine/state';
@Injectable()
export class GameService {
    constructor(private prisma: PrismaService) {}

    private games = new Map<number, GameTypes.Game>();

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
        const hostPlayer: GameTypes.Player = {
                userId,
                pseudo,
                seat: 0,
                hand: [],
                isConnected: true,
        }
        const game: GameTypes.Game = {
                id: dbGame.idGame,
                inviteCode,
                phase: 'waiting',
                players: [hostPlayer],
                pawns: [],
                drawPile: [],
                discardPile: [],
                currentSeat: 0,
                winner: null,
        }
        this.games.set(game.id, game);

        return { gameId: game.id, inviteCode };

    }

    async joinGame(inviteCode: string, userId: number,  pseudo: string) {
        const game = [...this.games.values()].find(g=>g.inviteCode === inviteCode);
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

        const newPlayer: GameTypes.Player = {
            userId,
            pseudo,
            seat: seat,
            hand: [],
            isConnected: true,
        }

        game.players.push(newPlayer);

        return game;
    }

    async startGame(gameId: number, requesterUserId: number) {
        const game = this.games.get(gameId);
        if(!game)
            throw new NotFoundException('Game not found');

        const isHost = game.players[0]?.userId === requesterUserId;
        if (!isHost)
            throw new ForbiddenException('Only the host can lock the team');
        if (game.phase !== 'waiting')
            throw new ConflictException('Game already started');

        let nextSeat = game.players.length as GameTypes.Seat;
        while (nextSeat < 4) {
            game.players.push({
                userId: null,
                pseudo: `IA ${nextSeat + 1}`,
                seat: nextSeat,
                hand: [],
                isConnected: true,
            });
            nextSeat++;
        }

        //==> fnct add IA player
        // ==>Lancer game ici

        game.phase = 'playing';
        this.games.set(gameId, game);

        await this.prisma.game.update({
            where: { idGame: gameId },
            data: { phase: 'playing' },
        });

        return game;
    }

}
