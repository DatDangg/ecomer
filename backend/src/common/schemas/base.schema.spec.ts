import { model, Schema } from 'mongoose';
import { baseSchemaOptions, withBaseSchemaOptions } from './base.schema';

const TestModel = model(
  'BaseSchemaSpec',
  new Schema(
    {
      name: String,
      passwordHash: String,
      refreshTokenHash: String,
    },
    baseSchemaOptions,
  ),
);

/**
 * Per-schema transforms deliberately try to re-add secret fields; the composed
 * base sanitizer must still strip them on the final serialized object.
 */
const CustomTransformModel = model(
  'BaseSchemaCustomTransformSpec',
  new Schema(
    {
      name: String,
      passwordHash: String,
      refreshTokenHash: String,
    },
    withBaseSchemaOptions({
      toJSON: {
        transform: (_doc, ret) => {
          const output = ret as Record<string, unknown>;
          output.passwordHash = 're-added';
          output.customized = true;
          return ret;
        },
      },
      toObject: {
        transform: (_doc, ret) => {
          const output = ret as Record<string, unknown>;
          output.refreshTokenHash = 're-added';
          output.customized = true;
          return ret;
        },
      },
    }),
  ),
);

describe('baseSchemaOptions', () => {
  it('hides internal fields in toJSON while keeping public ones', () => {
    const doc = new TestModel({
      name: 'visible',
      passwordHash: 'hashed-password',
      refreshTokenHash: 'hashed-token',
    });

    const json = doc.toJSON() as Record<string, unknown>;

    expect(json.name).toBe('visible');
    expect(json).not.toHaveProperty('passwordHash');
    expect(json).not.toHaveProperty('refreshTokenHash');
    expect(json).not.toHaveProperty('__v');
  });

  it('hides internal fields in toObject', () => {
    const doc = new TestModel({
      name: 'visible',
      passwordHash: 'hashed-password',
    });

    const object = doc.toObject() as Record<string, unknown>;

    expect(object.name).toBe('visible');
    expect(object).not.toHaveProperty('passwordHash');
  });

  it('enables timestamps', () => {
    expect(baseSchemaOptions.timestamps).toBe(true);
  });
});

describe('withBaseSchemaOptions', () => {
  it('keeps base options while applying per-schema overrides', () => {
    const options = withBaseSchemaOptions({ collection: 'items' });

    expect(options.timestamps).toBe(true);
    expect(options.collection).toBe('items');
    expect(options.toJSON).toBeDefined();
    expect(options.toObject).toBeDefined();
  });

  it('keeps the sanitizer when a custom toJSON transform is supplied', () => {
    const doc = new CustomTransformModel({
      name: 'visible',
      passwordHash: 'hashed-password',
      refreshTokenHash: 'hashed-token',
    });

    const json = doc.toJSON() as Record<string, unknown>;

    expect(json.customized).toBe(true);
    expect(json).not.toHaveProperty('passwordHash');
    expect(json).not.toHaveProperty('refreshTokenHash');
    expect(json).not.toHaveProperty('__v');
  });

  it('keeps the sanitizer when a custom toObject transform is supplied', () => {
    const doc = new CustomTransformModel({
      name: 'visible',
      passwordHash: 'hashed-password',
      refreshTokenHash: 'hashed-token',
    });

    const object = doc.toObject() as Record<string, unknown>;

    expect(object.customized).toBe(true);
    expect(object).not.toHaveProperty('passwordHash');
    expect(object).not.toHaveProperty('refreshTokenHash');
    expect(object).not.toHaveProperty('__v');
  });
});
