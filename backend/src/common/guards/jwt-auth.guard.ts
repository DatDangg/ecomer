import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Enforces a valid access token. Routes/controllers marked with `@Public()`
 * skip authentication entirely. Guard order: auth → role → ownership
 * (docs/PERMISSION.md).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: AuthenticatedUser | false | null,
  ): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException();
    }
    return user as unknown as TUser;
  }
}
