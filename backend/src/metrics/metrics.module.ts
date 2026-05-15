import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsService } from './metrics.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [MetricsService, RolesGuard],
})
export class MetricsModule {}
