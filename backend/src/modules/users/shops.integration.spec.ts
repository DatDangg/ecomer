import { INestApplication } from '@nestjs/common';
import {
  createUserApiHarness,
  UserApiHarness,
} from './test-support/user-api.harness';

describe('Public shop API (HTTP)', () => {
  let harness: UserApiHarness;
  let app: INestApplication;

  beforeAll(async () => {
    harness = await createUserApiHarness();
    app = harness.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /shops/:sellerId is public and returns shopName, joinedAt and productCount', async () => {
    const seller = harness.fixture.seedUser({
      shopName: 'Shop Product',
      pickupAddress: '45 Lê Lợi, Q1',
    });
    harness.fixture.seedProduct({
      sellerId: seller._id,
      isActive: true,
      isBlocked: false,
    });
    harness.fixture.seedProduct({
      sellerId: seller._id,
      isActive: true,
      isBlocked: true,
    });
    harness.fixture.seedProduct({
      sellerId: seller._id,
      isActive: false,
      isBlocked: false,
    });

    const response = await harness
      .http()
      .get(`/api/v1/shops/${seller._id}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        sellerId: seller._id,
        shopName: 'Shop Product',
        joinedAt: '2026-10-01T00:00:00.000Z',
        productCount: 1,
      },
      message: 'Success',
    });
  });

  it('GET /shops/:sellerId is 404 when the user has no shop', async () => {
    const user = harness.fixture.seedUser();

    await harness.http().get(`/api/v1/shops/${user._id}`).expect(404);
  });

  it('GET /shops/:sellerId is 404 when the seller is banned', async () => {
    const seller = harness.fixture.seedUser({
      isActive: false,
      shopName: 'Banned Shop',
    });

    await harness.http().get(`/api/v1/shops/${seller._id}`).expect(404);
  });

  it('GET /shops/:sellerId is 404 for an unknown id', async () => {
    await harness
      .http()
      .get('/api/v1/shops/ffffffffffffffffffffffff')
      .expect(404);
  });

  it('GET /shops/:sellerId is 404 for a malformed id', async () => {
    await harness.http().get('/api/v1/shops/not-an-object-id').expect(404);
  });
});
