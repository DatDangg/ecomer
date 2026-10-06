import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';

interface UsersServiceMock {
  findById: jest.Mock;
}

function createStrategy(users: UsersServiceMock): JwtStrategy {
  const config = {
    get: (key: string) => {
      const values: Record<string, string> = {
        jwtSecret: 'access-secret',
        jwtRefreshSecret: 'refresh-secret',
      };
      return values[key];
    },
  } as unknown as ConfigService;

  return new JwtStrategy(config, users as unknown as UsersService);
}

describe('JwtStrategy.validate', () => {
  const id = new Types.ObjectId().toHexString();
  const payload = {
    sub: id,
    email: 'user@example.com',
    role: UserRole.CUSTOMER,
  };

  it('returns the authenticated user when the account is active', async () => {
    const users: UsersServiceMock = {
      findById: jest.fn().mockResolvedValue({
        _id: id,
        email: 'user@example.com',
        role: UserRole.CUSTOMER,
        isActive: true,
      }),
    };

    await expect(createStrategy(users).validate(payload)).resolves.toEqual({
      id,
      email: 'user@example.com',
      role: UserRole.CUSTOMER,
    });
  });

  it('rejects a banned account with 403 even though the token is valid', async () => {
    const users: UsersServiceMock = {
      findById: jest.fn().mockResolvedValue({
        _id: id,
        email: 'user@example.com',
        role: UserRole.CUSTOMER,
        isActive: false,
      }),
    };

    await expect(createStrategy(users).validate(payload)).rejects.toThrow(
      new ForbiddenException('Tài khoản đã bị khóa'),
    );
  });

  it('rejects an unknown account with 401', async () => {
    const users: UsersServiceMock = {
      findById: jest.fn().mockResolvedValue(null),
    };

    await expect(
      createStrategy(users).validate(payload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a malformed subject without querying the database', async () => {
    const users: UsersServiceMock = { findById: jest.fn() };

    await expect(
      createStrategy(users).validate({ ...payload, sub: 'not-an-object-id' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.findById).not.toHaveBeenCalled();
  });
});
