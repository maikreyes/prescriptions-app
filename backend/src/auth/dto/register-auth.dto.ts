import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums.js';

export class RegisterAuthDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: Role, example: 'patient' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'Medicina General' })
  @ValidateIf(
    (registerAuthDto: RegisterAuthDto) =>
      (registerAuthDto.role ?? Role.patient) === Role.doctor,
  )
  @IsString()
  @MinLength(1)
  speciality?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @ValidateIf(
    (registerAuthDto: RegisterAuthDto) =>
      (registerAuthDto.role ?? Role.patient) === Role.patient,
  )
  @IsDateString()
  birthDate?: string;
}
