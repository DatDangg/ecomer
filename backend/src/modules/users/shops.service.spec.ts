import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { User, UserDocument } from './user.schema';
import { PRODUCTS_COLLECTION, ShopsService } from './shops.service';
import { UserRole } from '../../common/enums';

const SELLER_ID = '0123456789abcdef01234567';

interface QueryMock {
  exec: jest.Mock;
}

interface ModelMock {
  findById: jest.Mock;
}

interface CollectionMock {
  countDocuments: jest.Mock;
}

interface ConnectionMock {
  collection: jest.Mock;
}

function createModelMock(current: unknown): ModelMock {
  const query: QueryMock = { exec: jest.fn().mockResolvedValue(current) };
  return { findById: jest.fn(() => query) };
}

function createConnectionMock(productCount = 0): {
  connection: ConnectionMock;
  collection: CollectionMock;
} {
  const collection: CollectionMock = {
    countDocuments: jest.fn().mockResolvedValue(productCount),
  };
  return {
    connection: { collection: jest.fn(() => collection) },
    collection,
  };
}

async function createService(
  model: ModelMock,
  connection: ConnectionMock,
): Promise<ShopsService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ShopsService,
      { provide: getModelToken(User.name), useValue: model },
      { provide: getConnectionToken(), useValue: connection },
    ],
  }).compile();

  return moduleRef.get(ShopsService);
}

function seller(overrides: Partial<UserDocument> = {}): UserDocument {
  return {
    _id: SELLER_ID,
    email: 'seller@example.com',
    fullName: 'Seller',
    role: UserRole.CUSTOMER,
    isActive: true,
    shopName: 'Shop A',
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    ...overrides,
  } as unknown as UserDocument;
}

describe('ShopsService.findPublicShop', () => {
  it('returns null for a malformed seller id without touching the database', async () => {
    const model = createModelMock(null);
    const { connection, collection } = createConnectionMock();
    const service = await createService(model, connection);

    await expect(
      service.findPublicShop('not-an-object-id'),
    ).resolves.toBeNull();
    expect(model.findById).not.toHaveBeenCalled();
    expect(collection.countDocuments).not.toHaveBeenCalled();
  });

  it('returns null when the seller does not exist', async () => {
    const model = createModelMock(null);
    const { connection } = createConnectionMock();
    const service = await createService(model, connection);

    await expect(service.findPublicShop(SELLER_ID)).resolves.toBeNull();
  });

  it('returns null when the seller is banned', async () => {
    const model = createModelMock(seller({ isActive: false }));
    const { connection } = createConnectionMock();
    const service = await createService(model, connection);

    await expect(service.findPublicShop(SELLER_ID)).resolves.toBeNull();
  });

  it('returns null when the seller has not set up a shop', async () => {
    const model = createModelMock(seller({ shopName: undefined }));
    const { connection } = createConnectionMock();
    const service = await createService(model, connection);

    await expect(service.findPublicShop(SELLER_ID)).resolves.toBeNull();
  });

  it('returns public shop data and counts only active, unblocked products', async () => {
    const model = createModelMock(seller());
    const { connection, collection } = createConnectionMock(12);
    const service = await createService(model, connection);

    const result = await service.findPublicShop(SELLER_ID);

    expect(collection.countDocuments).toHaveBeenCalledWith({
      sellerId: expect.anything(),
      isActive: true,
      isBlocked: false,
    });
    const filter = collection.countDocuments.mock.calls[0][0] as {
      sellerId: { toString(): string };
    };
    expect(filter.sellerId.toString()).toBe(SELLER_ID);
    expect(connection.collection).toHaveBeenCalledWith(PRODUCTS_COLLECTION);
    expect(result).toEqual({
      sellerId: SELLER_ID,
      shopName: 'Shop A',
      joinedAt: new Date('2026-10-01T00:00:00.000Z'),
      productCount: 12,
    });
  });
});
