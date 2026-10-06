import { Transform, TransformFnParams } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** Shape of a paginated `data` payload (docs/API_SPEC.md §Response contract). */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return Number.NaN;
}

/**
 * Shared pagination query. A finite `limit` above `MAX_LIMIT` is clamped (not
 * rejected); non-numeric / non-finite / out-of-range values fail validation and
 * surface as HTTP 400.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    const parsed = parseNumber(value);
    return Number.isFinite(parsed) ? parsed : value;
  })
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be greater than or equal to 1' })
  page: number = DEFAULT_PAGE;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    const parsed = parseNumber(value);
    return Number.isFinite(parsed) ? Math.min(parsed, MAX_LIMIT) : value;
  })
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be greater than or equal to 1' })
  limit: number = DEFAULT_LIMIT;
}

/** Builds the paginated `data` payload, guarding against a zero `limit`. */
export function buildPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedData<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
