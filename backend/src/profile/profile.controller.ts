import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from './guards/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // @Get()
  // findAll() {
  //   return this.profileService.findAll();
  // }

  @UseGuards(AuthGuard)
  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.profileService.findOne(+userId);
  }

  @Patch(':userId')
  update(@Param('userId') userId: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(+userId, updateProfileDto);
  }

  @Delete(':userId')
  remove(@Param('userId') userId: string) {
    return this.profileService.remove(+userId);
  }
}
