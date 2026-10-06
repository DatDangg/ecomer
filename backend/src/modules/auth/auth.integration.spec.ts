import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { configureApp } from '../../app.setup';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import configuration from '../../config/configuration';
import { User, UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { buildJwtModuleOptions } from './jwt.config';
import { JwtStrategy } from './jwt.strategy';

interface StoredUser {
  _id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  shopName?: string;
  refreshTokenHash?: string;
}

interface UserStore {
  store: Map<string, StoredUser>;
  seedUser: (options: {
    email: string;
    password: string;
    isActive?: boolean;
    role?: UserRole;
    fullName?: string;
  }) => Promise<StoredUser>;
  usersService: {
    create: (input: {
      email: string;
      password: string;
      fullName: string;
    }) => Promise<UserDocument>;
    findByEmail: (email: string) => Promise<UserDocument | null>;
    findById: (id: string) => Promise<UserDocument | null>;
  };
  userModel: {
    exists: (filter: { email: string }) => Promise<{ _id: string } | null>;
    findById: (id: string) => {
      select: () => { exec: () => Promise<UserDocument | null> };
    };
    findByIdAndUpdate: (
      id: string,
      update: Record<string, unknown>,
    ) => { exec: () => Promise<UserDocument | null> };
  };
}

/**
 * In-memory stand-in for MongoDB so the auth endpoints can be exercised over
 * HTTP without a live database. Mirrors the operations `AuthService` performs.
 */
function createUserStore(): UserStore {
  const store = new Map<string, StoredUser>();
  let sequence = 0;

  const nextId = (): string => {
    sequence += 1;
    // 24-char hex so the id passes Types.ObjectId.isValid, like a real Mongo _id.
    return sequence.toString(16).padStart(24, '0');
  };

  const findInStore = (email: string): StoredUser | undefined =>
    [...store.values()].find((user) => user.email === email.toLowerCase());

  const seedUser: UserStore['seedUser'] = async (options) => {
    const user: StoredUser = {
      _id: nextId(),
      email: options.email.toLowerCase(),
      passwordHash: await bcrypt.hash(options.password, 4),
      fullName: options.fullName ?? 'Test User',
      role: options.role ?? UserRole.CUSTOMER,
      isActive: options.isActive ?? true,
    };
    store.set(user._id, user);
    return user;
  };

  const usersService: UserStore['usersService'] = {
    create: async (input) => (await seedUser(input)) as unknown as UserDocument,
    findByEmail: async (email) =>
      (findInStore(email) ?? null) as unknown as UserDocument | null,
    findById: async (id) =>
      (store.get(id) ?? null) as unknown as UserDocument | null,
  };

  const userModel: UserStore['userModel'] = {
    exists: async (filter) =>
      findInStore(filter.email) ? { _id: filter.email } : null,
    findById: (id) => ({
      select: () => ({
        exec: async () =>
          (store.get(id) ?? null) as unknown as UserDocument | null,
      }),
    }),
    findByIdAndUpdate: (id, update) => ({
      exec: async () => {
        const user = store.get(id);
        if (!user) {
          return null;
        }
        if ('refreshTokenHash' in update) {
          user.refreshTokenHash = update.refreshTokenHash as string;
        }
        const unset = update.$unset as Record<string, unknown> | undefined;
        if (unset && 'refreshTokenHash' in unset) {
          delete user.refreshTokenHash;
        }
        return user as unknown as UserDocument;
      },
    }),
  };

  return { store, seedUser, usersService, userModel };
}

describe('Auth API (HTTP)', () => {
  const password = 'Secret123';
  let app: INestApplication;
  let jwtService: JwtService;
  let fixture: UserStore;

  beforeAll(async () => {
    fixture = createUserStore();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: buildJwtModuleOptions,
        }),
        PassportModule,
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: UsersService, useValue: fixture.usersService },
        { provide: getModelToken(User.name), useValue: fixture.userModel },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    jwtService = moduleRef.get(JwtService);
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register creates a customer and never leaks credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'Register@Example.com', password, fullName: 'New User' })
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: {
        userId: expect.any(String),
        email: 'register@example.com',
        fullName: 'New User',
      },
      message: 'Success',
    });
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  it('POST /auth/register rejects a duplicate email with 409', async () => {
    await fixture.seedUser({ email: 'dup@example.com', password });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password, fullName: 'Dup' })
      .expect(409);

    expect(response.body).toMatchObject({ success: false });
  });

  it('POST /auth/register maps a duplicate-key race to 409', async () => {
    const originalCreate = fixture.usersService.create;
    fixture.usersService.create = async () => {
      throw Object.assign(new Error('E11000 duplicate key error'), {
        code: 11000,
      });
    };
    try {
      // Simulates the losing request of a concurrent registration: exists()
      // passed, but the unique index rejected the insert.
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'race@example.com', password, fullName: 'Race' })
        .expect(409);
    } finally {
      fixture.usersService.create = originalCreate;
    }
  });

  it('POST /auth/register strips a client-supplied role (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'mass@example.com',
        password,
        fullName: 'Mass',
        role: 'admin',
      })
      .expect(400);
  });

  it('POST /auth/register rejects a password over 72 UTF-8 bytes (400)', async () => {
    // 30 chars but 90 bytes: bcrypt would silently ignore bytes past 72.
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'bytes@example.com',
        password: 'ế'.repeat(30),
        fullName: 'Bytes User',
      })
      .expect(400);
  });

  it('POST /auth/login returns 200 with user + 15m access + 7d refresh tokens', async () => {
    await fixture.seedUser({ email: 'login@example.com', password });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toEqual({
      id: expect.any(String),
      email: 'login@example.com',
      fullName: 'Test User',
      role: 'customer',
      shopName: null,
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const access = jwtService.decode<{ exp: number; iat: number }>(
      response.body.data.accessToken as string,
    );
    expect(access.exp - access.iat).toBe(15 * 60);
    const refresh = jwtService.decode<{ exp: number; iat: number }>(
      response.body.data.refreshToken as string,
    );
    expect(refresh.exp - refresh.iat).toBe(7 * 24 * 60 * 60);
  });

  it('POST /auth/login rejects a wrong password with 401', async () => {
    await fixture.seedUser({ email: 'wrongpass@example.com', password });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'Nope12345' })
      .expect(401);
  });

  it('POST /auth/login rejects an inactive account with 403 and the banned message', async () => {
    await fixture.seedUser({
      email: 'banned@example.com',
      password,
      isActive: false,
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'banned@example.com', password })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Tài khoản đã bị khóa',
    });
  });

  it('POST /auth/logout without a token is 401 (global JwtAuthGuard)', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(401);
  });

  it('POST /auth/refresh issues a new access token for a valid refresh token', async () => {
    await fixture.seedUser({ email: 'refresh@example.com', password });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'refresh@example.com', password })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(200);

    expect(response.body.data.accessToken).toEqual(expect.any(String));
  });

  it('POST /auth/refresh rejects an invalid token with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' })
      .expect(401);
  });

  it('a newer login invalidates the previous refresh token (1 token/user)', async () => {
    await fixture.seedUser({ email: 'rotate@example.com', password });
    const first = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rotate@example.com', password })
      .expect(200);
    const second = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rotate@example.com', password })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.body.data.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: second.body.data.refreshToken })
      .expect(200);
  });

  it('logout clears the refresh hash so the token can no longer be used', async () => {
    await fixture.seedUser({ email: 'logout@example.com', password });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'logout@example.com', password })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(401);
  });
});
