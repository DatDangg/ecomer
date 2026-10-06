export interface AppConfiguration {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  mongodbUri: string;
  mongoServerSelectionTimeoutMs: number;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
  adminEmail: string;
  adminPassword: string;
}

/**
 * Loads runtime configuration from environment variables.
 * Values are validated/coerced by `env.validation.ts` before this runs.
 */
export default (): AppConfiguration => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI ?? '',
  mongoServerSelectionTimeoutMs: Number.parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? '5000',
    10,
  ),
  // Secrets stay empty until configured; consumers fail fast instead of
  // falling back to a hardcoded value. TTLs are non-secret and have defaults.
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
});
