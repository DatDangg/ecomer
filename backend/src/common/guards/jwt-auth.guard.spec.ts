import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

function executionContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorReturning(isPublic: boolean): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
}

describe('JwtAuthGuard', () => {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.CUSTOMER,
  };

  it('skips authentication on @Public() routes', () => {
    const guard = new JwtAuthGuard(reflectorReturning(true));

    expect(guard.canActivate(executionContext(user))).toBe(true);
  });

  it('throws 401 when no user was attached', () => {
    const guard = new JwtAuthGuard(reflectorReturning(false));

    expect(() => guard.handleRequest(null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('rethrows the strategy error', () => {
    const guard = new JwtAuthGuard(reflectorReturning(false));
    const strategyError = new Error('invalid token');

    expect(() => guard.handleRequest(strategyError, null)).toThrow(
      strategyError,
    );
  });

  it('returns the user when authentication succeeded', () => {
    const guard = new JwtAuthGuard(reflectorReturning(false));

    expect(guard.handleRequest(null, user)).toBe(user);
  });
});
