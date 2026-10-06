import { INestApplication } from '@nestjs/common';
import {
  CategoryApiHarness,
  createCategoryApiHarness,
} from './test-support/category-api.harness';

describe('Category API (HTTP)', () => {
  let harness: CategoryApiHarness;
  let app: INestApplication;

  beforeEach(async () => {
    harness = await createCategoryApiHarness();
    app = harness.app;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /categories (public)', () => {
    it('returns only active categories, sorted by name by default', async () => {
      const alpha = harness.fixture.seedCategory({
        name: 'Alpha',
        slug: 'alpha',
      });
      const beta = harness.fixture.seedCategory({ name: 'Beta', slug: 'beta' });
      harness.fixture.seedCategory({
        name: 'Hidden',
        slug: 'hidden',
        isActive: false,
      });

      const response = await harness
        .http()
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual(
        [alpha._id, beta._id],
      );
    });

    it('supports a case-insensitive name search', async () => {
      harness.fixture.seedCategory({ name: 'Điện thoại', slug: 'dien-thoai' });
      harness.fixture.seedCategory({ name: 'Thời trang', slug: 'thoi-trang' });

      const response = await harness
        .http()
        .get('/api/v1/categories?search=ĐIỆN')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('dien-thoai');
    });

    it('honours sortBy/order and returns 400 for an invalid sortBy', async () => {
      harness.fixture.seedCategory({ name: 'Alpha', slug: 'alpha' });
      harness.fixture.seedCategory({ name: 'Beta', slug: 'beta' });

      const response = await harness
        .http()
        .get('/api/v1/categories?sortBy=name&order=desc')
        .expect(200);

      expect(
        response.body.data.map((item: { name: string }) => item.name),
      ).toEqual(['Beta', 'Alpha']);

      await harness.http().get('/api/v1/categories?sortBy=price').expect(400);
    });
  });

  describe('GET /categories/:id (public)', () => {
    it('returns an active category by id', async () => {
      const category = harness.fixture.seedCategory({
        name: 'Sách',
        slug: 'sach',
      });

      const response = await harness
        .http()
        .get(`/api/v1/categories/${category._id}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: category._id,
        name: 'Sách',
        slug: 'sach',
        imageUrl: null,
        isActive: true,
      });
    });

    it.each([
      [
        'an inactive category',
        () => harness.fixture.seedCategory({ isActive: false })._id,
      ],
      ['an unknown id', () => 'ffffffffffffffffffffffff'],
      ['a malformed id', () => 'not-an-object-id'],
    ])('returns 404 for %s', async (_label, idFactory) => {
      await harness.http().get(`/api/v1/categories/${idFactory()}`).expect(404);
    });
  });

  describe('POST /categories (admin)', () => {
    it('requires authentication (401) and rejects a customer (403)', async () => {
      await harness
        .http()
        .post('/api/v1/categories')
        .send({ name: 'X' })
        .expect(401);
      await harness
        .authPost('/api/v1/categories', harness.customer)
        .send({ name: 'X' })
        .expect(403);
    });

    it('creates a category with a server-generated slug', async () => {
      const response = await harness
        .authPost('/api/v1/categories', harness.admin)
        .send({ name: 'Điện thoại', imageUrl: 'https://cdn/x.jpg' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Điện thoại',
        slug: 'dien-thoai',
        imageUrl: 'https://cdn/x.jpg',
        isActive: true,
      });
      expect(response.body.data.id).toEqual(expect.any(String));
    });

    it('returns 409 for a duplicate name', async () => {
      harness.fixture.seedCategory({ name: 'Trùng', slug: 'trung' });

      await harness
        .authPost('/api/v1/categories', harness.admin)
        .send({ name: 'Trùng' })
        .expect(409);
    });

    it.each(['slug', 'isActive'])(
      'rejects mass-assignment key "%s" with 400',
      async (field) => {
        await harness
          .authPost('/api/v1/categories', harness.admin)
          .send({ name: 'Hợp lệ', [field]: 'attacker' })
          .expect(400);
      },
    );

    it('rejects a missing name with 400', async () => {
      await harness
        .authPost('/api/v1/categories', harness.admin)
        .send({})
        .expect(400);
    });
  });

  describe('PATCH /categories/:id (admin)', () => {
    it('rejects a customer with 403', async () => {
      const category = harness.fixture.seedCategory();

      await harness
        .authPatch(`/api/v1/categories/${category._id}`, harness.customer)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('updates editable fields but keeps the slug immutable', async () => {
      const category = harness.fixture.seedCategory({
        name: 'Điện thoại',
        slug: 'dien-thoai',
      });

      const response = await harness
        .authPatch(`/api/v1/categories/${category._id}`, harness.admin)
        .send({
          name: 'Thời trang',
          imageUrl: 'https://res.cloudinary.com/x.jpg',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        name: 'Thời trang',
        slug: 'dien-thoai',
        imageUrl: 'https://res.cloudinary.com/x.jpg',
      });
      expect(harness.fixture.findCategory(category._id)?.slug).toBe(
        'dien-thoai',
      );
    });

    it('deactivates a category so it disappears from public reads', async () => {
      const category = harness.fixture.seedCategory({
        name: 'Sắp ẩn',
        slug: 'sap-an',
      });

      await harness
        .authPatch(`/api/v1/categories/${category._id}`, harness.admin)
        .send({ isActive: false })
        .expect(200);

      await harness
        .http()
        .get(`/api/v1/categories/${category._id}`)
        .expect(404);
    });

    it('returns 409 when renaming to an existing name', async () => {
      harness.fixture.seedCategory({ name: 'Đã dùng', slug: 'da-dung' });
      const category = harness.fixture.seedCategory({
        name: 'Khác',
        slug: 'khac',
      });

      await harness
        .authPatch(`/api/v1/categories/${category._id}`, harness.admin)
        .send({ name: 'Đã dùng' })
        .expect(409);
    });

    it('rejects a slug in the body with 400', async () => {
      const category = harness.fixture.seedCategory();

      await harness
        .authPatch(`/api/v1/categories/${category._id}`, harness.admin)
        .send({ slug: 'hacked' })
        .expect(400);
    });

    it('returns 404 for an unknown id', async () => {
      await harness
        .authPatch('/api/v1/categories/ffffffffffffffffffffffff', harness.admin)
        .send({ name: 'X' })
        .expect(404);
    });
  });

  describe('DELETE /categories/:id (admin)', () => {
    it('rejects a customer with 403', async () => {
      const category = harness.fixture.seedCategory();

      await harness
        .authDelete(`/api/v1/categories/${category._id}`, harness.customer)
        .expect(403);
    });

    it('returns 400 while a product still references the category', async () => {
      const category = harness.fixture.seedCategory({
        name: 'Có SP',
        slug: 'co-sp',
      });
      harness.fixture.seedProduct(category._id);

      const response = await harness
        .authDelete(`/api/v1/categories/${category._id}`, harness.admin)
        .expect(400);

      expect(response.body).toMatchObject({ success: false });
      expect(response.body.message).toContain('sản phẩm');
      expect(harness.fixture.findCategory(category._id)).toBeDefined();
    });

    it('deletes the category once no product references it', async () => {
      const category = harness.fixture.seedCategory({
        name: 'Xoá được',
        slug: 'xoa-duoc',
      });

      const response = await harness
        .authDelete(`/api/v1/categories/${category._id}`, harness.admin)
        .expect(200);

      expect(response.body.data).toEqual({ id: category._id });
      expect(harness.fixture.findCategory(category._id)).toBeUndefined();
    });

    it('returns 404 for an unknown id', async () => {
      await harness
        .authDelete(
          '/api/v1/categories/ffffffffffffffffffffffff',
          harness.admin,
        )
        .expect(404);
    });
  });
});
