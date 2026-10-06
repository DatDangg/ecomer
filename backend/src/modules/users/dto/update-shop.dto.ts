import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Trims string input before validation so length rules run on the value that
 * will actually be persisted (the schema also trims). Non-strings are passed
 * through untouched so `@IsString` can reject them.
 */
function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Body for `PATCH /users/me/shop`. Setting a shop is what makes a customer able
 * to sell (BR-USR-002); `shopName` is displayed publicly and is not required to
 * be unique (BR-USR-003).
 */
export class UpdateShopDto {
  @Transform(trimString)
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  shopName!: string;

  @IsString()
  @IsNotEmpty()
  pickupAddress!: string;
}
