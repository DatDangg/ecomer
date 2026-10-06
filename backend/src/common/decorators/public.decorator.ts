import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route/controller as public so `JwtAuthGuard` skips authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
