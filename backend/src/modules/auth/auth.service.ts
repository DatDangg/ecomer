import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { Model, Types } from 'mongoose';
import { UserRole } from '../../common/enums';
import { User, UserDocument } from '../users/user.schema';
import { UsersService, verifyPassword } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { getJwtConfig } from './jwt.config';
import { JwtPayload } from './jwt.strategy';

export const BANNED_ACCOUNT_MESSAGE = 'Tài khoản đã bị khóa';

const INVALID_CREDENTIALS_MESSAGE = 'Email hoặc mật khẩu không đúng';
const INVALID_REFRESH_TOKEN_MESSAGE = 'Refresh token không hợp lệ';

/** User shape returned to clients — never includes credential/token hashes. */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  shopName: string | null;
}

export interface RegisterResult {
  userId: string;
  email: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  user: PublicUser;
}

export interface RefreshResult {
  accessToken: string;
}

/** SHA-256 of the raw refresh token. Only the hash is persisted (BR-AUTH-010). */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Constant-time comparison so a stored hash cannot be probed byte by byte. */
function refreshTokenMatches(token: string, storedHash: string): boolean {
  const provided = Buffer.from(hashRefreshToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return provided.length === stored.length && timingSafeEqual(provided, stored);
}

/** True for MongoDB's duplicate-key error (unique index violation, code 11000). */
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: String(user._id),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    shopName: user.shopName ?? null,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResult> {
    const email = dto.email.toLowerCase();
    const existing = await this.userModel.exists({ email });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    let created: UserDocument;
    try {
      created = await this.usersService.create({
        email,
        password: dto.password,
        fullName: dto.fullName,
      });
    } catch (error) {
      // Two concurrent registrations can both pass the exists() check; the
      // unique index then rejects the loser, which must still surface as 409.
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }

    return {
      userId: String(created._id),
      email: created.email,
      fullName: created.fullName,
    };
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordValid = await verifyPassword(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
    if (!user.isActive) {
      throw new ForbiddenException(BANNED_ACCOUNT_MESSAGE);
    }

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);
    await this.userModel
      .findByIdAndUpdate(user._id, {
        refreshTokenHash: hashRefreshToken(refreshToken),
      })
      .exec();

    return { user: toPublicUser(user), accessToken, refreshToken };
  }

  async refresh(dto: RefreshDto): Promise<RefreshResult> {
    const { refreshSecret } = getJwtConfig(this.config);

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        dto.refreshToken,
        { secret: refreshSecret },
      );
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    if (!Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshTokenHash')
      .exec();
    if (
      !user?.refreshTokenHash ||
      !refreshTokenMatches(dto.refreshToken, user.refreshTokenHash)
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }
    if (!user.isActive) {
      throw new ForbiddenException(BANNED_ACCOUNT_MESSAGE);
    }

    return { accessToken: await this.signAccessToken(user) };
  }

  /** Invalidates the stored token so no refresh token remains valid. */
  async logout(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } })
      .exec();
  }

  private signAccessToken(user: UserDocument): Promise<string> {
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private signRefreshToken(user: UserDocument): Promise<string> {
    const { refreshSecret, refreshTtl } = getJwtConfig(this.config);
    // `jti` makes every issued refresh token unique even within the same second,
    // so a new login genuinely rotates (invalidates) the previous token.
    return this.jwtService.signAsync(
      { sub: String(user._id), jti: randomUUID() },
      { secret: refreshSecret, expiresIn: refreshTtl },
    );
  }
}
