import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    // Only the logged user can see their own email
    async getMe(userId: number)
    {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new NotFoundException('User not found');
        return user;
    }

    async getById(userId: number)
    {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new NotFoundException('User not found');
        return user;
    }
}
