/**
 * Test bootstrap: env validation now requires `MONGODB_URI`, and the database
 * module connects lazily in `NODE_ENV=test`, so unit/integration tests run
 * without a live MongoDB or a real secret. A real URI here only matters if a
 * test explicitly opts into database integration.
 */
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ecommerce_test';
// AuthModule signs/verifies tokens at bootstrap; tests must not depend on a
// real secret, so non-production placeholders are provided here.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
