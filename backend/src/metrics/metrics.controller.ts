import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/enums.js';
import { AuthenticatedUser } from '../auth/auth.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { MetricsQueryDto } from './dto/metrics-query.dto.js';
import { MetricsService } from './metrics.service.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.admin)
@Controller('admin/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics(
    @Req() request: { user: AuthenticatedUser },
    @Query() query: MetricsQueryDto,
  ) {
    return this.metricsService.getMetrics(query);
  }
}
