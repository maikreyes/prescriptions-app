import {
  IsDateString,
  IsEmail,
  IsIn,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../../generated/prisma/enums.js';

export type UserRole = 'doctor' | 'patient';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn([Role.doctor, Role.patient])
  role!: UserRole;

  @ValidateIf(
    (createUserDto: CreateUserDto) => createUserDto.role === Role.doctor,
  )
  @IsString()
  @MinLength(1)
  speciality?: string;

  @ValidateIf(
    (createUserDto: CreateUserDto) => createUserDto.role === Role.patient,
  )
  @IsDateString()
  birthDate?: string;
}
