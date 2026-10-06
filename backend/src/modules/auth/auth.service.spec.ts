import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import {
  AuthService,
  BANNED_ACCOUNT_MESSAGE,
  hashRefreshToken,
} from './auth.service';

const ACCESS_SECRET = 'access-secret';
const REFRESH_SECRET = 'refresh-secret';
const USER_ID = '507f1f77bcf86cd799439011';
const PLAIN_PASSWORD = 'Secret123';

interface ModelMock {
  exists: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

interface UsersServiceMock {
  create: jest.Mock;
  findByEmail: jest.Mock;
}

interface QueryMock {
  select: jest.Mock;
  exec: jest.Mock;
}

function createQueryMock(result: unknown): QueryMock {
  const query: QueryMock = {
    select: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  };
  query.select.mockReturnValue(query);
  return query;
}

function createModelMock(): ModelMock {
  return {
    exists: jest.fn().mockResolvedValue(null),
    findById: jest.fn(() => createQueryMock(null)),
    findByIdAndUpdate: jest.fn(() => ({
      exec: jest.fn().mockResolvedValue(null),
    })),
  };
}

function configMock(): ConfigService {
  const values: Record<string, string> = {
    jwtSecret: ACCESS_SECRET,
    jwtRefreshSecret: REFRESH_SECRET,
    jwtAccessTtl: '15m',
    jwtRefreshTtl: '7d',
  };
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

async function buildUser(
  overrides: Partial<UserDocument> = {},
): Promise<UserDocument> {
  const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, 4);
  return {
    _id: USER_ID,
    email: 'user@example.com',
    passwordHash,
    fullName: 'Nguyen Van A',
    role: UserRole.CUSTOMER,
    isActive: true,
    ...overrides,
  } as unknown as UserDocument;
}

describe('AuthService', () => {
  let jwtService: JwtService;
  let config: ConfigService;
  let model: ModelMock;
  let usersService: UsersServiceMock;
  let service: AuthService;

  beforeEach(() => {
    jwtService = new JwtService({
      secret: ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    });
    config = configMock();
    model = createModelMock();
    usersService = { create: jest.fn(), findByEmail: jest.fn() };
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService,
      config,
      model as unknown as Model<UserDocument>,
    );
  });

  describe('register', () => {
    it('creates a customer and returns only public fields', async () => {
      usersService.create.mockResolvedValue(
        await buildUser({ email: 'new@example.com' }),
      );

      const result = await service.register({
        email: 'New@Example.com',
        password: PLAIN_PASSWORD,
        fullName: 'Nguyen Van A',
      });

      expect(result).toEqual({
        userId: USER_ID,
        email: 'new@example.com',
        fullName: 'Nguyen Van A',
      });
      expect(JSON.stringify(result)).not.toContain('password');
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: PLAIN_PASSWORD,
        fullName: 'Nguyen Van A',
      });
    });

    it('rejects a duplicate email with 409 and never creates a second account', async () => {
      model.exists.mockResolvedValue({ _id: USER_ID });

      await expect(
        service.register({
          email: 'user@example.com',
          password: PLAIN_PASSWORD,
          fullName: 'Nguyen Van A',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns the user with 15m access and 7d refresh tokens, storing only the hash', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.login({
        email: 'user@example.com',
        password: PLAIN_PASSWORD,
      });

      expect(result.user).toEqual({
        id: USER_ID,
        email: 'user@example.com',
        fullName: 'Nguyen Van A',
        role: UserRole.CUSTOMER,
        shopName: null,
      });
      expect(JSON.stringify(result)).not.toContain('passwordHash');

      const access = jwtService.decode<{
        sub: string;
        exp: number;
        iat: number;
      }>(result.accessToken);
      expect(access.sub).toBe(USER_ID);
      expect(access.exp - access.iat).toBe(15 * 60);

      const refresh = jwtService.decode<{
        sub: string;
        exp: number;
        iat: number;
      }>(result.refreshToken);
      expect(refresh.sub).toBe(USER_ID);
      expect(refresh.exp - refresh.iat).toBe(7 * 24 * 60 * 60);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(USER_ID, {
        refreshTokenHash: hashRefreshToken(result.refreshToken),
      });
      expect(hashRefreshToken(result.refreshToken)).not.toBe(
        result.refreshToken,
      );
    });

    it('rejects a wrong password with 401', async () => {
      usersService.findByEmail.mockResolvedValue(await buildUser());

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPass1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects an unknown email with 401', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: PLAIN_PASSWORD }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an inactive account with 403 and the banned message', async () => {
      usersService.findByEmail.mockResolvedValue(
        await buildUser({ isActive: false }),
      );

      await expect(
        service.login({ email: 'user@example.com', password: PLAIN_PASSWORD }),
      ).rejects.toThrow(new ForbiddenException(BANNED_ACCOUNT_MESSAGE));
    });
  });

  describe('refresh', () => {
    async function signRefreshToken(): Promise<string> {
      return jwtService.signAsync(
        { sub: USER_ID },
        { secret: REFRESH_SECRET, expiresIn: '7d' },
      );
    }

    it('issues a new access token when the stored hash matches', async () => {
      const refreshToken = await signRefreshToken();
      const user = await buildUser({
        refreshTokenHash: hashRefreshToken(refreshToken),
      });
      model.findById.mockReturnValue(createQueryMock(user));

      const result = await service.refresh({ refreshToken });

      const access = jwtService.decode<{ sub: string }>(result.accessToken);
      expect(access.sub).toBe(USER_ID);
    });

    it('rejects a token invalidated by a newer login (1 token/user)', async () => {
      const refreshToken = await signRefreshToken();
      const user = await buildUser({
        refreshTokenHash: hashRefreshToken('a-different-newer-token'),
      });
      model.findById.mockReturnValue(createQueryMock(user));

      await expect(service.refresh({ refreshToken })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when no hash is stored (after logout)', async () => {
      const refreshToken = await signRefreshToken();
      model.findById.mockReturnValue(
        createQueryMock(await buildUser({ refreshTokenHash: undefined })),
      );

      await expect(service.refresh({ refreshToken })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired refresh token with 401', async () => {
      const expired = await jwtService.signAsync(
        { sub: USER_ID },
        { secret: REFRESH_SECRET, expiresIn: '-1s' },
      );

      await expect(
        service.refresh({ refreshToken: expired }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(model.findById).not.toHaveBeenCalled();
    });

    it('rejects a token signed with the wrong secret with 401', async () => {
      const forged = await jwtService.signAsync(
        { sub: USER_ID },
        { secret: 'attacker-secret', expiresIn: '7d' },
      );

      await expect(
        service.refresh({ refreshToken: forged }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('clears the stored refresh hash', async () => {
      await service.logout(USER_ID);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(USER_ID, {
        $unset: { refreshTokenHash: 1 },
      });
    });
  });
});
