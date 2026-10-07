import { JwtService } from '@nestjs/jwt';
import {
    WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { FriendsService } from './friends.service';
import { PresenceService } from './presence.service';
import { readCookie } from '../auth/ws-auth';

type SocketData = { userId?: number };

@WebSocketGateway({ path: '/ws/socket.io', namespace: 'friends' })
export class FriendsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Namespace;

    constructor(
        private friendsService: FriendsService,
        private presence: PresenceService,
        private jwtService: JwtService,
    ) {}

    afterInit() {
        this.friendsService.setNotifier((userIds) => {
            for (const userId of userIds)
                this.server.to(`user-${userId}`).emit('friends-changed');
        });
    }

    async handleConnection(client: Socket) {
        const token = readCookie(client.handshake.headers.cookie, 'jwt');
        let userId: number;
        try {
            userId = this.jwtService.verify<{ sub: number }>(token ?? '').sub;
        }
        catch {
            client.disconnect();
            return;
        }
        (client.data as SocketData).userId = userId;
        void client.join(`user-${userId}`);
        if (this.presence.connect(userId))
            await this.friendsService.notifyFriendsOf(userId);
    }

    async handleDisconnect(client: Socket) {
        const { userId } = client.data as SocketData;
        if (userId === undefined)
            return;
        if (this.presence.disconnect(userId))
            await this.friendsService.notifyFriendsOf(userId);
    }
}
