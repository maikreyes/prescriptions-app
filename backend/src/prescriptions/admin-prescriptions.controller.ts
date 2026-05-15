import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/enums.js';
import { AuthenticatedUser } from '../auth/auth.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AdminPrescriptionsQueryDto } from './dto/admin-prescriptions-query.dto.js';
import { PrescriptionsService } from './prescriptions.service.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.admin)
@Controller('admin/prescriptions')
export class AdminPrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(
    @Req() request: { user: AuthenticatedUser },
    @Query() query: AdminPrescriptionsQueryDto,
  ) {
    return this.prescriptionsService.findAdminPrescriptions(
      request.user.userId,
      query,
    );
  }
}
