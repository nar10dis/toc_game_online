import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get('me')
    async getMe(@Req() req: Request)
    {
        return this.usersService.getMe((req as any).user.sub);
    }

    @Get(':id')
    async getById(@Param('id', ParseIntPipe) id: number)
    {
        return this.usersService.getById(id);
    }
}
