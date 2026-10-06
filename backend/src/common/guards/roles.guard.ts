import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums';

/**
 * Rejects requests whose authenticated user lacks one of the `@Roles(...)`
 * values with 403. Routes without `@Roles` are unaffected.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Không có quyền truy cập');
    }
    return true;
  }
}
