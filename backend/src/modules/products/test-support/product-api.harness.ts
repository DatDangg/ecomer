import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { configureApp } from '../../../app.setup';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import configuration from '../../../config/configuration';
import { Product } from '../product.schema';
import { ProductsController } from '../products.controller';
import { ProductsService } from '../products.service';
import { createProductFixture, ProductFixture } from './product-fixture';

async function createApp(fixture: ProductFixture): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }]),
    ],
    controllers: [ProductsController],
    providers: [
      ProductsService,
      {
        provide: getModelToken(Product.name),
        useValue: fixture.productModel,
      },
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
 * Boots the products controller with an in-memory model so the public
 * endpoints can be exercised over HTTP without a live MongoDB. The global auth
 * guard stays active to prove the routes are reachable without a token.
 */
export async function createProductApiHarness() {
  const fixture = createProductFixture();
  const app = await createApp(fixture);

  return {
    app,
    fixture,
    http: () => request(app.getHttpServer()),
  };
}

export type ProductApiHarness = Awaited<
  ReturnType<typeof createProductApiHarness>
>;
