import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { configureApp } from '../../../app.setup';
import { UserRole } from '../../../common/enums';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import configuration from '../../../config/configuration';
import { buildJwtModuleOptions } from '../../auth/jwt.config';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { ShopsController } from '../shops.controller';
import { PRODUCTS_COLLECTION, ShopsService } from '../shops.service';
import { User } from '../user.schema';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';

export interface StoredUser {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: UserRole;
  isActive: boolean;
  shopName?: string;
  pickupAddress?: string;
  createdAt: Date;
  passwordHash: string;
  refreshTokenHash?: string;
}

export interface StoredProduct {
  sellerId: string;
  isActive: boolean;
  isBlocked: boolean;
}

export interface UserFixture {
  seedUser: (overrides?: Partial<StoredUser>) => StoredUser;
  seedProduct: (product: StoredProduct) => void;
  userModel: {
    findById: (id: string) => { exec: () => Promise<StoredUser | null> };
    findByIdAndUpdate: (
      id: string,
      update: Record<string, unknown>,
    ) => { exec: () => Promise<StoredUser | null> };
  };
  connection: {
    collection: (name: string) => {
      countDocuments: (filter: {
        sellerId: { toString(): string };
        isActive: boolean;
        isBlocked: boolean;
      }) => Promise<number>;
    };
  };
}

function createIdGenerator(): () => string {
  let sequence = 0;
  return () => {
    sequence += 1;
    return sequence.toString(16).padStart(24, '0');
  };
}

function createUserStore(nextId: () => string): {
  users: Map<string, StoredUser>;
  seedUser: UserFixture['seedUser'];
} {
  const users = new Map<string, StoredUser>();

  const seedUser: UserFixture['seedUser'] = (overrides = {}) => {
    const user: StoredUser = {
      _id: nextId(),
      email: `user${users.size + 1}@example.com`,
      fullName: 'Test User',
      role: UserRole.CUSTOMER,
      isActive: true,
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      passwordHash: 'secret-hash',
      ...overrides,
    };
    users.set(user._id, user);
    return user;
  };

  return { users, seedUser };
}

function createProductStore(
  products: StoredProduct[],
): UserFixture['seedProduct'] {
  return (product) => {
    products.push(product);
  };
}

function createUserModel(
  users: Map<string, StoredUser>,
): UserFixture['userModel'] {
  return {
    findById: (id) => ({ exec: async () => users.get(id) ?? null }),
    findByIdAndUpdate: (id, update) => ({
      exec: async () => {
        const user = users.get(id);
        if (!user) {
          return null;
        }
        Object.assign(user, update.$set as Partial<StoredUser>);
        return user;
      },
    }),
  };
}

function createConnection(
  products: StoredProduct[],
): UserFixture['connection'] {
  return {
    collection: (name) => {
      if (name !== PRODUCTS_COLLECTION) {
        throw new Error(`Unexpected collection requested: ${name}`);
      }
      return {
        countDocuments: async (filter) =>
          products.filter(
            (product) =>
              product.sellerId === filter.sellerId.toString() &&
              product.isActive === filter.isActive &&
              product.isBlocked === filter.isBlocked,
          ).length,
      };
    },
  };
}

/**
 * In-memory stand-in for MongoDB so the profile/shop endpoints can be exercised
 * over HTTP without a live database. Mirrors only the operations the services
 * actually perform.
 */
export function createUserFixture(): UserFixture {
  const nextId = createIdGenerator();
  const { users, seedUser } = createUserStore(nextId);
  const products: StoredProduct[] = [];
  return {
    seedUser,
    seedProduct: createProductStore(products),
    userModel: createUserModel(users),
    connection: createConnection(products),
  };
}

async function createApp(fixture: UserFixture): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }]),
      JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: buildJwtModuleOptions,
      }),
      PassportModule,
    ],
    controllers: [UsersController, ShopsController],
    providers: [
      UsersService,
      ShopsService,
      JwtStrategy,
      { provide: getModelToken(User.name), useValue: fixture.userModel },
      { provide: getConnectionToken(), useValue: fixture.connection },
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: APP_GUARD, useClass: JwtAuthGuard },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

/**
 * Boots the users/shops controllers with the in-memory fixture and returns
 * request helpers. Each spec file gets its own app and fixture instance.
 */
export async function createUserApiHarness() {
  const fixture = createUserFixture();
  const app = await createApp(fixture);
  const jwtService = app.get(JwtService);

  const tokenFor = (user: StoredUser): string =>
    jwtService.sign({ sub: user._id, email: user.email, role: user.role });

  return {
    app,
    fixture,
    http: () => request(app.getHttpServer()),
    authGet: (path: string, user: StoredUser) =>
      request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${tokenFor(user)}`),
    authPatch: (path: string, user: StoredUser) =>
      request(app.getHttpServer())
        .patch(path)
        .set('Authorization', `Bearer ${tokenFor(user)}`),
  };
}

export type UserApiHarness = Awaited<ReturnType<typeof createUserApiHarness>>;
