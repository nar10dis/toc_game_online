import { Controller, Post, Body, Get, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { AuthGuard } from './guards/jwt-auth.guard';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    async register(@Body() dto: RegisterDTO)
    {
        await this.authService.register(dto);
        return { message: 'Registered <3' };
    }

    @Post('login')
    async login(@Body() data: { email: string; password: string; }, @Res({ passthrough: true }) res: Response)
    {
        const { access_token, refresh_token } = await this.authService.login(data);
        
        res.cookie('jwt', access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        })

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: true, 
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return { message: 'Connecte' }; 
    }


    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) 
    {
        const oldRefreshToken = req.cookies['refresh_token'];

        if(!oldRefreshToken)
                throw new UnauthorizedException();

        const { access_token, refresh_token } = await this.authService.refresh(oldRefreshToken);
        res.cookie('jwt', access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: true, 
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { message: 'Your token is fresh' };
    }

    @UseGuards(AuthGuard)
    @Post('logout')
    logout()
    {
        return { message: 'Successfully logout'};
    }
    

     
}
