import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminPrescriptionsController } from './admin-prescriptions.controller.js';
import { MePrescriptionsController } from './me-prescriptions.controller.js';
import { PrescriptionsController } from './prescriptions.controller.js';
import { PrescriptionsService } from './prescriptions.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    PrescriptionsController,
    MePrescriptionsController,
    AdminPrescriptionsController,
  ],
  providers: [PrescriptionsService, RolesGuard],
})
export class PrescriptionsModule {}
