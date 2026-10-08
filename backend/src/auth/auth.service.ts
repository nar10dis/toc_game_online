import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from './dto/register.dto';
import { NAME_PATTERN } from '../profile/profile.service';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
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

// Volontairement simple : quelque chose@domaine.extension, sans espace
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkPassword(password: unknown): string
{
    if (typeof password !== 'string' || password.length < 8)
        throw new BadRequestException('Password must be at least 8 characters long');
    // bcrypt ignore tout ce qui depasse 72 octets
    if (Buffer.byteLength(password) > 72)
        throw new BadRequestException('Password is too long');
    return password;
}

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async register(data: RegisterDTO)
    {
        // Same rule as when the pseudo is changed on the profile
        if (typeof data.name !== 'string' || !NAME_PATTERN.test(data.name))
            throw new BadRequestException('Pseudo must be 3 to 20 letters, digits, _ or -');
        if (typeof data.email !== 'string' || data.email.length > 254 || !EMAIL_PATTERN.test(data.email))
            throw new BadRequestException('Invalid email');
        const password = checkPassword(data.password);
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        try {
            return await this.prisma.user.create({
                data: {
                    // Champ par champ : un champ en trop dans le body ne doit pas finir en base
                    email: data.email,
                    name: data.name,
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
        catch (error) {
            // P2002 = email ou pseudo deja en base : 409 et pas 500
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                if (JSON.stringify(error.meta ?? {}).includes('email'))
                    throw new ConflictException('This email is already used');
                throw new ConflictException('This pseudo is already taken');
            }
            throw error;
        }
    }
    async login(data: {email: string; password: string;})
    {
        // Meme 401 qu'un mauvais mot de passe, le front affiche deja ce message
        if (typeof data?.email !== 'string' || typeof data?.password !== 'string')
            throw new UnauthorizedException();
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

    // Jamais de 401 ici : le front demande juste "qui est connecte ?", y compris sur /login.
    // Si le jwt a expire, on tente le refresh cote serveur et on renvoie les nouveaux tokens.
    async getSession(accessToken: string | undefined, refreshToken: string | undefined): Promise<{
        user: { id: number; name: string } | null;
        tokens?: { access_token: string; refresh_token: string };
    }>
    {
        if (accessToken) {
            try {
                const payload = await this.jwtService.verifyAsync(accessToken);
                const user = await this.prisma.user.findUnique({
                    where: { id: payload.sub },
                    select: { id: true, name: true },
                });
                if (user)
                    return { user };
            }
            catch {
                // jwt expire ou invalide : on essaie le refresh_token
            }
        }
        if (refreshToken) {
            try {
                const tokens = await this.refresh(refreshToken);
                const payload = this.jwtService.decode(tokens.access_token);
                return { user: { id: payload.sub, name: payload.username }, tokens };
            }
            catch {
                // refresh_token expire, revoque ou compte supprime
            }
        }
        return { user: null };
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
        checkPassword(newPassword);

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


