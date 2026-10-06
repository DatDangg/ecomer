import { INestApplication } from '@nestjs/common';
import {
  createUserApiHarness,
  UserApiHarness,
} from './test-support/user-api.harness';

describe('User shop update API (HTTP)', () => {
  let harness: UserApiHarness;
  let app: INestApplication;

  beforeAll(async () => {
    harness = await createUserApiHarness();
    app = harness.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['2 characters', 'ab'],
    ['51 characters', 'a'.repeat(51)],
    ['a name whose trimmed length is below 3', ' A '],
    ['a whitespace-only name', '   '],
  ])(
    'PATCH /users/me/shop rejects a shopName of %s (400)',
    async (_label, shopName) => {
      const user = harness.fixture.seedUser();

      await harness
        .authPatch('/api/v1/users/me/shop', user)
        .send({ shopName, pickupAddress: '45 Lê Lợi, Q1' })
        .expect(400);

      expect(user.shopName).toBeUndefined();
    },
  );

  it('PATCH /users/me/shop requires pickupAddress (400)', async () => {
    const user = harness.fixture.seedUser();

    await harness
      .authPatch('/api/v1/users/me/shop', user)
      .send({ shopName: 'Shop A', pickupAddress: '' })
      .expect(400);
  });

  it('PATCH /users/me/shop saves the shop and returns it', async () => {
    const user = harness.fixture.seedUser();

    const response = await harness
      .authPatch('/api/v1/users/me/shop', user)
      .send({ shopName: 'Shop A', pickupAddress: '45 Lê Lợi, Q1' })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: { shopName: 'Shop A', pickupAddress: '45 Lê Lợi, Q1' },
      message: 'Success',
    });
    expect(user.shopName).toBe('Shop A');
    expect(user.pickupAddress).toBe('45 Lê Lợi, Q1');
  });

  it('PATCH /users/me/shop persists the trimmed shopName', async () => {
    const user = harness.fixture.seedUser();

    const response = await harness
      .authPatch('/api/v1/users/me/shop', user)
      .send({ shopName: '  Shop A  ', pickupAddress: '45 Lê Lợi, Q1' })
      .expect(200);

    expect(response.body.data.shopName).toBe('Shop A');
    expect(user.shopName).toBe('Shop A');
  });
});
