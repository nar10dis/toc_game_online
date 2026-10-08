import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { saveAvatar, deleteAvatar } from './avatar-storage';

export const NAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;
export const BIO_MAX_LENGTH = 280;

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
          select: { name: true, email: true, createdAt: true }
    }}
    })
    if (!profile)
      throw new NotFoundException( 'Profile not found' );

    const [friendsCount, gamesPlayed] = await Promise.all([
      this.prisma.friendship.count({
        where: { status: 'accepted', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      }),
      this.prisma.gamePlayer.count({ where: { userId } }),
    ]);

    return { ...profile, stats: { friendsCount, gamesPlayed } };
  }

  async findPublic(userId: number) {
    const profile = await this.findOne(userId);
    return { ...profile, user: { name: profile.user.name, createdAt: profile.user.createdAt } };
  }

  // async findAll() {
  //     const profiles = await this.prisma.profile.findMany()
  //     return profiles;
  //   }

  async update(userId: number, updateProfileDto: UpdateProfileDto) {
    const { name, bio } = updateProfileDto ?? {};
    const userData: { name?: string } = {};
    const profileData: { bio?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !NAME_PATTERN.test(name.trim()))
        throw new BadRequestException('Pseudo must be 3 to 20 letters, digits, _ or -');
      userData.name = name.trim();
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.trim().length > BIO_MAX_LENGTH)
        throw new BadRequestException(`Bio must be at most ${BIO_MAX_LENGTH} characters`);
      profileData.bio = bio.trim() === '' ? null : bio.trim();
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { ...userData, profile: { update: profileData } },
      });
    }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('This pseudo is already taken');
      throw error;
    }
    return this.findOne(userId);
  }

  async updateAvatar(userId: number, file: { buffer: Buffer } | undefined) {
    if (!file)
      throw new BadRequestException('No file sent');

    const avatarUrl = await saveAvatar(userId, file.buffer);
    if (!avatarUrl)
      throw new BadRequestException('Avatar must be a PNG, JPEG, WEBP or GIF image');

    const previous = await this.prisma.profile.findUnique({ where: { userId }, select: { avatarUrl: true } });
    await this.prisma.profile.update({ where: { userId }, data: { avatarUrl } });
    await deleteAvatar(previous?.avatarUrl ?? null);
    return this.findOne(userId);
  }

  async removeAvatar(userId: number) {
    const previous = await this.prisma.profile.findUnique({ where: { userId }, select: { avatarUrl: true } });
    await this.prisma.profile.update({ where: { userId }, data: { avatarUrl: null } });
    await deleteAvatar(previous?.avatarUrl ?? null);
    return this.findOne(userId);
  }

  // On redemande le mot de passe : un cookie vole ne doit pas suffire a supprimer le compte
  async remove(userId: number, password: string | undefined) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, profile: { select: { avatarUrl: true } } },
    });
    if (!user)
      throw new UnauthorizedException();
    if (typeof password !== 'string' || !await bcrypt.compare(password, user.password))
      throw new BadRequestException('Password is incorrect');

    // Profile, Friendship et GamePlayer partent en cascade
    await this.prisma.user.delete({ where: { id: userId } });
    await deleteAvatar(user.profile?.avatarUrl ?? null);
  }
}
