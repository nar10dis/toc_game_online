import { Controller, Post, Patch, Body, Get, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { ChangePasswordDTO } from './dto/change-password.dto';
import { AuthGuard } from './guards/jwt-auth.guard';
import type { Response, Request } from 'express';
import { CurrentUser, type JwtPayload } from './decorators/current-user.decorator';
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from './cookies';

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
        
        res.cookie('jwt', access_token, ACCESS_COOKIE_OPTIONS)

        res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS)
        return { message: 'Connecte' }; 
    }


    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) 
    {
        const oldRefreshToken = req.cookies['refresh_token'];

        if(!oldRefreshToken)
                throw new UnauthorizedException();

        const { access_token, refresh_token } = await this.authService.refresh(oldRefreshToken);
        res.cookie('jwt', access_token, ACCESS_COOKIE_OPTIONS);

        res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS);
        return { message: 'Your token is fresh' };
    }

    @UseGuards(AuthGuard)
    @Patch('password')
    async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDTO, @Res({ passthrough: true }) res: Response)
    {
        const { access_token, refresh_token } = await this.authService.changePassword(
            (req as any).user.sub, dto?.currentPassword, dto?.newPassword,
        );
        res.cookie('jwt', access_token, ACCESS_COOKIE_OPTIONS);
        res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS);
        return { message: 'Password changed' };
    }

    @UseGuards(AuthGuard)
    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response, @CurrentUser() user: JwtPayload )
    {
        await this.authService.logout(user.sub);
        res.clearCookie('jwt');
        res.clearCookie('refresh_token');
        return { message: 'Successfully logout'};
    }
      
}
