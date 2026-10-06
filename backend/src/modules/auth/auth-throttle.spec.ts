import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { configureApp } from '../../app.setup';
import configuration from '../../config/configuration';
import { AuthController, AUTH_THROTTLE_LIMIT } from './auth.controller';
import { AuthService } from './auth.service';

describe('auth throttling (10 req/min/IP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const authServiceMock = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn().mockResolvedValue({ accessToken: 'token' }),
      logout: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 429 once the per-endpoint auth limit is exceeded', async () => {
    const server = app.getHttpServer();

    for (let i = 0; i < AUTH_THROTTLE_LIMIT; i += 1) {
      await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'token' })
        .expect(200);
    }

    const blocked = await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'token' })
      .expect(429);

    expect(blocked.body).toMatchObject({ success: false });
  });
});
