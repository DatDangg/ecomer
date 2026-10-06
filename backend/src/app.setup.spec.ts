import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import { configureApp } from './app.setup';
import configuration from './config/configuration';

class CreateThingDto {
  @IsString()
  name!: string;
}

@Controller('things')
class TestThingsController {
  @Post()
  create(@Body() dto: CreateThingDto): CreateThingDto {
    return dto;
  }
}

describe('configureApp', () => {
  let app: INestApplication;
  const allowedOrigin = configuration().frontendUrl;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
      controllers: [TestThingsController],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves routes under the api/v1 prefix', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/things')
      .send({ name: 'a' })
      .expect(201);
  });

  it('wraps success responses in the documented envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/things')
      .send({ name: 'a' })
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: { name: 'a' },
      message: 'Success',
    });
  });

  it('rejects unknown body fields with a 400 error envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/things')
      .send({ name: 'a', isBlocked: true })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Bad Request',
    });
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('sends helmet security headers', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/things')
      .send({ name: 'a' })
      .expect(201);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('allows only the configured FRONTEND_URL origin', async () => {
    const allowed = await request(app.getHttpServer())
      .post('/api/v1/things')
      .set('Origin', allowedOrigin)
      .send({ name: 'a' });

    expect(allowed.headers['access-control-allow-origin']).toBe(allowedOrigin);

    const denied = await request(app.getHttpServer())
      .post('/api/v1/things')
      .set('Origin', 'http://evil.example.com')
      .send({ name: 'a' });

    expect(denied.headers['access-control-allow-origin']).not.toBe(
      'http://evil.example.com',
    );
  });
});
