import { INestApplication } from '@nestjs/common';
import { UserRole } from '../../common/enums';
import {
  createUserApiHarness,
  UserApiHarness,
} from './test-support/user-api.harness';

describe('User profile API (HTTP)', () => {
  let harness: UserApiHarness;
  let app: INestApplication;

  beforeAll(async () => {
    harness = await createUserApiHarness();
    app = harness.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users/me without a token is 401', async () => {
    await harness.http().get('/api/v1/users/me').expect(401);
  });

  it('GET /users/me returns the profile with no credential hashes', async () => {
    const user = harness.fixture.seedUser({
      phone: '0901234567',
      address: '123 Nguyễn Huệ, Q1',
      shopName: 'Shop của A',
      pickupAddress: '45 Lê Lợi, Q1',
    });

    const response = await harness
      .authGet('/api/v1/users/me', user)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        fullName: 'Test User',
        phone: '0901234567',
        address: '123 Nguyễn Huệ, Q1',
        role: 'customer',
        shopName: 'Shop của A',
        pickupAddress: '45 Lê Lợi, Q1',
      },
      message: 'Success',
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('refreshTokenHash');
  });

  it('GET /users/me reports null for unset optional fields', async () => {
    const user = harness.fixture.seedUser();

    const response = await harness
      .authGet('/api/v1/users/me', user)
      .expect(200);

    expect(response.body.data.phone).toBeNull();
    expect(response.body.data.address).toBeNull();
    expect(response.body.data.shopName).toBeNull();
  });

  it('PATCH /users/me updates only the provided profile fields', async () => {
    const user = harness.fixture.seedUser({ address: 'Old address' });

    const response = await harness
      .authPatch('/api/v1/users/me', user)
      .send({ fullName: 'Updated Name', phone: '0912345678' })
      .expect(200);

    expect(response.body.data).toMatchObject({
      fullName: 'Updated Name',
      phone: '0912345678',
      address: 'Old address',
    });
    expect(user.fullName).toBe('Updated Name');
    expect(user.phone).toBe('0912345678');
  });

  it.each(['role', 'isActive', 'email'])(
    'PATCH /users/me rejects a mass-assignment key "%s" with 400',
    async (field) => {
      const user = harness.fixture.seedUser();

      await harness
        .authPatch('/api/v1/users/me', user)
        .send({ fullName: 'Hacked', [field]: 'attacker-value' })
        .expect(400);

      expect(user.fullName).toBe('Test User');
      expect(user.role).toBe(UserRole.CUSTOMER);
      expect(user.isActive).toBe(true);
    },
  );

  it.each([
    ['an explicit null', null],
    ['a whitespace-only string', '   '],
  ])(
    'PATCH /users/me rejects fullName as %s (400) and keeps the stored name',
    async (_label, fullName) => {
      const user = harness.fixture.seedUser();

      await harness
        .authPatch('/api/v1/users/me', user)
        .send({ fullName })
        .expect(400);

      expect(user.fullName).toBe('Test User');
    },
  );

  it('PATCH /users/me persists the trimmed fullName', async () => {
    const user = harness.fixture.seedUser();

    const response = await harness
      .authPatch('/api/v1/users/me', user)
      .send({ fullName: '  Updated Name  ' })
      .expect(200);

    expect(response.body.data.fullName).toBe('Updated Name');
    expect(user.fullName).toBe('Updated Name');
  });
});
