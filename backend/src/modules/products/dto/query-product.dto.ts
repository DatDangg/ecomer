import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
// Reused from the category query DTO: trims before validation so length rules
// run on the persisted value (never duplicate this transform).
import { trimString } from '../../categories/dto/trim.transform';
import { PRODUCT_NAME_MAX_LENGTH } from '../product.schema';

export const PRODUCT_SORT_FIELDS = ['price', 'createdAt', 'name'] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export const PRODUCT_SORT_ORDERS = ['asc', 'desc'] as const;
export type ProductSortOrder = (typeof PRODUCT_SORT_ORDERS)[number];

/**
 * Query for the public `GET /products` list (R-05). Extends the shared
 * pagination DTO so `page`/`limit` reuse its parsing and max-100 clamping.
 * Invalid enum/ObjectId values fail validation (400).
 */
export class QueryProductDto extends PaginationQueryDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_NAME_MAX_LENGTH)
  search?: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsMongoId()
  sellerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy: ProductSortField = 'createdAt';

  @IsOptional()
  @IsIn(PRODUCT_SORT_ORDERS)
  order: ProductSortOrder = 'desc';
}
