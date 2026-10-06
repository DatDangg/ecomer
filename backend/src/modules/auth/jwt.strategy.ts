import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { getJwtConfig } from './jwt.config';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/**
 * Validates the access token and re-reads the account on every request so a
 * ban (`isActive = false`) takes effect immediately even while the token is
 * still within its 15m lifetime (BR-AUTH-009).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtConfig(config).accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    return { id: String(user._id), email: user.email, role: user.role };
  }
}
