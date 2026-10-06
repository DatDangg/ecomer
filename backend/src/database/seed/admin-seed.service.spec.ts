import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserRole } from '../../common/enums';
import { UserDocument } from '../../modules/users/user.schema';
import { AdminSeedService } from './admin-seed.service';

interface ModelMock {
  findOne: jest.Mock;
  create: jest.Mock;
}

function createModelMock(existing: unknown = null): ModelMock {
  return {
    findOne: jest.fn(() => ({ exec: jest.fn().mockResolvedValue(existing) })),
    create: jest.fn().mockResolvedValue({}),
  };
}

function configWith(values: Record<string, unknown>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

function createService(
  model: ModelMock,
  config: ConfigService,
): AdminSeedService {
  return new AdminSeedService(model as unknown as Model<UserDocument>, config);
}

describe('AdminSeedService', () => {
  it('skips entirely when ADMIN_EMAIL/ADMIN_PASSWORD are missing', async () => {
    const model = createModelMock();
    const service = createService(model, configWith({}));

    await service.onApplicationBootstrap();

    expect(model.findOne).not.toHaveBeenCalled();
    expect(model.create).not.toHaveBeenCalled();
  });

  it('creates a single admin with a bcrypt-hashed password', async () => {
    const model = createModelMock(null);
    const service = createService(
      model,
      configWith({
        adminEmail: 'Admin@Example.COM',
        adminPassword: 'plain-secret',
      }),
    );

    await service.onApplicationBootstrap();

    expect(model.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
    const created = model.create.mock.calls[0][0] as {
      email: string;
      passwordHash: string;
      role: UserRole;
      isActive: boolean;
    };
    expect(created.email).toBe('admin@example.com');
    expect(created.role).toBe(UserRole.ADMIN);
    expect(created.isActive).toBe(true);
    expect(created.passwordHash).not.toBe('plain-secret');
    expect(await bcrypt.compare('plain-secret', created.passwordHash)).toBe(
      true,
    );
  });

  it('is idempotent: an existing admin is not recreated or re-hashed', async () => {
    const model = createModelMock({ _id: 'existing-admin' });
    const service = createService(
      model,
      configWith({ adminEmail: 'admin@example.com', adminPassword: 'secret' }),
    );

    await service.onApplicationBootstrap();

    expect(model.create).not.toHaveBeenCalled();
  });

  it('treats a duplicate-key race as already seeded', async () => {
    const model = createModelMock(null);
    model.create.mockRejectedValue({ code: 11000 });
    const service = createService(
      model,
      configWith({ adminEmail: 'admin@example.com', adminPassword: 'secret' }),
    );

    await expect(
      service.seedAdmin('admin@example.com', 'secret'),
    ).resolves.toBeUndefined();
  });

  it('rethrows unexpected database errors', async () => {
    const model = createModelMock(null);
    const failure = new Error('connection lost');
    model.create.mockRejectedValue(failure);
    const service = createService(
      model,
      configWith({ adminEmail: 'admin@example.com', adminPassword: 'secret' }),
    );

    await expect(
      service.seedAdmin('admin@example.com', 'secret'),
    ).rejects.toThrow(failure);
  });
});
