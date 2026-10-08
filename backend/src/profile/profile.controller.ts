import { Controller, UseGuards, Get, Post, Body, Patch, Delete, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ACCESS_COOKIE_OPTIONS } from '../auth/cookies';
import { AVATAR_MAX_BYTES } from './avatar-storage';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService, private readonly jwtService: JwtService) {}

  @UseGuards(AuthGuard)
  @Get()
  findOne(@CurrentUser() user: { sub: number }) {
    return this.profileService.findOne(user.sub);
  }

  // @UseGuards(AuthGuard)
  // @Get()
  // findAll() {
  //   return this.profileService.findAll();
  // }
  
  @UseGuards(AuthGuard)
  @Patch()
  async update(@CurrentUser() user: { sub: number }, @Body() updateProfileDto: UpdateProfileDto, @Res({ passthrough: true }) res: Response) {
    const profile = await this.profileService.update(user.sub, updateProfileDto);

    // Le pseudo est dans le jwt, sinon l'ancien reste affiche 15 min
    if (updateProfileDto?.name !== undefined) {
      const accessToken = await this.jwtService.signAsync({ sub: user.sub, username: profile.user.name });
      res.cookie('jwt', accessToken, ACCESS_COOKIE_OPTIONS);
    }
    return profile;
  }

  @UseGuards(AuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: AVATAR_MAX_BYTES } }))
  updateAvatar(@CurrentUser() user: { sub: number }, @UploadedFile() file: { buffer: Buffer } | undefined) {
    return this.profileService.updateAvatar(user.sub, file);
  }

  @UseGuards(AuthGuard)
  @Delete('avatar')
  removeAvatar(@CurrentUser() user: { sub: number }) {
    return this.profileService.removeAvatar(user.sub);
  }

  @UseGuards(AuthGuard)
  @Delete()
  async remove(@CurrentUser() user: { sub: number }, @Body() body: { password?: string }, @Res({ passthrough: true }) res: Response) {
    await this.profileService.remove(user.sub, body?.password);
    res.clearCookie('jwt');
    res.clearCookie('refresh_token');
    return { message: 'Account deleted' };
  }
}
