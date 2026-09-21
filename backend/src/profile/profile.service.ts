import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
      include: {
        user: {
          select: { name: true, email: true }
    }}
    })
    if (!profile)
      throw new NotFoundException( 'Profile not found' );

    return profile;
  }

  // async findAll() {
  //     const profiles = await this.prisma.profile.findMany()
  //     return profiles;
  //   }

  async update(userId: number, updateProfileDto: UpdateProfileDto) {
    await this.prisma.profile.update({
      where: {
        userId,
      },
      data: {
        bio: updateProfileDto.bio,
        avatarUrl: updateProfileDto.avatar,
      },
    })
    return `#${userId} profile updated`;
  }

  // async remove(userId: number) {
  //   await this.prisma.profile.delete({
  //     where: {
  //       userId,
  //   }
  //   })
  //   return `This action removes a #${userId} profile`;
  // }
}
