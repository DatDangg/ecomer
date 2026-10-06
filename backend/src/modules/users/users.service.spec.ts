import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums';
import { User } from './user.schema';
import { BCRYPT_SALT_ROUNDS, UsersService } from './users.service';

interface QueryMock {
  select: jest.Mock;
  exec: jest.Mock;
}

interface ModelMock {
  findById: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  query: QueryMock;
}

function createModelMock(queryResult: unknown = null): ModelMock {
  const query: QueryMock = {
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(queryResult),
  };
  return {
    findById: jest.fn(() => query),
    findOne: jest.fn(() => query),
    create: jest.fn().mockResolvedValue(queryResult),
    query,
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

describe('UsersService', () => {
  it('hashes the password with bcrypt on create and never stores it raw', async () => {
    const model = createModelMock();
    const service = await createService(model);

    await service.create({
      email: 'New@Example.COM',
      password: 'plain-secret',
      fullName: 'New User',
    });

    const created = model.create.mock.calls[0][0] as {
      email: string;
      passwordHash: string;
      fullName: string;
      role: UserRole;
      isActive: boolean;
    };

    expect(created.email).toBe('new@example.com');
    expect(created.passwordHash).not.toBe('plain-secret');
    expect(await bcrypt.compare('plain-secret', created.passwordHash)).toBe(
      true,
    );
    expect(created.role).toBe(UserRole.CUSTOMER);
    expect(created.isActive).toBe(true);
  });

  it('uses the configured bcrypt salt rounds', async () => {
    const model = createModelMock();
    const service = await createService(model);

    await service.create({
      email: 'user@example.com',
      password: 'plain-secret',
      fullName: 'User',
    });

    const { passwordHash } = model.create.mock.calls[0][0] as {
      passwordHash: string;
    };

    expect(Number.parseInt(passwordHash.split('$')[2], 10)).toBe(
      BCRYPT_SALT_ROUNDS,
    );
  });

  it('findByEmail lowercases the query and selects the password hash', async () => {
    const model = createModelMock();
    const service = await createService(model);

    await service.findByEmail('Mixed@Example.COM');

    expect(model.findOne).toHaveBeenCalledWith({ email: 'mixed@example.com' });
    expect(model.query.select).toHaveBeenCalledWith('+passwordHash');
  });

  it('findById looks the user up by id', async () => {
    const model = createModelMock();
    const service = await createService(model);

    await service.findById('user-id');

    expect(model.findById).toHaveBeenCalledWith('user-id');
    expect(model.query.exec).toHaveBeenCalled();
  });
});
