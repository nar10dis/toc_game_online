import { JwtService } from '@nestjs/jwt';
import {
    WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit,
    OnGatewayConnection, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameAction, StateMessage, isAI } from './game.types';
import { viewFor } from './engine/view';

// Le cookie arrive brut dans le handshake : "jwt=xxx; refresh_token=yyy"
function readCookie(cookieHeader: string | undefined, name: string): string | null {
    if (!cookieHeader)
        return null;
    for (const part of cookieHeader.split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === name)
            return decodeURIComponent(value.join('='));
    }
    return null;
}

// path sous /ws/ : c'est la route que nginx proxifie avec l'upgrade websocket.
@WebSocketGateway({ path: '/ws/socket.io' })
export class GameGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer() server: Server;

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
            client.disconnect();
        }
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
            return { error: (error as Error).message };
        }
    }

    @SubscribeMessage('fast-bots')
    handleFastBots(@ConnectedSocket() client: Socket, @MessageBody() body: { gameId: number; fastBots: boolean }) {
        try {
            this.gameService.setFastBots(body.gameId, client.data.userId, body.fastBots === true);
            return { ok: true };
        }
        catch (error) {
            return { error: (error as Error).message };
        }
    }
}
