import {
	Injectable, Logger,
	NotFoundException, ConflictException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import * as GameTypes from './game.types';
import { initGame, addPlayer, initStartingGame, startRound, playTurn } from './engine/state';
import { chooseAIAction } from './engine/AI/AI';

const BOT_MIN_DELAY_MS = 1000;
const BOT_MAX_DELAY_MS = 3000;
const RECONNECT_GRACE_MS = 5000;
const MAX_CHAT_HISTORY = 50;
const FINISHED_GAME_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class GameService {
	constructor(private prisma: PrismaService) {}

	private games = new Map<number, GameTypes.Game>();
	// userId key, val = timer ->deco quand finti
	private disconnectTimers = new Map<number, NodeJS.Timeout>();
	//set -> pas de doublons ! ici = gameID
	private botLoops = new Set<number>();
	private lastGameOfUser = new Map<number, number>();
	// userId dont un createGame est en cours : bloque le double clic pendant l'await Prisma
	private pendingCreates = new Set<number>();
	// gameId -> derniers messages du chat, renvoyes a un client qui (re)arrive
	private chats = new Map<number, GameTypes.ChatMessage[]>();
	private nextChatMessageId = 1;
	// dnull en attendant le gateway
	private broadcast?: (game: GameTypes.Game, event: GameTypes.GameEvent | null) => void;

	//pour commit un log-> this.logger.<niveau>({champs}, 'msg);
	private readonly logger = new Logger('GameService');

	setBroadcaster(fn: (game: GameTypes.Game, event: GameTypes.GameEvent | null) => void) {
		this.broadcast = fn;
	}

	// set + log + broadcast = git add. + git commit +  git push
	private commit(game: GameTypes.Game, event: GameTypes.GameEvent | null = null) {
		this.games.set(game.id, game);
		// chaque coup (humain ou bot) passe ici : de quoi rejouer une partie dans Kibana
		if (event)
			this.logger.debug({
				gameId: game.id,
				seat: event.seat,
				action: event.action,
				captured: event.captured.map(p => p.id),
				newRound: event.newRound,
				winner: game.winner,
			}, 'move played');
		this.broadcast?.(game, event);
		if (game.phase === 'finished')
			void this.finishGame(game);
	}

	private async finishGame(game: GameTypes.Game) {
		this.logger.log({ gameId: game.id, winner: game.winner }, 'game finished');
		setTimeout(() => this.releaseGame(game.id), FINISHED_GAME_TTL_MS);
		try {
			await this.prisma.game.update({
				where: { idGame: game.id },
				data: { phase: 'finished', winnerSeat: game.winner, finishedAt: new Date() },
			});
		}
		catch (error) {
			this.logger.error({ err: error, gameId: game.id }, 'finishGame: DB update failed');
		}
	}

	private releaseGame(gameId: number) {
		const game = this.games.get(gameId);
		this.games.delete(gameId);
		this.chats.delete(gameId);
		for (const player of game?.players ?? []) {
			if (player.userId !== null && this.lastGameOfUser.get(player.userId) === gameId)
				this.lastGameOfUser.delete(player.userId);
		}
	}

	// La derniere partie creee ou rejointe par le joueur (pour la resynchro d'un client).
	findGameOfUser(userId: number): GameTypes.Game | null {
		const gameId = this.lastGameOfUser.get(userId);
		if (gameId === undefined)
			return null;
		// undefined si la partie a ete abandonnee entre temps
		return this.games.get(gameId) ?? null;
	}

	// La partie pas finie du joueur, null s'il n'en a pas : une seule a la fois.
	findActiveGameOfUser(userId: number): GameTypes.Game | null {
		const game = this.findGameOfUser(userId);
		if (!game || game.phase === 'finished')
			return null;
		return game;
	}

	// Pour le menu : reprendre ou quitter.
	getCurrentGame(userId: number) {
		const game = this.findActiveGameOfUser(userId);
		if (!game)
			return { game: null };
		return { game: { gameId: game.id, phase: game.phase } };
	}

	/* ********************************************************************** */
	/*                                 LOBBY                                  */
	/* ********************************************************************** */

	private readonly CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

	private generateInviteCode(): string {
		let inviteCode: string;
		do {
			inviteCode = '';
			for (let i = 0; i < 8; i++) {
				const index = randomInt(0, this.CHARSET.length);
				inviteCode += this.CHARSET[index];
			}
		} while ([...this.games.values()].some(game => game.inviteCode === inviteCode));
		return inviteCode;
	}

	async createGame(userId: number, pseudo: string) {
		if (this.findActiveGameOfUser(userId) || this.pendingCreates.has(userId))
			throw new ConflictException('You are already in a game');
		// pris AVANT le premier await, comme le siege dans joinGame
		this.pendingCreates.add(userId);
		try {
			return await this.createGameInDb(userId, pseudo);
		}
		finally {
			this.pendingCreates.delete(userId);
		}
	}

	private async createGameInDb(userId: number, pseudo: string) {
		const inviteCode = this.generateInviteCode();

		const dbGame = await this.prisma.game.create({ data: { inviteCode, phase: 'waiting' } });

		//MODIFICATION DE GAME.
		let game: GameTypes.Game = initGame(dbGame.idGame, inviteCode);
		game = addPlayer(game, userId, pseudo);

		this.commit(game);
		this.lastGameOfUser.set(userId, game.id);

		return { gameId: game.id, inviteCode };
	}

	async joinGame(inviteCode: string, userId: number, pseudo: string) {
		let game = [...this.games.values()].find(g => g.inviteCode === inviteCode);
		if (!game)
			throw new NotFoundException('Invalid invite code');
		if (game.phase !== 'waiting')
			throw new ConflictException('Game already started');
		if (game.players.length >= 4)
			throw new ConflictException('Room is full, sorry');

		const alreadyIn = game.players.some(p => p.userId === userId);
		const current = this.findActiveGameOfUser(userId);
		if ((current && current.id !== game.id) || this.pendingCreates.has(userId))
			throw new ConflictException('You are already in a game');
		// on ne renvoie jamais la Game entiere : l'etat passe par le websocket (viewFor)
		if (alreadyIn) {
			this.lastGameOfUser.set(userId, game.id);
			return { gameId: game.id, inviteCode };
		}

		// Le siege est pris en memoire AVANT le premier await : Node ne coupe jamais ce bout de code,
		// donc deux joins en meme temps ne peuvent pas voir la meme place libre (sinon 6 joueurs).
		game = addPlayer(game, userId, pseudo);
		this.commit(game);
		this.lastGameOfUser.set(userId, game.id);

		return { gameId: game.id, inviteCode };
	}

	// Salle d'attente : on libere le siege, la salle vit tant qu'il reste quelqu'un.
	// En partie : l'IA prend sa place pour de bon (userId null = vrai bot, meme s'il revient).
	async leaveGame(userId: number) {
		const game = this.findActiveGameOfUser(userId);
		if (!game)
			throw new NotFoundException('You are not in any game');
		this.lastGameOfUser.delete(userId);

		if (game.phase === 'waiting') {
			// les sieges restent 0..n-1 : le suivant devient l'hote s'il le faut
			const players = game.players
				.filter(p => p.userId !== userId)
				.map((p, i) => ({ ...p, seat: i as GameTypes.Seat }));
			if (players.length === 0) {
				await this.abandonGame(game.id);
				return { ok: true };
			}
			this.commit({ ...game, players });
			this.logger.log({ gameId: game.id, userId }, 'player left the waiting room');
			return { ok: true };
		}

		const updated: GameTypes.Game = {
			...game,
			players: game.players.map(p =>
				p.userId === userId ? { ...p, userId: null, isConnected: true } : p),
		};
		this.logger.log({ gameId: game.id, userId }, 'player left the game, AI takes over');
		if (!updated.players.some(p => !GameTypes.isBotControlled(p))) {
			await this.abandonGame(updated.id);
			return { ok: true };
		}
		this.commit(updated);
		this.startBots(updated.id);
		return { ok: true };
	}

	async startGame(gameId: number, requesterUserId: number) {
		let game = this.games.get(gameId);
		if (!game)
			throw new NotFoundException('Game not found');

		const isHost = game.players[0]?.userId === requesterUserId;
		if (!isHost)
			throw new ForbiddenException('Only the host can lock the team');
		if (game.phase !== 'waiting')
			throw new ConflictException('Game already started');

		game = startRound(initStartingGame(game));
		this.commit(game);

		const humans = game.players.filter(p => p.userId !== null);
		await this.prisma.game.update({
			where: { idGame: gameId },
			data: {
				phase: 'playing',
				gamePlayers: { create: humans.map(p => ({ userId: p.userId!, seat: p.seat })) },
			},
		});

		// le siege 0 est toujours un humain (l'hote), mais au cas ou.
		this.startBots(gameId);
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

		const aiLevels = game.aiLevels.map((oldLevel, i) =>
			i === seat ? level as GameTypes.AILevel : oldLevel);

		this.commit({ ...game, aiLevels });
	}

	/* ********************************************************************** */
	/*                              PLAYING GAME                              */
	/* ********************************************************************** */

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
		this.startBots(gameId);
	}

	/* ********************************************************************** */
	/*                              IA BEHAVIOUR                              */
	/* ********************************************************************** */

	// runBots tourne en fond, hors requete HTTP : sans ce catch son erreur serait perdue.
	private startBots(gameId: number) {
		this.runBots(gameId).catch(err => this.logger.error({ err, gameId }, 'runBots crashed'));
	}

	private async runBots(gameId: number) {
		//verrou pour pas avoir deux bots de la meme game qui tournent.
		if (this.botLoops.has(gameId))
			return;
		this.botLoops.add(gameId);
		try {
			while (this.botToPlay(gameId)) {
				const delay = BOT_MIN_DELAY_MS
					+ Math.random() * (BOT_MAX_DELAY_MS - BOT_MIN_DELAY_MS);
				await new Promise(resolve => setTimeout(resolve, delay));
				const game = this.botToPlay(gameId);
				if (!game)
					break;
				const seat = game.currentSeat;
				const action = chooseAIAction(game, seat);
				const out = action && playTurn(game, seat, action);
				// l'IA n'a rien trouve ou le moteur refuse son coup : la partie reste bloquee
				if (!out) {
					this.logger.error({ gameId, seat, actionType: action?.type ?? null },
						'bot could not play');
					break;
				}
				this.commit(out.game, out.event);
			}
		}
		finally {
			this.botLoops.delete(gameId);
		}
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
			this.logger.log({ gameId: game.id, userId, seat: player.seat },
				isConnected ? 'player reconnected' : 'player disconnected, AI takes over');

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
				this.startBots(updated.id);
		}
	}

	// Partie terminee sans gagnant (winnerSeat null) : tous les humains sont partis.
	private async abandonGame(gameId: number) {
		this.logger.log({ gameId }, 'game abandoned: no human left');
		this.releaseGame(gameId);
		try {
			await this.prisma.game.update({
				where: { idGame: gameId },
				data: { phase: 'finished', finishedAt: new Date() },
			});
		}
		catch (error) {
			this.logger.error({ err: error, gameId }, 'abandonGame: DB update failed');
		}
	}
}
