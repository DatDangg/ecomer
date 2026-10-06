import { NodeEnv, validate } from './env.validation';

describe('env validation', () => {
  it('applies documented defaults when env is empty', () => {
    const result = validate({});

    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe(NodeEnv.Development);
    expect(result.FRONTEND_URL).toBe('http://localhost:5173');
  });

  it('coerces PORT from string to number', () => {
    expect(validate({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validate({ PORT: 'not-a-number' })).toThrow(
      /Invalid environment variables/,
    );
  });

  it('rejects an out-of-range PORT', () => {
    expect(() => validate({ PORT: '70000' })).toThrow(
      /Invalid environment variables/,
    );
  });

  it('rejects a malformed FRONTEND_URL', () => {
    expect(() => validate({ FRONTEND_URL: 'not a url' })).toThrow(
      /Invalid environment variables/,
    );
  });
});
