import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from './dto/register.dto';
import { NAME_PATTERN } from '../profile/profile.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { JwtService } from '@nestjs/jwt';


// Pas bcrypt : il ne lit que 72 octets, identiques pour tous les jwt d'un meme user
function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function isSameHash(hashA: string, hashB: string): boolean {
    const bufferA = Buffer.from(hashA);
    const bufferB = Buffer.from(hashB);
    return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async register(data: RegisterDTO)
    {
        // Same rule as when the pseudo is changed on the profile
        if (typeof data.name !== 'string' || !NAME_PATTERN.test(data.name))
            throw new BadRequestException('Pseudo must be 3 to 20 letters, digits, _ or -');
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(data.password, salt);
        return this.prisma.user.create({
            data: {
                ...data,
                password: hashPassword,
                profile: {
                    create: {}
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
    }
    async login(data: {email: string; password: string;})
    {
        const user = await this.prisma.user.findUnique({
            where: {
                email: data.email,
            }
        });
        if (!user)
            throw new UnauthorizedException();
        
        const password_comp = await bcrypt.compare(data.password, user.password);
        if (!password_comp)
            throw new UnauthorizedException();
        
        return this.createSession(user.id, user.name);
    }

    async refresh(refreshToken: string)
    {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
        }
        catch {
            throw new UnauthorizedException();
        }

        const user = await this.prisma.user.findUnique({where: { id: payload.sub},});

        if(!user || !user.hashedRefreshToken) {
            throw new UnauthorizedException();
        }

        if (!isSameHash(hashToken(refreshToken), user.hashedRefreshToken)) {
            throw new UnauthorizedException();
        }

        return this.createSession(user.id, user.name);
    }

    private async createSession(userId: number, username: string)
    {
        const payload = { sub: userId, username };
        const access_token = await this.jwtService.signAsync(payload);
        // Sans jwtid, deux tokens crees dans la meme seconde sont identiques
        const refresh_token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
            jwtid: randomUUID(),
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken: hashToken(refresh_token) },
        });
        return { access_token, refresh_token };
    }

    // 400 et pas 401 : sur un 401 le front croit que la session a expire
    async changePassword(userId: number, currentPassword: unknown, newPassword: unknown)
    {
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string')
            throw new BadRequestException('Current and new password are required');
        if (newPassword.length < 8)
            throw new BadRequestException('New password must be at least 8 characters long');
        // bcrypt ignore tout ce qui depasse 72 octets
        if (Buffer.byteLength(newPassword) > 72)
            throw new BadRequestException('New password is too long');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new UnauthorizedException();
        if (!await bcrypt.compare(currentPassword, user.password))
            throw new BadRequestException('Current password is incorrect');
        if (await bcrypt.compare(newPassword, user.password))
            throw new BadRequestException('New password must be different from the current one');

        const salt = await bcrypt.genSalt(10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: await bcrypt.hash(newPassword, salt) },
        });
        return this.createSession(user.id, user.name);
    }

    async logout(userId: number)
    {
        await this.prisma.user.update({
            where: {id: userId},
            data: { hashedRefreshToken : null}
        })
    }
}


