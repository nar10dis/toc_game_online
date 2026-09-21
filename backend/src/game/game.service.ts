import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameService {
    constructor(private prisma: PrismaService) {}

    generateInviteCode(): string {
        const inviteCode = crypto.randomInt()
    }
    createGame(userId: number, pseudo: string)
    {
        const player:
         
        const game:
    }
}