export interface AppConfiguration {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  mongodbUri: string;
  mongoServerSelectionTimeoutMs: number;
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
});
