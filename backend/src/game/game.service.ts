import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import * as GameTypes from './game.types';
import { initGame, addPlayer, initStartingGame, startRound, playTurn} from './engine/state';
import { chooseAIAction } from './engine/AI/AI';

// Pause entre deux coups de bot, sinon le joueur ne voit rien passer.
// Un bot "reflechit" entre 1 et 3 secondes avant de jouer.
const BOT_MIN_DELAY_MS = 1000;
const BOT_MAX_DELAY_MS = 3000;
// Temps laisse a un joueur pour revenir (refresh, jwt expire, coupure wifi)
// avant que l'IA ne prenne sa place.
const RECONNECT_GRACE_MS = 5000;
// Messages de chat gardes par partie : les plus vieux sont oublies.
const MAX_CHAT_HISTORY = 50;

@Injectable()
export class GameService {
    constructor(private prisma: PrismaService) {}

    private games = new Map<number, GameTypes.Game>();
    // userId -> timer qui le declarera deconnecte s'il ne revient pas a temps
    private disconnectTimers = new Map<number, NodeJS.Timeout>();
    // une seule boucle de bots par partie, sinon deux bots jouent le meme tour
    private botLoops = new Set<number>();
    // gameId -> derniers messages du chat, renvoyes a un client qui (re)arrive
    private chats = new Map<number, GameTypes.ChatMessage[]>();
    private nextChatMessageId = 1;
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

    // La derniere partie creee ou rejointe par le joueur (pour la resynchro d'un client).
    findGameOfUser(userId: number): GameTypes.Game | null {
        const gameId = this.lastGameOfUser.get(userId);
        if (gameId === undefined)
            return null;
        // undefined si la partie a ete abandonnee entre temps
        return this.games.get(gameId) ?? null;
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
        this.lastGameOfUser.set(userId, game.id);

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
        if (alreadyIn) {
            this.lastGameOfUser.set(userId, game.id);
            return { gameId: game.id, inviteCode };
        }

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
        this.lastGameOfUser.set(userId, game.id);

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

    // L'hote choisit la difficulte du bot d'un siege vide, avant de lancer la partie.
    setAILevel(gameId: number, requesterUserId: number, seat: number, level: string) {
        const game = this.games.get(gameId);
        if (!game)
            throw new NotFoundException('Game not found');

        const isHost = game.players[0]?.userId === requesterUserId;
        if (!isHost)
            throw new ForbiddenException('Only the host can choose the bots');
        if (game.phase !== 'waiting')
            throw new ConflictException('Game already started');
        if (seat < 0 || seat > 3)
            throw new BadRequestException('Invalid seat');
        if (game.players.some(p => p.seat === seat))
            throw new ConflictException('This seat is taken by a player');
        if (!GameTypes.AI_LEVELS.includes(level as GameTypes.AILevel))
            throw new BadRequestException('Invalid AI level');

        const aiLevels = game.aiLevels.map((oldLevel, i) => i === seat ? level as GameTypes.AILevel : oldLevel);

        this.commit({ ...game, aiLevels });
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

    // Fait jouer les bots (et l'IA qui remplace un deconnecte) tant que c'est a eux, un commit par coup.
    // La partie est relue dans la Map a chaque tour : pendant la pause, un joueur
    // a pu revenir, partir, ou la partie a pu etre abandonnee.
    private async runBots(gameId: number) {
        if (this.botLoops.has(gameId))
            return;
        this.botLoops.add(gameId);
        try {
            while (this.botToPlay(gameId)) {
                const delay = BOT_MIN_DELAY_MS + Math.random() * (BOT_MAX_DELAY_MS - BOT_MIN_DELAY_MS);
                await new Promise(resolve => setTimeout(resolve, delay));
                const game = this.botToPlay(gameId);
                if (!game)
                    break;
                const seat = game.currentSeat;
                const action = chooseAIAction(game, seat);
                const out = action && playTurn(game, seat, action);
                if (!out)
                    break;
                this.commit(out.game, out.event);
            }
        }
        finally {
            this.botLoops.delete(gameId);
        }
    }

    /* ********************************************************************** */
    /*                                   CHAT                                 */
    /* ********************************************************************** */

    // Ajoute le message a l'historique. La gateway se charge de l'envoyer.
    sendChat(gameId: number, userId: number, text: unknown) {
        const game = this.games.get(gameId);
        if (!game)
            throw new NotFoundException('Game not found');
        const player = game.players.find(p => p.userId === userId);
        if (!player)
            throw new ForbiddenException('You are not in this game');
        if (typeof text !== 'string')
            throw new BadRequestException('Invalid message');
        const trimmed = text.trim();
        if (trimmed.length === 0 || trimmed.length > GameTypes.MAX_CHAT_MESSAGE_LENGTH)
            throw new BadRequestException('Invalid message');

        const message: GameTypes.ChatMessage = {
            id: this.nextChatMessageId++,
            seat: player.seat,
            pseudo: player.pseudo,
            text: trimmed,
            sentAt: Date.now(),
        };
        const history = [...(this.chats.get(gameId) ?? []), message].slice(-MAX_CHAT_HISTORY);
        this.chats.set(gameId, history);
        return { game, message };
    }

    getChat(gameId: number): GameTypes.ChatMessage[] {
        return this.chats.get(gameId) ?? [];
    }

    // La partie si c'est a un bot de jouer, sinon null.
    private botToPlay(gameId: number): GameTypes.Game | null {
        const game = this.games.get(gameId);
        if (!game || game.phase !== 'playing')
            return null;
        if (!GameTypes.isBotControlled(game.players[game.currentSeat]))
            return null;
        return game;
    }

    /* ********************************************************************** */
    /*                          CONNEXION / DECONNEXION                       */
    /* ********************************************************************** */

    // Appele par la gateway a chaque socket qui arrive.
    userConnected(userId: number) {
        clearTimeout(this.disconnectTimers.get(userId));
        this.disconnectTimers.delete(userId);
        this.setConnected(userId, true);
    }

    // Appele par la gateway quand le DERNIER socket (onglet) du user est parti.
    // On attend un peu : un refresh de page ne doit pas donner la main a l'IA.
    userDisconnected(userId: number) {
        clearTimeout(this.disconnectTimers.get(userId));
        this.disconnectTimers.set(userId, setTimeout(() => {
            this.disconnectTimers.delete(userId);
            this.setConnected(userId, false);
        }, RECONNECT_GRACE_MS));
    }

    // Met a jour isConnected dans toutes les parties en cours du user.
    private setConnected(userId: number, isConnected: boolean) {
        for (const game of [...this.games.values()]) {
            if (game.phase === 'finished')
                continue;
            const player = game.players.find(p => p.userId === userId);
            if (!player || player.isConnected === isConnected)
                continue;

            const updated: GameTypes.Game = {
                ...game,
                players: game.players.map(p => p.userId === userId ? { ...p, isConnected } : p),
            };
            // plus aucun humain pour regarder : personne ne reviendra, on arrete
            if (!updated.players.some(p => !GameTypes.isBotControlled(p))) {
                void this.abandonGame(updated.id);
                continue;
            }
            this.commit(updated);
            // si c'etait son tour, l'IA le joue pour lui
            if (!isConnected)
                void this.runBots(updated.id);
        }
    }

    // Partie terminee sans gagnant (winnerSeat null) : tous les humains sont partis.
    private async abandonGame(gameId: number) {
        this.games.delete(gameId);
        this.chats.delete(gameId);
        try {
            await this.prisma.game.update({
                where: { idGame: gameId },
                data: { phase: 'finished', finishedAt: new Date() },
            });
        }
        catch (error) {
            console.error(`abandonGame ${gameId}:`, error);
        }
    }
}
