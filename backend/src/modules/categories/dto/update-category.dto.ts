import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  CATEGORY_IMAGE_URL_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
} from './create-category.dto';
import { trimString } from './trim.transform';

/**
 * Body for `PATCH /categories/:id` (admin only). `slug` is deliberately not a
 * field: it is derived from `name` and must never be set from a request body.
 */
export class UpdateCategoryDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CATEGORY_NAME_MAX_LENGTH)
  name?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(CATEGORY_IMAGE_URL_MAX_LENGTH)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
