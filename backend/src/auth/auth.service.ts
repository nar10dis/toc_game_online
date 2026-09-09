import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from './dto/register.dto';


@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    async register(data: RegisterDTO)
    {
        return this.prisma.user.create({
            data,
        });
    }  
    async login(data: {email: string; password: string;})
    {
        return this
    }
}
