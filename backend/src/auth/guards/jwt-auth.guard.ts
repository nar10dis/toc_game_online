import { CanActivate,  ExecutionContext, Injectable, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express'

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext,): Promise<boolean> {
        const request = context.switchtoHttp().getRequest();
        const token = request.cookies['jwt'];
        if (!token)
            throw new UnauthorizedException();
        try {
            request.user = this.jwtService.verify(token);
        }
    }
    
}