import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '../enums';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

const contextWithHeaders = (
  headers: Record<string, unknown>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as unknown as ExecutionContext;

describe('OptionalJwtAuthGuard', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.CUSTOMER,
  };

  it('allows a genuine guest when no Authorization header is present', async () => {
    const guard = new OptionalJwtAuthGuard();

    await expect(guard.canActivate(contextWithHeaders({}))).resolves.toBe(true);
  });

  it('delegates to passport validation when an Authorization header is present', async () => {
    const guard = new OptionalJwtAuthGuard();
    const basePrototype = Object.getPrototypeOf(
      OptionalJwtAuthGuard.prototype,
    ) as { canActivate: (...args: unknown[]) => Promise<boolean> };
    const delegate = jest
      .spyOn(basePrototype, 'canActivate')
      .mockResolvedValue(false);

    // Empty/malformed header must not be treated as a guest request; the guard
    // hands off to passport validation instead of short-circuiting to `true`.
    await expect(
      guard.canActivate(contextWithHeaders({ authorization: '' })),
    ).resolves.toBe(false);
    expect(delegate).toHaveBeenCalledTimes(1);

    delegate.mockRestore();
  });

  it('attaches the user when a valid token was provided', () => {
    const guard = new OptionalJwtAuthGuard();

    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('rejects an invalid/expired token with 401 instead of downgrading to guest', () => {
    const guard = new OptionalJwtAuthGuard();

    expect(() => guard.handleRequest(null, false)).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.handleRequest(new Error('expired'), false)).toThrow(
      UnauthorizedException,
    );
  });

  it('still rejects a banned account with 403', () => {
    const guard = new OptionalJwtAuthGuard();

    expect(() =>
      guard.handleRequest(
        new ForbiddenException('Tài khoản đã bị khóa'),
        false,
      ),
    ).toThrow(ForbiddenException);
  });
});
