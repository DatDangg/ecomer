import { TransformFnParams } from 'class-transformer';

/**
 * Trims string input before validation so length rules run on the persisted
 * value (the schema also trims). Non-strings pass through untouched so
 * `@IsString` can reject them.
 */
export function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
