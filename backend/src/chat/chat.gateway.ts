import { HttpException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection,
    ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { readCookie } from '../auth/ws-auth';

type SocketData = { userId?: number };

@WebSocketGateway({ path: '/ws/socket.io', namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
    @WebSocketServer() server: Namespace;
    // les WebSockets ne passent ni par pino-http ni par AllExceptionFilter : on logge ici
    private readonly logger = new Logger('ChatGateway');

    constructor(private chatService: ChatService, private jwtService: JwtService) {}

    handleConnection(client: Socket) {
        const token = readCookie(client.handshake.headers.cookie, 'jwt');
        try {
            (client.data as SocketData).userId = this.jwtService.verify<{ sub: number }>(token ?? '').sub;
        }
        catch {
            this.logger.warn({ socketId: client.id, hasToken: token !== null }, 'ws connection refused: invalid jwt');
            client.disconnect();
            return;
        }
        // un client qui (re)arrive recoit les derniers messages
        client.emit('history', this.chatService.getHistory());
    }

    // Le message part a tout le monde, l'auteur compris. Le retour part dans l'ack.
    @SubscribeMessage('message')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() body: { text: string }) {
        const { userId } = client.data as SocketData;
        try {
            const message = await this.chatService.send(userId!, body?.text);
            this.server.emit('message', message);
            return { ok: true };
        }
        catch (error: unknown) {
            if (error instanceof HttpException)
                this.logger.warn({ userId, status: error.getStatus(), err: error }, 'ws event refused');
            else
                this.logger.error({ userId, err: error }, 'ws event crashed');
            return { error: (error as Error).message };
        }
    }
}
