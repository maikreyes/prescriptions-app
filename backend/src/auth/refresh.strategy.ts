import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../generated/prisma/enums.js';

type RefreshRequest = {
  cookies?: {
    refreshToken?: string;
  };
  body?: {
    refreshToken?: unknown;
  };
};

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

const extractRefreshToken = (request: RefreshRequest) => {
  const fromCookie = request.cookies?.refreshToken;

  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }

  const fromBody = request.body?.refreshToken;

  if (typeof fromBody === 'string' && fromBody.length > 0) {
    return fromBody;
  }

  return null;
};

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
