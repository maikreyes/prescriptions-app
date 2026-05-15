import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsOptional } from 'class-validator';
import { PrescriptionStatus } from '../../../generated/prisma/enums.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class DoctorPrescriptionsQueryDto extends PaginationQueryDto {
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  mine?: boolean;

  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
