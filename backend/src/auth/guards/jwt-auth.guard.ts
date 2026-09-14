import { CanActivate,  ExecutionContext, Injectable, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext,): boolean | Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const token = req.cookies['jwt'];
        if (!token)
            throw new UnauthorizedException();
        try {
            req.user = this.jwtService.verify(token);
        }
        catch {
            throw new UnauthorizedException("Guard problem");
        }
        return true;
    }
    
}