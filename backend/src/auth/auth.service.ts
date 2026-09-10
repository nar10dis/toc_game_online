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
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}
