import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const DEFAULT_ACCESS_TTL = '15m';
export const DEFAULT_REFRESH_TTL = '7d';

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
}

/**
 * Reads JWT configuration from env. Secrets have no fallback: a missing value
 * fails fast instead of silently signing with a hardcoded default.
 */
export function getJwtConfig(config: ConfigService): JwtConfig {
  const accessSecret = config.get<string>('jwtSecret');
  const refreshSecret = config.get<string>('jwtRefreshSecret');

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      'JWT_SECRET and JWT_REFRESH_SECRET must be set. Configure them in the environment.',
    );
  }

  return {
    accessSecret,
    refreshSecret,
    accessTtl: config.get<string>('jwtAccessTtl') ?? DEFAULT_ACCESS_TTL,
    refreshTtl: config.get<string>('jwtRefreshTtl') ?? DEFAULT_REFRESH_TTL,
  };
}

/**
 * Options for `JwtModule.registerAsync`. Access tokens are signed with the
 * access secret/TTL; refresh tokens (access secret never used for them) are
 * signed separately by the auth layer with `refreshSecret`/`refreshTtl`.
 */
export function buildJwtModuleOptions(config: ConfigService): JwtModuleOptions {
  const { accessSecret, accessTtl } = getJwtConfig(config);
  return {
    secret: accessSecret,
    signOptions: { expiresIn: accessTtl },
  };
}
