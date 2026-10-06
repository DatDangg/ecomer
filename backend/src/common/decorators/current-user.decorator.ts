import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums';

/** Identity attached to `request.user` by the JWT strategy. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

/**
 * Injects the authenticated user (or one of its properties) into a handler.
 * Use `@CurrentUser()` for the whole user or `@CurrentUser('id')` for one field.
 */
export const CurrentUser = createParamDecorator(
  (
    property: keyof AuthenticatedUser | undefined,
    context: ExecutionContext,
  ):
    | AuthenticatedUser
    | AuthenticatedUser[keyof AuthenticatedUser]
    | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return property && user ? user[property] : user;
  },
);
