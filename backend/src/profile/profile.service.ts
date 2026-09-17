import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  // findAll() {
  //   return `This action returns all profile`;
  // }
  constructor(private readonly prisma: PrismaService) {}
  
  async findOne(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      }
    })
    if (!profile)
      throw new NotFoundException();

    return profile;
  }

  update(userId: number, updateProfileDto: UpdateProfileDto) {

    return `This action updates a #${userId} profile`;
  }

  remove(userId: number) {
    return `This action removes a #${userId} profile`;
  }
}
