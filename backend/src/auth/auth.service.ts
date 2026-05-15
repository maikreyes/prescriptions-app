import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { RegisterAuthDto } from './dto/register-auth.dto.js';
import { Role } from '../../generated/prisma/enums.js';

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: Role;
};

const parseJwtExpiry = (
  value: string | undefined,
  fallback: Exclude<JwtSignOptions['expiresIn'], undefined>,
): JwtSignOptions['expiresIn'] => {
  if (!value) {
    return fallback;
  }

  const numericValue = Number(value);

  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return value as JwtSignOptions['expiresIn'];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginAuthDto: LoginAuthDto) {
    const email = loginAuthDto.email.trim().toLowerCase();
    const accessTokenExpiresIn = parseJwtExpiry(
      process.env.JWT_ACCESS_TTL,
      '15m',
    );
    const refreshTokenExpiresIn = parseJwtExpiry(
      process.env.JWT_REFRESH_TTL,
      '7d',
    );

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userWithPassword = user as typeof user & { password: string };

    const isPasswordValid = await bcrypt.compare(
      loginAuthDto.password,
      userWithPassword.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: userWithPassword.id,
      email: userWithPassword.email,
      role: userWithPassword.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      expiresIn: refreshTokenExpiresIn,
    });

    const { password: _password, ...safeUser } = userWithPassword;
    void _password;

    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }

  async register(registerAuthDto: RegisterAuthDto) {
    const email = registerAuthDto.email.trim().toLowerCase();
    const role = registerAuthDto.role ?? Role.patient;
    const birthDate = registerAuthDto.birthDate
      ? new Date(registerAuthDto.birthDate)
      : null;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(registerAuthDto.password, 10);

    const user = await this.prisma.$transaction(async (prisma) => {
      const createdUser = await prisma.user.create({
        data: {
          email,
          name: registerAuthDto.name.trim(),
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (role === Role.doctor) {
        await prisma.doctor.create({
          data: {
            userId: createdUser.id,
            speciality: registerAuthDto.speciality?.trim() || null,
          },
        });
      } else {
        await prisma.patient.create({
          data: {
            userId: createdUser.id,
            birdDate: birthDate,
          },
        });
      }

      return createdUser;
    });

    return {
      user,
    };
  }

  async refreshToken(user: AuthenticatedUser) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Invalid token user');
    }

    const accessTokenExpiresIn = parseJwtExpiry(
      process.env.JWT_ACCESS_TTL,
      '15m',
    );

    const accessToken = await this.jwtService.signAsync(
      {
        sub: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
        expiresIn: accessTokenExpiresIn,
      },
    );

    return {
      accessToken,
    };
  }

  async profile(user: AuthenticatedUser) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!currentUser) {
      throw new UnauthorizedException('User not found');
    }

    return currentUser;
  }
}
