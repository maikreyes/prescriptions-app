import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../../generated/prisma/enums.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { FindUsersQueryDto } from './dto/find-users-query.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const birthDate = createUserDto.birthDate
      ? new Date(createUserDto.birthDate)
      : null;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const user = await this.prisma.$transaction(async (prisma) => {
      const createdUser = await prisma.user.create({
        data: {
          email,
          name: createUserDto.name.trim(),
          password: hashedPassword,
          role: createUserDto.role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (createUserDto.role === Role.doctor) {
        await prisma.doctor.create({
          data: {
            userId: createdUser.id,
            speciality: createUserDto.speciality?.trim() || null,
          },
        });
      } else {
        await prisma.patient.create({
          data: {
            userId: createdUser.id,
            birdDate: birthDate,
          },
        });
      }

      return createdUser;
    });

    return { user };
  }

  async findAll(findUsersQueryDto: FindUsersQueryDto) {
    const normalizedQuery = findUsersQueryDto.query?.trim();
    const skip = (findUsersQueryDto.page - 1) * findUsersQueryDto.limit;

    const where: Prisma.UserWhereInput = {
      role: findUsersQueryDto.role,
      ...(normalizedQuery
        ? {
            OR: [
              {
                email: {
                  contains: normalizedQuery,
                  mode: 'insensitive' as const,
                },
              },
              {
                name: {
                  contains: normalizedQuery,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: findUsersQueryDto.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          doctor: {
            select: {
              id: true,
              speciality: true,
            },
          },
          patient: {
            select: {
              id: true,
              birdDate: true,
            },
          },
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        page: findUsersQueryDto.page,
        limit: findUsersQueryDto.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / findUsersQueryDto.limit)),
      },
    };
  }
}
