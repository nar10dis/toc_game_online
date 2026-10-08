import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const MAX_GLOBAL_CHAT_MESSAGE_LENGTH = 200;
const MAX_GLOBAL_CHAT_HISTORY = 50;

// Un message du chat global. Garde en memoire seulement, comme le chat de partie.
export type GlobalChatMessage = {
    id: number;
    userId: number;
    pseudo: string;
    text: string;
    sentAt: number;
};

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) {}

    private history: GlobalChatMessage[] = [];
    private nextMessageId = 1;

    // Ajoute le message a l'historique. La gateway se charge de l'envoyer.
    async send(userId: number, text: unknown): Promise<GlobalChatMessage> {
        if (typeof text !== 'string')
            throw new BadRequestException('Invalid message');
        const trimmed = text.trim();
        if (trimmed.length === 0 || trimmed.length > MAX_GLOBAL_CHAT_MESSAGE_LENGTH)
            throw new BadRequestException('Invalid message');

        // lu en base et pas dans le jwt : le pseudo a pu changer depuis le login
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        if (!user)
            throw new NotFoundException('User not found');

        const message: GlobalChatMessage = {
            id: this.nextMessageId++,
            userId,
            pseudo: user.name,
            text: trimmed,
            sentAt: Date.now(),
        };
        this.history = [...this.history, message].slice(-MAX_GLOBAL_CHAT_HISTORY);
        return message;
    }

    getHistory(): GlobalChatMessage[] {
        return this.history;
    }
}
