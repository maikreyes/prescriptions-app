import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../../generated/prisma/enums.js';

export class RegisterAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ValidateIf(
    (registerAuthDto: RegisterAuthDto) =>
      (registerAuthDto.role ?? Role.patient) === Role.doctor,
  )
  @IsString()
  @MinLength(1)
  speciality?: string;

  @ValidateIf(
    (registerAuthDto: RegisterAuthDto) =>
      (registerAuthDto.role ?? Role.patient) === Role.patient,
  )
  @IsDateString()
  birthDate?: string;
}
