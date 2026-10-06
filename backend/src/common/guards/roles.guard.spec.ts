import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UserRole } from '../enums';
import { RolesGuard } from './roles.guard';

function executionContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorReturning(roles?: UserRole[]): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;
}

const admin: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
};
const customer: AuthenticatedUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: UserRole.CUSTOMER,
};

describe('RolesGuard', () => {
  it('allows routes without @Roles metadata', () => {
    const guard = new RolesGuard(reflectorReturning(undefined));

    expect(guard.canActivate(executionContext(customer))).toBe(true);
  });

  it('allows an admin on an admin route', () => {
    const guard = new RolesGuard(reflectorReturning([UserRole.ADMIN]));

    expect(guard.canActivate(executionContext(admin))).toBe(true);
  });

  it('rejects a non-admin with 403', () => {
    const guard = new RolesGuard(reflectorReturning([UserRole.ADMIN]));

    expect(() => guard.canActivate(executionContext(customer))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a guest with 403', () => {
    const guard = new RolesGuard(reflectorReturning([UserRole.ADMIN]));

    expect(() => guard.canActivate(executionContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
