import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** Trims string input before validation; non-strings pass through for rejection. */
function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Body for `PATCH /users/me`. Only checkout-prefill fields are editable.
 * `email`, `role`, `isActive` and the shop fields are intentionally absent: the
 * global `ValidationPipe` rejects unknown keys, so they can never be mass
 * assigned (docs/PERMISSION.md guard order).
 */
export class UpdateProfileDto {
  /**
   * `@ValidateIf` (not `@IsOptional`) so a JSON `null` is validated and rejected
   * rather than skipped; only an omitted field stays optional. Trimming first
   * makes whitespace-only names fail `@IsNotEmpty`, matching the required,
   * trimmed `fullName` in the schema.
   */
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
