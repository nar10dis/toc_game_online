import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from './presence.service';

const USER_SELECT = { id: true, name: true, profile: { select: { avatarUrl: true } } };

type SelectedUser = { id: number; name: string; profile: { avatarUrl: string | null } | null };

export type FriendUser = { id: number; name: string; avatarUrl: string | null };
export type Friend = FriendUser & { isOnline: boolean };
export type FriendsList = { friends: Friend[]; incoming: FriendUser[]; outgoing: FriendUser[] };

function pairOf(userA: number, userB: number) {
    return {
        OR: [
            { requesterId: userA, addresseeId: userB },
            { requesterId: userB, addresseeId: userA },
        ],
    };
}

const MAX_ATTEMPTS = 3;

// Un conflit serializable au COMMIT arrive en erreur brute de l'adapter pg, pas en P2034
function isRetryable(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError)
        return error.code === 'P2002' || error.code === 'P2034';
    const cause = (error as { cause?: { kind?: string } } | null)?.cause;
    return cause?.kind === 'TransactionWriteConflict';
}

function toFriendUser(user: SelectedUser): FriendUser {
    return { id: user.id, name: user.name, avatarUrl: user.profile?.avatarUrl ?? null };
}

@Injectable()
export class FriendsService {
    private notify: (userIds: number[]) => void = () => {};
    private readonly logger = new Logger('FriendsService');

    constructor(private readonly prisma: PrismaService, private readonly presence: PresenceService) {}

    setNotifier(notify: (userIds: number[]) => void) {
        this.notify = notify;
    }

    async list(userId: number): Promise<FriendsList> {
        const rows = await this.prisma.friendship.findMany({
            where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
            include: { requester: { select: USER_SELECT }, addressee: { select: USER_SELECT } },
            orderBy: { createdAt: 'desc' },
        });

        const result: FriendsList = { friends: [], incoming: [], outgoing: [] };
        for (const row of rows) {
            const other = row.requesterId === userId ? row.addressee : row.requester;
            if (row.status === 'accepted')
                result.friends.push({ ...toFriendUser(other), isOnline: this.presence.isOnline(other.id) });
            else if (row.addresseeId === userId)
                result.incoming.push(toFriendUser(other));
            else
                result.outgoing.push(toFriendUser(other));
        }
        return result;
    }

    async sendRequest(userId: number, name: unknown): Promise<{ status: 'pending' | 'accepted' }> {
        if (typeof name !== 'string' || name.trim() === '')
            throw new BadRequestException('Name is required');

        const target = await this.prisma.user.findUnique({ where: { name: name.trim() } });
        if (!target)
            throw new NotFoundException('User not found');
        if (target.id === userId)
            throw new BadRequestException("You can't add yourself");

        // Si A et B s'ajoutent en meme temps, Postgres refuse une transaction : rejouee, elle accepte la demande de l'autre
        for (let attempt = 1; ; attempt++) {
            try {
                const status = await this.createOrAcceptRequest(userId, target.id);
                this.notify([userId, target.id]);
                return { status };
            }
            catch (error) {
                if (!isRetryable(error) || attempt === MAX_ATTEMPTS)
                    throw error;
                this.logger.debug({ userId, targetId: target.id, attempt }, 'friend request retried after conflict');
            }
        }
    }

    private createOrAcceptRequest(userId: number, targetId: number): Promise<'pending' | 'accepted'> {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.friendship.findFirst({ where: pairOf(userId, targetId) });
            if (!existing) {
                await tx.friendship.create({ data: { requesterId: userId, addresseeId: targetId } });
                return 'pending';
            }
            if (existing.status === 'accepted')
                throw new ConflictException('You are already friends');
            if (existing.requesterId === userId)
                throw new ConflictException('Request already sent');
            await tx.friendship.update({ where: { id: existing.id }, data: { status: 'accepted' } });
            return 'accepted';
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }

    async accept(userId: number, requesterId: number) {
        const { count } = await this.prisma.friendship.updateMany({
            where: { requesterId, addresseeId: userId, status: 'pending' },
            data: { status: 'accepted' },
        });
        if (count === 0)
            throw new NotFoundException('No pending request from this user');
        this.notify([userId, requesterId]);
    }

    async remove(userId: number, otherId: number) {
        const { count } = await this.prisma.friendship.deleteMany({ where: pairOf(userId, otherId) });
        if (count === 0)
            throw new NotFoundException('Nothing to remove');
        this.notify([userId, otherId]);
    }

    async notifyFriendsOf(userId: number) {
        const rows = await this.prisma.friendship.findMany({
            where: { status: 'accepted', OR: [{ requesterId: userId }, { addresseeId: userId }] },
            select: { requesterId: true, addresseeId: true },
        });
        const friendIds = rows.map(row => row.requesterId === userId ? row.addresseeId : row.requesterId);
        this.notify(friendIds);
    }
}
