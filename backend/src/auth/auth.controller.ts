import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { AuthGuard } from './guards/jwt-auth.guard';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}


    @Post('register')
    register(@Body() dto: RegisterDTO)
    {
        return this.authService.register(dto);
    }
    @Post('login')
    async login(@Body() data: { email: string; password: string; }, @Res({ passthrough: true }) res: Response)
    {
        const { access_token } = await this.authService.login(data);
        res.cookie('jwt', access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        }
        )
        return { message: 'Connecte' };
    }

    @Get('me')
    @UseGuards(AuthGuard)
    getProfile(@Req() req: Request & { user: any })
    {
        return req.user;
    }

     
}
