import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { CategoriesService } from '../categories.service';
import { Category, CategoryDocument } from '../category.schema';

export const CATEGORY_ID = '0123456789abcdef01234567';
export const CREATED_AT = new Date('2026-10-01T00:00:00.000Z');

export interface QueryMock {
  sort: jest.Mock;
  exec: jest.Mock;
}

export interface ModelMock {
  create: jest.Mock;
  exists: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
}

export interface CollectionMock {
  countDocuments: jest.Mock;
}

export interface ConnectionMock {
  collection: jest.Mock;
}

/** Builds a chainable `find`-style query mock resolving to `result`. */
export function createQuery(result: unknown): QueryMock {
  const query = {
    sort: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  } as unknown as QueryMock;
  query.sort.mockReturnValue(query);
  return query;
}

/** Mongoose model double whose query methods are stubbed per test. */
export function createModelMock(): ModelMock {
  return {
    create: jest.fn(),
    exists: jest.fn().mockResolvedValue(null),
    find: jest.fn(() => createQuery([])),
    findOne: jest.fn(() => createQuery(null)),
    findByIdAndUpdate: jest.fn(() => createQuery(null)),
    findByIdAndDelete: jest.fn(() => createQuery(null)),
  };
}

/** Raw-connection double reporting `productCount` for the products collection. */
export function createConnectionMock(productCount = 0): {
  connection: ConnectionMock;
  collection: CollectionMock;
} {
  const collection: CollectionMock = {
    countDocuments: jest.fn().mockResolvedValue(productCount),
  };
  return { connection: { collection: jest.fn(() => collection) }, collection };
}

export async function createService(
  model: ModelMock,
  connection: ConnectionMock,
): Promise<CategoriesService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      CategoriesService,
      { provide: getModelToken(Category.name), useValue: model },
      { provide: getConnectionToken(), useValue: connection },
    ],
  }).compile();

  return moduleRef.get(CategoriesService);
}

export function categoryDoc(
  overrides: Partial<CategoryDocument> = {},
): CategoryDocument {
  return {
    _id: CATEGORY_ID,
    name: 'Điện thoại',
    slug: 'dien-thoai',
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  } as unknown as CategoryDocument;
}
