import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from './dto/register.dto';
import { UnauthorizedExeception } from '@nestjs/common';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

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
            throw new UnauthorizedExeception();
        const password_comp = await bcrypt.compare(data.password, user.password);
        if (!password_comp)
            throw new UnauthorizedExeception();
    }
}
