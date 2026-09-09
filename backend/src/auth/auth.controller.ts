import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDTO)
    {
        return this.authService.register(dto);
    }
    @Post('login')
    login(@Body() data: email: string; password: string;)
    {
        return this.authService.login(data);
    }
    
}
