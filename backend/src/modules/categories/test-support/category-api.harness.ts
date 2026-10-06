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
import { User } from '../../users/user.schema';
import { UsersService } from '../../users/users.service';
import { CategoriesController } from '../categories.controller';
import { CategoriesService, PRODUCTS_COLLECTION } from '../categories.service';
import { Category } from '../category.schema';
import {
  CategoryFixture,
  createCategoryFixture,
  createSingleQuery,
} from './category-fixture';

const ADMIN_ID = '000000000000000000000001';
const CUSTOMER_ID = '000000000000000000000002';

export interface StoredUser {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

const ADMIN_USER: StoredUser = {
  _id: ADMIN_ID,
  email: 'admin@example.com',
  fullName: 'Admin',
  role: UserRole.ADMIN,
  isActive: true,
};

const CUSTOMER_USER: StoredUser = {
  _id: CUSTOMER_ID,
  email: 'customer@example.com',
  fullName: 'Customer',
  role: UserRole.CUSTOMER,
  isActive: true,
};

function createUserModel(users: StoredUser[]) {
  return {
    findById: (id: string) =>
      createSingleQuery(users.find((user) => user._id === id) ?? null),
  };
}

function createConnection(fixture: CategoryFixture) {
  return {
    collection: (name: string) => {
      if (name !== PRODUCTS_COLLECTION) {
        throw new Error(`Unexpected collection requested: ${name}`);
      }
      return fixture.productsCollection;
    },
  };
}

async function createApp(fixture: CategoryFixture): Promise<INestApplication> {
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
    controllers: [CategoriesController],
    providers: [
      CategoriesService,
      UsersService,
      JwtStrategy,
      {
        provide: getModelToken(Category.name),
        useValue: fixture.categoryModel,
      },
      {
        provide: getModelToken(User.name),
        useValue: createUserModel([ADMIN_USER, CUSTOMER_USER]),
      },
      { provide: getConnectionToken(), useValue: createConnection(fixture) },
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
 * Boots the category controller with an in-memory model/connection so every
 * endpoint can be exercised over HTTP without a live MongoDB.
 */
export async function createCategoryApiHarness() {
  const fixture = createCategoryFixture();
  const app = await createApp(fixture);
  const jwtService = app.get(JwtService);

  const tokenFor = (user: StoredUser): string =>
    jwtService.sign({ sub: user._id, email: user.email, role: user.role });

  const http = () => request(app.getHttpServer());
  const withAuth = (
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    user: StoredUser,
  ) =>
    http()
      [method](path)
      .set('Authorization', `Bearer ${tokenFor(user)}`);

  return {
    app,
    fixture,
    admin: ADMIN_USER,
    customer: CUSTOMER_USER,
    http,
    authGet: (path: string, user: StoredUser) => withAuth('get', path, user),
    authPost: (path: string, user: StoredUser) => withAuth('post', path, user),
    authPatch: (path: string, user: StoredUser) =>
      withAuth('patch', path, user),
    authDelete: (path: string, user: StoredUser) =>
      withAuth('delete', path, user),
  };
}

export type CategoryApiHarness = Awaited<
  ReturnType<typeof createCategoryApiHarness>
>;
