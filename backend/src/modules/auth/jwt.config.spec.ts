import { ConfigService } from '@nestjs/config';
import {
  buildJwtModuleOptions,
  DEFAULT_ACCESS_TTL,
  DEFAULT_REFRESH_TTL,
  getJwtConfig,
} from './jwt.config';

function configWith(values: Record<string, unknown>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('jwt config', () => {
  const secrets = {
    jwtSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
  };

  it('falls back to 15m access / 7d refresh TTLs', () => {
    const jwt = getJwtConfig(configWith(secrets));

    expect(jwt.accessTtl).toBe(DEFAULT_ACCESS_TTL);
    expect(jwt.refreshTtl).toBe(DEFAULT_REFRESH_TTL);
  });

  it('reads the TTLs from the environment when provided', () => {
    const jwt = getJwtConfig(
      configWith({
        ...secrets,
        jwtAccessTtl: '30m',
        jwtRefreshTtl: '14d',
      }),
    );

    expect(jwt.accessTtl).toBe('30m');
    expect(jwt.refreshTtl).toBe('14d');
  });

  it('registers the access secret + TTL for JwtModule', () => {
    const options = buildJwtModuleOptions(
      configWith({ ...secrets, jwtAccessTtl: '30m' }),
    );

    expect(options.secret).toBe('access-secret');
    expect(options.signOptions?.expiresIn).toBe('30m');
  });

  it('fails fast when secrets are missing', () => {
    expect(() =>
      getJwtConfig(configWith({ jwtSecret: 'only-access' })),
    ).toThrow(/JWT_SECRET and JWT_REFRESH_SECRET/);
  });
});
