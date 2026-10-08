import { HttpException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit,
    OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameAction, StateMessage, isAI } from './game.types';
import { viewFor } from './engine/view';
import { readCookie } from '../auth/ws-auth';

// path sous /ws/ : c'est la route que nginx proxifie avec l'upgrade websocket.
@WebSocketGateway({ path: '/ws/socket.io' })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    // les WebSockets ne passent ni par pino-http ni par AllExceptionFilter : on logge ici
    private readonly logger = new Logger('GameGateway');

    constructor(private gameService: GameService, private jwtService: JwtService) {}

    // Le service ne sait pas COMMENT on envoie : on lui donne la fonction.
    afterInit() {
        this.gameService.setBroadcaster((game, event) => {
            for (const player of game.players) {
                if (isAI(player))
                    continue; // les bots n'ont pas de navigateur
                const message: StateMessage = { state: viewFor(game, player.seat), event };
                this.server.to(`user-${player.userId}`).emit('state', message);
            }
        });
    }

    // Meme verif que l'AuthGuard, mais sur le handshake.
    handleConnection(client: Socket) {
        const token = readCookie(client.handshake.headers.cookie, 'jwt');
        try {
            const payload = this.jwtService.verify(token ?? '');
            client.data.userId = payload.sub;
            // une room par user : tous ses onglets recoivent l'etat
            client.join(`user-${payload.sub}`);
        }
        catch {
            this.logger.warn({ socketId: client.id, hasToken: token !== null }, 'ws connection refused: invalid jwt');
            client.disconnect();
            return;
        }
        this.gameService.userConnected(client.data.userId);
    }

    // Le user n'est parti que si c'etait son dernier onglet.
    handleDisconnect(client: Socket) {
        const userId: number | undefined = client.data.userId;
        if (userId === undefined)
            return; // kicke au handshake, il n'a jamais ete connecte
        const room = this.server.sockets.adapter.rooms.get(`user-${userId}`);
        const otherSockets = [...(room ?? [])].filter(id => id !== client.id);
        if (otherSockets.length === 0)
            this.gameService.userDisconnected(userId);
    }

    // Le client demande l'etat actuel (arrivee sur une page, reconnexion).
    @SubscribeMessage('sync')
    handleSync(@ConnectedSocket() client: Socket) {
        const game = this.gameService.findGameOfUser(client.data.userId);
        if (!game) {
            client.emit('no-game');
            return;
        }
        const player = game.players.find(p => p.userId === client.data.userId)!;
        const message: StateMessage = { state: viewFor(game, player.seat), event: null };
        client.emit('state', message);
    }

    // La valeur retournee part dans l'ack du client : { ok } ou { error }.
    // Le nouvel etat, lui, arrive a tout le monde via commit -> broadcast.
    @SubscribeMessage('action')
    handleAction(@ConnectedSocket() client: Socket, @MessageBody() body: { gameId: number; action: GameAction }) {
        try {
            this.gameService.playAction(body.gameId, client.data.userId, body.action);
            return { ok: true };
        }
        catch (error) {
            this.logWsError('action', error, { gameId: body?.gameId, userId: client.data.userId, actionType: body?.action?.type });
            return { error: (error as Error).message };
        }
    }

    // Le message part a tous les humains de la partie, l'auteur compris.
    @SubscribeMessage('chat')
    handleChat(@ConnectedSocket() client: Socket, @MessageBody() body: { gameId: number; text: string }) {
        try {
            const { game, message } = this.gameService.sendChat(body?.gameId, client.data.userId, body?.text);
            for (const player of game.players) {
                if (!isAI(player))
                    this.server.to(`user-${player.userId}`).emit('chat', message);
            }
            return { ok: true };
        }
        catch (error) {
            this.logWsError('chat', error, { gameId: body?.gameId, userId: client.data.userId });
            return { error: (error as Error).message };
        }
    }

    // Meme regle que AllExceptionFilter : HttpException = coup refuse (warn), le reste = bug (error).
    private logWsError(event: string, error: unknown, details: object) {
        if (error instanceof HttpException)
            this.logger.warn({ ...details, event, status: error.getStatus(), err: error }, 'ws event refused');
        else
            this.logger.error({ ...details, event, err: error }, 'ws event crashed');
    }

    // L'historique du chat, pour un client qui arrive en cours de partie.
    @SubscribeMessage('chat-sync')
    handleChatSync(@ConnectedSocket() client: Socket) {
        const game = this.gameService.findGameOfUser(client.data.userId);
        if (!game)
            return;
        client.emit('chat-history', this.gameService.getChat(game.id));
    }
}
