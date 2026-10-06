import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from './trim.transform';

export const CATEGORY_NAME_MAX_LENGTH = 120;
export const CATEGORY_IMAGE_URL_MAX_LENGTH = 500;

/**
 * Body for `POST /categories` (admin only). `slug` and `isActive` are absent
 * on purpose: `slug` is server-generated and a new category always starts
 * active, so neither can be mass-assigned (docs/PERMISSION.md guard order).
 */
export class CreateCategoryDto {
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(CATEGORY_NAME_MAX_LENGTH)
  name!: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(CATEGORY_IMAGE_URL_MAX_LENGTH)
  imageUrl?: string;
}
