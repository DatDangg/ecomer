import { createMongooseOptions } from './database.module';

const URI = 'mongodb://127.0.0.1:27017/ecommerce?replicaSet=rs0';

describe('createMongooseOptions', () => {
  it('fails fast when the URI is missing', () => {
    expect(() =>
      createMongooseOptions({
        uri: '',
        nodeEnv: 'production',
        serverSelectionTimeoutMS: 5000,
      }),
    ).toThrow(/MONGODB_URI is not set/);
  });

  it('creates the connection lazily in the test environment', () => {
    const options = createMongooseOptions({
      uri: URI,
      nodeEnv: 'test',
      serverSelectionTimeoutMS: 5000,
    });

    expect(options.uri).toBe(URI);
    expect(options.lazyConnection).toBe(true);
  });

  it('connects eagerly (fail-fast) outside the test environment', () => {
    const options = createMongooseOptions({
      uri: URI,
      nodeEnv: 'production',
      serverSelectionTimeoutMS: 5000,
    });

    expect(options.lazyConnection).toBe(false);
    expect(options.serverSelectionTimeoutMS).toBe(5000);
  });
});
