import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { configureApp } from '../app.setup';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import configuration from '../config/configuration';
import { AuthController } from '../modules/auth/auth.controller';
import { AuthService } from '../modules/auth/auth.service';
import { buildJwtModuleOptions } from '../modules/auth/jwt.config';
import { JwtStrategy } from '../modules/auth/jwt.strategy';
import { Product } from '../modules/products/product.schema';
import { ProductsController } from '../modules/products/products.controller';
import { ProductsService } from '../modules/products/products.service';
import { createProductFixture } from '../modules/products/test-support/product-fixture';
import { User } from '../modules/users/user.schema';
import { UsersService } from '../modules/users/users.service';
import { createUserStore } from './test-support/smoke-user-store';

// Test-only throttler settings (never production): a high limit keeps the
// repeated auth calls in this suite from being rate-limited.
const SMOKE_THROTTLE_LIMIT = 1000;
const SMOKE_THROTTLE_TTL_MS = 60_000;

type ProductFixture = ReturnType<typeof createProductFixture>;

/** Seeds one visible product plus hidden/blocked ones for the visibility checks. */
function seedSmokeProducts(products: ProductFixture) {
  const category = products.seedCategory({ name: 'Điện thoại' });
  const seller = products.seedSeller({ shopName: 'Shop Smoke' });
  const visible = products.seedProduct({
    name: 'Smoke Phone',
    slug: 'smoke-phone',
    categoryId: category._id,
    sellerId: seller._id,
  });
  const hidden = products.seedProduct({
    slug: 'smoke-hidden',
    isActive: false,
  });
  const blocked = products.seedProduct({
    slug: 'smoke-blocked',
    isBlocked: true,
  });
  return {
    visibleId: visible._id,
    hiddenId: hidden._id,
    blockedId: blocked._id,
  };
}

/** Boots a minimal Nest app with the real auth + products controllers. */
async function createSmokeApp(
  userStore: ReturnType<typeof createUserStore>,
  products: ProductFixture,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ThrottlerModule.forRoot([
        { ttl: SMOKE_THROTTLE_TTL_MS, limit: SMOKE_THROTTLE_LIMIT },
      ]),
      JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: buildJwtModuleOptions,
      }),
      PassportModule,
    ],
    controllers: [AuthController, ProductsController],
    providers: [
      AuthService,
      JwtStrategy,
      ProductsService,
      { provide: UsersService, useValue: userStore.usersService },
      { provide: getModelToken(User.name), useValue: userStore.userModel },
      { provide: getModelToken(Product.name), useValue: products.productModel },
      { provide: getConnectionToken(), useValue: products.connection },
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: APP_GUARD, useClass: JwtAuthGuard },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

/** Registers then logs in the smoke user, capturing both HTTP responses. */
async function registerAndLogin(
  app: INestApplication,
  credentials: { email: string; password: string },
) {
  const registerResponse = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send(credentials);
  const loginResponse = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: credentials.email, password: credentials.password });
  return { registerResponse, loginResponse };
}

describe('Basic flow smoke (HTTP, in-memory)', () => {
  const credentials = {
    email: 'smoke@example.com',
    password: 'Smoke123',
    fullName: 'Smoke User',
  };

  let app: INestApplication;
  let visibleProductId: string;
  let hiddenProductId: string;
  let blockedProductId: string;
  let registerResponse: request.Response;
  let loginResponse: request.Response;

  beforeAll(async () => {
    const userStore = createUserStore();
    const products = createProductFixture();
    const ids = seedSmokeProducts(products);
    visibleProductId = ids.visibleId;
    hiddenProductId = ids.hiddenId;
    blockedProductId = ids.blockedId;

    app = await createSmokeApp(userStore, products);
    ({ registerResponse, loginResponse } = await registerAndLogin(
      app,
      credentials,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register returns 201 and never leaks credentials', () => {
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toMatchObject({
      success: true,
      data: { email: credentials.email, fullName: credentials.fullName },
    });
    expect(JSON.stringify(registerResponse.body)).not.toContain('password');
  });

  it('POST /auth/login returns 200 with user + access + refresh tokens', () => {
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user).toMatchObject({
      email: credentials.email,
      fullName: credentials.fullName,
      role: 'customer',
    });
    expect(loginResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.data.refreshToken).toEqual(expect.any(String));
    expect(JSON.stringify(loginResponse.body)).not.toContain('passwordHash');
  });

  it('GET /products (no token) returns only active, non-blocked products', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ total: 1 });
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0]).toMatchObject({
      id: visibleProductId,
      slug: 'smoke-phone',
    });
    const slugs = response.body.data.items.map(
      (item: { slug: string }) => item.slug,
    );
    expect(slugs).not.toContain('smoke-hidden');
    expect(slugs).not.toContain('smoke-blocked');
  });

  it('GET /products/:id returns 200 with the visible product', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/products/${visibleProductId}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: visibleProductId,
      slug: 'smoke-phone',
      category: { name: 'Điện thoại' },
      seller: { shopName: 'Shop Smoke' },
    });
  });

  it.each([
    ['a hidden product', () => hiddenProductId],
    ['a blocked product', () => blockedProductId],
    ['an unknown id', () => 'ffffffffffffffffffffffff'],
  ])('GET /products/:id returns 404 for %s', async (_label, idFactory) => {
    await request(app.getHttpServer())
      .get(`/api/v1/products/${idFactory()}`)
      .expect(404);
  });

  it('the hidden and blocked products stay out of the public list', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(200);

    const ids = response.body.data.items.map((item: { id: string }) => item.id);
    expect(ids).not.toContain(hiddenProductId);
    expect(ids).not.toContain(blockedProductId);
  });
});
