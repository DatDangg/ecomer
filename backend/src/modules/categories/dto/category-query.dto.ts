import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CATEGORY_NAME_MAX_LENGTH } from './create-category.dto';
import { trimString } from './trim.transform';

export const CATEGORY_SORT_FIELDS = ['name', 'createdAt'] as const;
export type CategorySortField = (typeof CATEGORY_SORT_FIELDS)[number];

export const CATEGORY_SORT_ORDERS = ['asc', 'desc'] as const;
export type CategorySortOrder = (typeof CATEGORY_SORT_ORDERS)[number];

/**
 * Query for the public `GET /categories` list: optional case-insensitive name
 * search plus a basic sort (R-03). Invalid enum values fail validation (400).
 */
export class CategoryQueryDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(CATEGORY_NAME_MAX_LENGTH)
  search?: string;

  @IsOptional()
  @IsIn(CATEGORY_SORT_FIELDS)
  sortBy: CategorySortField = 'name';

  @IsOptional()
  @IsIn(CATEGORY_SORT_ORDERS)
  order: CategorySortOrder = 'asc';
}
