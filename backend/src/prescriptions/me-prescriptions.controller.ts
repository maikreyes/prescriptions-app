import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/enums.js';
import { AuthenticatedUser } from '../auth/auth.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { PatientPrescriptionsQueryDto } from './dto/patient-prescriptions-query.dto.js';
import { PrescriptionsService } from './prescriptions.service.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.patient)
@Controller('me/prescriptions')
export class MePrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(
    @Req() request: { user: AuthenticatedUser },
    @Query() query: PatientPrescriptionsQueryDto,
  ) {
    return this.prescriptionsService.findPatientPrescriptions(
      request.user.userId,
      query,
    );
  }
}
