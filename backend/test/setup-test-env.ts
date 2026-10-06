/**
 * Test bootstrap: env validation now requires `MONGODB_URI`, and the database
 * module connects lazily in `NODE_ENV=test`, so unit/integration tests run
 * without a live MongoDB or a real secret. A real URI here only matters if a
 * test explicitly opts into database integration.
 */
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ecommerce_test';
