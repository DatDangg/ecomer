import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Product, ProductDocument } from '../product.schema';
import { ProductsService } from '../products.service';

export const PRODUCT_ID = '0123456789abcdef01234567';
export const CATEGORY_ID = '0123456789abcdef01234568';
export const SELLER_ID = '0123456789abcdef01234569';
export const CREATED_AT = new Date('2026-10-01T00:00:00.000Z');

export interface QueryMock {
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  exec: jest.Mock;
}

export interface ModelMock {
  find: jest.Mock;
  findOne: jest.Mock;
  countDocuments: jest.Mock;
}

/** Builds a chainable `find`-style query mock resolving to `result`. */
export function createQuery(result: unknown): QueryMock {
  const query = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  } as unknown as QueryMock;
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

/** Query returning a fixed value; used for `findOne`/`countDocuments`. */
export function createSingleQuery<T>(value: T): { exec: jest.Mock } {
  return { exec: jest.fn().mockResolvedValue(value) };
}

/** Mongoose product model double whose query methods are stubbed per test. */
export function createModelMock(): ModelMock {
  return {
    find: jest.fn(() => createQuery([])),
    findOne: jest.fn(() => createSingleQuery(null)),
    countDocuments: jest.fn(() => createSingleQuery(0)),
  };
}

/**
 * Connection double for the `categories`/`users` ref lookups. Resolves every
 * `findOne` to the supplied refs (default: missing, i.e. `null`).
 */
export function createConnectionMock(refs?: {
  category?: { _id: string; name: string } | null;
  seller?: { _id: string; shopName?: string } | null;
}): { collection: jest.Mock } {
  const documents: Record<string, unknown> = {
    categories: refs?.category ?? null,
    users: refs?.seller ?? null,
  };
  return {
    collection: jest.fn((name: string) => ({
      findOne: jest.fn().mockResolvedValue(documents[name] ?? null),
    })),
  };
}

export async function createService(
  model: ModelMock,
  connection: { collection: jest.Mock } = createConnectionMock(),
): Promise<ProductsService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ProductsService,
      { provide: getModelToken(Product.name), useValue: model },
      { provide: getConnectionToken(), useValue: connection },
    ],
  }).compile();

  return moduleRef.get(ProductsService);
}

export function productDoc(
  overrides: Partial<ProductDocument> = {},
): ProductDocument {
  return {
    _id: PRODUCT_ID,
    sellerId: SELLER_ID,
    slug: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    description: 'Mô tả',
    price: 29990000,
    stock: 10,
    images: ['https://picsum.photos/seed/iphone-15-pro/600/600'],
    categoryId: CATEGORY_ID,
    isActive: true,
    isBlocked: false,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  } as unknown as ProductDocument;
}
