import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Role } from '../../../generated/prisma/enums.js';

export type UserRole = 'doctor' | 'patient';

export class FindUsersQueryDto {
  @IsIn([Role.doctor, Role.patient])
  role!: UserRole;

  @IsOptional()
  @IsString()
  query?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
