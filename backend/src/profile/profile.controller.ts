import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(AuthGuard)
  @Get()
  findOne(@Req() req) {
    return this.profileService.findOne(req.user.sub);
  }

  // @UseGuards(AuthGuard)
  // @Get()
  // findAll() {
  //   return this.profileService.findAll();
  // }
  
  @UseGuards(AuthGuard)
  @Patch()
  update(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(req.user.sub, updateProfileDto);
  }

  // @Delete(':userId')
  // remove(@Param('userId') userId: string) {
  //   return this.profileService.remove(+userId);
  // }
}
