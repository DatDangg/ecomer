import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

describe('global throttling (AppModule)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 429 once the configured 100 req/min limit is exceeded', async () => {
    const server = app.getHttpServer();

    for (let i = 0; i < 100; i += 1) {
      await request(server).get('/api/v1/health').expect(200);
    }

    const blocked = await request(server).get('/api/v1/health').expect(429);
    expect(blocked.body).toMatchObject({ success: false });
  }, 30_000);
});
