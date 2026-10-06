import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { UserDocument } from './user.schema';
import { User } from './user.schema';
import { toShopInfo, toUserProfile, UsersService } from './users.service';
import { UserRole } from '../../common/enums';

interface QueryMock {
  exec: jest.Mock;
}

interface ModelMock {
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

function createModelMock(current: unknown = null): ModelMock {
  const query: QueryMock = { exec: jest.fn().mockResolvedValue(current) };
  return {
    findById: jest.fn(() => query),
    findByIdAndUpdate: jest.fn(() => query),
  };
}

async function createService(model: ModelMock): Promise<UsersService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      { provide: getModelToken(User.name), useValue: model },
    ],
  }).compile();

  return moduleRef.get(UsersService);
}

function userDoc(overrides: Partial<UserDocument> = {}): UserDocument {
  return {
    _id: 'user-id',
    email: 'user@example.com',
    fullName: 'User',
    role: UserRole.CUSTOMER,
    ...overrides,
  } as unknown as UserDocument;
}

describe('UsersService profile & shop updates', () => {
  it('updateProfile writes only editable fields and drops anything else', async () => {
    const model = createModelMock(userDoc());
    const service = await createService(model);

    // Simulates a caller passing an extra key; the service must not persist it.
    const input = { fullName: 'New Name', role: 'admin' };
    await service.updateProfile('user-id', input);

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      { $set: { fullName: 'New Name' } },
      { new: true },
    );
    const update = model.findByIdAndUpdate.mock.calls[0][1] as {
      $set: Record<string, unknown>;
    };
    expect(update.$set).not.toHaveProperty('role');
  });

  it('updateProfile with no editable fields returns the current user', async () => {
    const existing = userDoc();
    const model = createModelMock(existing);
    const service = await createService(model);

    const result = await service.updateProfile('user-id', {});

    expect(model.findById).toHaveBeenCalledWith('user-id');
    expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it('updateShop persists shopName and pickupAddress', async () => {
    const model = createModelMock(userDoc());
    const service = await createService(model);

    await service.updateShop('user-id', {
      shopName: 'Shop A',
      pickupAddress: '45 Lê Lợi, Q1',
    });

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      {
        $set: {
          shopName: 'Shop A',
          pickupAddress: '45 Lê Lợi, Q1',
        },
      },
      { new: true },
    );
  });

  it('toUserProfile maps a document to the client contract with nulls', () => {
    const profile = toUserProfile(
      userDoc({ phone: undefined, address: undefined, shopName: undefined }),
    );

    expect(profile).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'User',
      phone: null,
      address: null,
      role: UserRole.CUSTOMER,
      shopName: null,
      pickupAddress: null,
    });
  });

  it('toShopInfo returns the persisted shop fields', () => {
    expect(
      toShopInfo(
        userDoc({ shopName: 'Shop A', pickupAddress: '45 Lê Lợi, Q1' }),
      ),
    ).toEqual({ shopName: 'Shop A', pickupAddress: '45 Lê Lợi, Q1' });
  });
});
