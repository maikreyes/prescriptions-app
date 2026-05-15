import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/enums.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { DoctorsService } from './doctors.service.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.patient)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.doctorsService.findAll(paginationQueryDto);
  }
}
