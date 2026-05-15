import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/enums.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AuthenticatedUser } from '../auth/auth.service.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';
import { DoctorPrescriptionsQueryDto } from './dto/doctor-prescriptions-query.dto.js';
import { PrescriptionsService } from './prescriptions.service.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Roles(Role.doctor)
  @Post()
  create(
    @Req() request: { user: AuthenticatedUser },
    @Body() createPrescriptionDto: CreatePrescriptionDto,
  ) {
    return this.prescriptionsService.create(
      request.user.userId,
      createPrescriptionDto,
    );
  }

  @Roles(Role.doctor)
  @Get()
  findAll(
    @Req() request: { user: AuthenticatedUser },
    @Query() query: DoctorPrescriptionsQueryDto,
  ) {
    return this.prescriptionsService.findDoctorPrescriptions(
      request.user.userId,
      query,
    );
  }

  @Roles(Role.patient, Role.doctor)
  @Get(':id')
  findOne(
    @Req() request: { user: AuthenticatedUser },
    @Param('id') prescriptionId: string,
  ) {
    return this.prescriptionsService.getPrescriptionById(
      request.user.userId,
      prescriptionId,
    );
  }

  @Roles(Role.patient)
  @Get(':id/pdf')
  async downloadPdf(
    @Req() request: { user: AuthenticatedUser },
    @Param('id') prescriptionId: string,
  ) {
    return this.prescriptionsService.getPrescriptionPdf(
      request.user.userId,
      prescriptionId,
    );
  }

  @Roles(Role.patient)
  @Post(':id/consume')
  consume(
    @Req() request: { user: AuthenticatedUser },
    @Param('id') prescriptionId: string,
  ) {
    return this.prescriptionsService.consumePrescription(
      request.user.userId,
      prescriptionId,
    );
  }
}
