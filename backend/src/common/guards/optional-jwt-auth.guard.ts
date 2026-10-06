import {
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Allows genuine guests while attaching the user when a valid token is present.
 *
 * - No `Authorization` header → guest (`req.user` stays undefined).
 * - Header present but token invalid/expired → 401 (never silently downgraded).
 * - Valid token for a banned account → 403.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers?: Record<string, unknown> }>();
    const authorization = request.headers?.authorization;
    if (authorization === undefined) {
      return true;
    }
    return (await super.canActivate(context)) as boolean;
  }

  override handleRequest<TUser = AuthenticatedUser | null>(
    err: unknown,
    user: AuthenticatedUser | false | null,
  ): TUser {
    if (err instanceof HttpException) {
      throw err;
    }
    if (err) {
      throw new UnauthorizedException();
    }
    if (!user) {
      throw new UnauthorizedException();
    }
    return user as unknown as TUser;
  }
}
