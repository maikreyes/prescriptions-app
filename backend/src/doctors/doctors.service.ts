import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationQueryDto: PaginationQueryDto) {
    const skip = (paginationQueryDto.page - 1) * paginationQueryDto.limit;

    const where: Prisma.UserWhereInput = {
      role: Role.doctor,
    };

    const [total, doctors] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where: { role: Role.doctor },
        skip,
        take: paginationQueryDto.limit,
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
        },
      }),
    ]);

    return {
      data: doctors,
      meta: {
        page: paginationQueryDto.page,
        limit: paginationQueryDto.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / paginationQueryDto.limit)),
      },
    };
  }
}
