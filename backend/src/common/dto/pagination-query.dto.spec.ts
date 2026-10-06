import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  buildPaginated,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  PaginationQueryDto,
} from './pagination-query.dto';

function validatePagination(input: Record<string, unknown>): {
  dto: PaginationQueryDto;
  errors: string[];
} {
  const dto = plainToInstance(PaginationQueryDto, input);
  const errors = validateSync(dto).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );
  return { dto, errors };
}

describe('PaginationQueryDto', () => {
  it('applies documented defaults when query is empty', () => {
    const { dto, errors } = validatePagination({});

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(DEFAULT_PAGE);
    expect(dto.limit).toBe(DEFAULT_LIMIT);
  });

  it('parses string query params into numbers', () => {
    const { dto, errors } = validatePagination({ page: '3', limit: '50' });

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
  });

  it('clamps limit above the maximum instead of rejecting it', () => {
    const { dto, errors } = validatePagination({ limit: '150' });

    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(MAX_LIMIT);
  });

  it.each([['0'], ['-1'], ['abc'], ['12.5'], ['Infinity'], ['1e999']])(
    'rejects invalid page %s',
    (page) => {
      const { errors } = validatePagination({ page });

      expect(errors.length).toBeGreaterThan(0);
    },
  );

  it.each([['0'], ['-5'], ['abc'], ['Infinity'], ['1e999']])(
    'rejects invalid limit %s',
    (limit) => {
      const { errors } = validatePagination({ limit });

      expect(errors.length).toBeGreaterThan(0);
    },
  );
});

describe('buildPaginated', () => {
  it('computes totalPages by rounding up the page size', () => {
    expect(buildPaginated([1, 2, 3], 101, 1, 20)).toEqual({
      items: [1, 2, 3],
      total: 101,
      page: 1,
      limit: 20,
      totalPages: 6,
    });
  });

  it('returns zero pages for an empty result set', () => {
    expect(buildPaginated([], 0, 1, 20).totalPages).toBe(0);
  });
});
