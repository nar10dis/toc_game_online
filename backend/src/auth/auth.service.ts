import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from './dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async register(data: RegisterDTO)
    {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(data.password, salt);
        return this.prisma.user.create({
            data: {
                ...data,
                password: hashPassword,
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
        
        const payload = { sub: user.id, username: user.name };
        const access_token = await this.jwtService.signAsync(payload);
        
        const refresh_token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d'
        });
        
        const hash_refresh_token = await bcrypt.hash(refresh_token, 10);
        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                hashedRefreshToken: hash_refresh_token,
            },
        });

        return {
            access_token, refresh_token,
        };
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

        
    }
}
