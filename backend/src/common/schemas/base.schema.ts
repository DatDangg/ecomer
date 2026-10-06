import { SchemaOptions, ToObjectOptions } from 'mongoose';

/**
 * Fields that must never leave the API. Security-sensitive values (hashed
 * credentials/tokens) and Mongo bookkeeping stay server-side, enforced here
 * once instead of per-schema.
 */
export const INTERNAL_FIELDS = [
  '__v',
  'passwordHash',
  'refreshTokenHash',
] as const;

type TransformFn = Exclude<NonNullable<ToObjectOptions['transform']>, boolean>;

const hideInternalFields: TransformFn = (_doc, ret) => {
  for (const field of INTERNAL_FIELDS) {
    delete (ret as Record<string, unknown>)[field];
  }
  return ret;
};

/**
 * Runs the per-schema transform first (if any), then the base sanitizer on the
 * final object, so internal fields are removed no matter what a schema's own
 * transform does.
 */
function composeTransform(custom?: TransformFn): TransformFn {
  return (doc, ret, options) => {
    const transformed = custom ? (custom(doc, ret, options) ?? ret) : ret;
    return hideInternalFields(doc, transformed, options) ?? transformed;
  };
}

function asTransformFn(
  value: ToObjectOptions['transform'],
): TransformFn | undefined {
  return typeof value === 'function' ? value : undefined;
}

function toObjectOptions(
  value: SchemaOptions['toJSON'] | SchemaOptions['toObject'],
): ToObjectOptions {
  return typeof value === 'object' && value !== null ? value : {};
}

/**
 * Default schema options for every collection: `createdAt`/`updatedAt`
 * timestamps and JSON/object serialization that strips internal fields.
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: { transform: hideInternalFields },
  toObject: { transform: hideInternalFields },
};

/**
 * Merges per-schema options on top of the shared base while composing (not
 * replacing) the serialization transforms, so the internal-field sanitizer
 * always runs on the final serialized object.
 */
export function withBaseSchemaOptions(
  options: SchemaOptions = {},
): SchemaOptions {
  const customToJSON = toObjectOptions(options.toJSON);
  const customToObject = toObjectOptions(options.toObject);

  return {
    ...baseSchemaOptions,
    ...options,
    toJSON: {
      ...customToJSON,
      transform: composeTransform(asTransformFn(customToJSON.transform)),
    },
    toObject: {
      ...customToObject,
      transform: composeTransform(asTransformFn(customToObject.transform)),
    },
  };
}
