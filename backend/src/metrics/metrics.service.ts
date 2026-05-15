import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsQueryDto } from './dto/metrics-query.dto.js';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildDateFilter(from?: string, to?: string) {
    const filter: { gte?: Date; lte?: Date } = {};

    if (from) {
      filter.gte = new Date(from);
    }

    if (to) {
      filter.lte = new Date(to);
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  async getMetrics(query: MetricsQueryDto) {
    const dateFilter = this.buildDateFilter(query.from, query.to);

    const [doctors, patients, prescriptions] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.patient.count(),
      this.prisma.prescription.count({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
      }),
    ]);

    return {
      totals: {
        doctors,
        patients,
        prescriptions,
      },
    };
  }
}
