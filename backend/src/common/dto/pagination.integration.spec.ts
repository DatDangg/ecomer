import { Controller, Get, INestApplication, Query } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../../app.setup';
import configuration from '../../config/configuration';
import { buildPaginated, PaginationQueryDto } from './pagination-query.dto';

@Controller('paged')
class TestPagedController {
  @Get()
  list(@Query() query: PaginationQueryDto) {
    return buildPaginated([{ id: 1 }], 101, query.page, query.limit);
  }
}

describe('pagination through the global ValidationPipe', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [TestPagedController],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the paginated payload with clamped limit', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/paged?limit=150')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [{ id: 1 }],
        total: 101,
        page: 1,
        limit: 100,
        totalPages: 2,
      },
      message: 'Success',
    });
  });

  it('rejects an invalid page with a 400 error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/paged?page=0')
      .expect(400);

    expect(response.body).toMatchObject({ success: false });
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it.each([['Infinity'], ['1e999']])(
    'rejects a non-finite limit (%s) with a 400 error envelope',
    async (limit) => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/paged?limit=${limit}`)
        .expect(400);

      expect(response.body).toMatchObject({ success: false });
      expect(Array.isArray(response.body.errors)).toBe(true);
    },
  );
});
