import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationQueryDto: PaginationQueryDto) {
    const skip = (paginationQueryDto.page - 1) * paginationQueryDto.limit;

    const where: Prisma.UserWhereInput = {
      role: Role.patient,
    };

    const [total, patients] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: paginationQueryDto.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
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
      data: patients,
      meta: {
        page: paginationQueryDto.page,
        limit: paginationQueryDto.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / paginationQueryDto.limit)),
      },
    };
  }
}
