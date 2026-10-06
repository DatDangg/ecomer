import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Validates that a string is at most `max` bytes when UTF-8 encoded.
 *
 * bcrypt only processes the first 72 bytes of a password, so a character-based
 * `MaxLength` check is not enough: distinct multibyte passwords can share the
 * same first 72 bytes and be treated as equal. Enforce the byte budget instead.
 */
export function MaxUtf8Bytes(
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'maxUtf8Bytes',
      target: object.constructor,
      propertyName,
      constraints: [max],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= max
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be at most ${max} bytes long`;
        },
      },
    });
  };
}
