import { NodeEnv, validate } from './env.validation';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/ecommerce_test';

describe('env validation', () => {
  it('applies documented defaults when optional env is empty', () => {
    const result = validate({ MONGODB_URI });

    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe(NodeEnv.Development);
    expect(result.FRONTEND_URL).toBe('http://localhost:5173');
    expect(result.MONGODB_URI).toBe(MONGODB_URI);
  });

  it('fails fast when MONGODB_URI is missing', () => {
    expect(() => validate({})).toThrow(/Invalid environment variables/);
  });

  it('coerces PORT from string to number', () => {
    expect(validate({ MONGODB_URI, PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validate({ MONGODB_URI, PORT: 'not-a-number' })).toThrow(
      /Invalid environment variables/,
    );
  });

  it('rejects an out-of-range PORT', () => {
    expect(() => validate({ MONGODB_URI, PORT: '70000' })).toThrow(
      /Invalid environment variables/,
    );
  });

  it('rejects a malformed FRONTEND_URL', () => {
    expect(() => validate({ MONGODB_URI, FRONTEND_URL: 'not a url' })).toThrow(
      /Invalid environment variables/,
    );
  });
});
