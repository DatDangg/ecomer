import { INestApplication } from '@nestjs/common';
import {
  createProductApiHarness,
  ProductApiHarness,
} from './test-support/product-api.harness';

const CATEGORY_A = '0123456789abcdef01234560';
const CATEGORY_B = '0123456789abcdef01234561';
const SELLER_A = '0123456789abcdef01234562';
const SELLER_B = '0123456789abcdef01234563';

interface ProductItem {
  id: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
}

function slugsOf(body: { data: { items: ProductItem[] } }): string[] {
  return body.data.items.map((item) => item.slug);
}

describe('Product API (HTTP)', () => {
  let harness: ProductApiHarness;
  let app: INestApplication;

  beforeEach(async () => {
    harness = await createProductApiHarness();
    app = harness.app;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /products (public)', () => {
    it('returns the paginated envelope with only visible products', async () => {
      const visible = harness.fixture.seedProduct({
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
      });
      harness.fixture.seedProduct({ slug: 'hidden', isActive: false });
      harness.fixture.seedProduct({ slug: 'blocked', isBlocked: true });

      const response = await harness.http().get('/api/v1/products').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).toMatchObject({
        id: visible._id,
        slug: 'iphone-15-pro',
      });
    });

    it('keeps zero-stock products listed for the out-of-stock badge (R-05)', async () => {
      harness.fixture.seedProduct({ slug: 'sold-out', stock: 0 });

      const response = await harness.http().get('/api/v1/products').expect(200);

      expect(response.body.data.total).toBe(1);
      expect(response.body.data.items[0]).toMatchObject({
        slug: 'sold-out',
        stock: 0,
      });
    });

    it('filters by search, categoryId, sellerId and price bounds', async () => {
      harness.fixture.seedProduct({
        name: 'iPhone 15 Pro',
        slug: 'iphone',
        price: 30_000_000,
        categoryId: CATEGORY_A,
        sellerId: SELLER_A,
      });
      harness.fixture.seedProduct({
        name: 'Samsung Galaxy',
        slug: 'samsung',
        price: 20_000_000,
        categoryId: CATEGORY_B,
        sellerId: SELLER_B,
      });

      const bySearch = await harness
        .http()
        .get('/api/v1/products?search=iphone')
        .expect(200);
      expect(slugsOf(bySearch.body)).toEqual(['iphone']);

      const byCategory = await harness
        .http()
        .get(`/api/v1/products?categoryId=${CATEGORY_B}`)
        .expect(200);
      expect(slugsOf(byCategory.body)).toEqual(['samsung']);

      const bySeller = await harness
        .http()
        .get(`/api/v1/products?sellerId=${SELLER_A}`)
        .expect(200);
      expect(slugsOf(bySeller.body)).toEqual(['iphone']);

      const byPrice = await harness
        .http()
        .get('/api/v1/products?minPrice=25000000&maxPrice=35000000')
        .expect(200);
      expect(slugsOf(byPrice.body)).toEqual(['iphone']);
    });

    it('sorts by price/name/createdAt and defaults to createdAt desc', async () => {
      harness.fixture.seedProduct({
        name: 'B',
        slug: 'b',
        price: 200,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      harness.fixture.seedProduct({
        name: 'A',
        slug: 'a',
        price: 100,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      });
      harness.fixture.seedProduct({
        name: 'C',
        slug: 'c',
        price: 300,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const byDefault = await harness
        .http()
        .get('/api/v1/products')
        .expect(200);
      expect(slugsOf(byDefault.body)).toEqual(['a', 'b', 'c']);

      const priceAsc = await harness
        .http()
        .get('/api/v1/products?sortBy=price&order=asc')
        .expect(200);
      expect(
        priceAsc.body.data.items.map((item: ProductItem) => item.price),
      ).toEqual([100, 200, 300]);

      const priceDesc = await harness
        .http()
        .get('/api/v1/products?sortBy=price&order=desc')
        .expect(200);
      expect(
        priceDesc.body.data.items.map((item: ProductItem) => item.price),
      ).toEqual([300, 200, 100]);

      const nameDesc = await harness
        .http()
        .get('/api/v1/products?sortBy=name&order=desc')
        .expect(200);
      expect(slugsOf(nameDesc.body)).toEqual(['c', 'b', 'a']);
    });

    it('rejects an invalid sortBy with 400', async () => {
      await harness.http().get('/api/v1/products?sortBy=stock').expect(400);
    });

    it('clamps limit to 100 and returns an empty out-of-range page', async () => {
      for (let index = 0; index < 5; index += 1) {
        harness.fixture.seedProduct({ slug: `product-${index}` });
      }

      const capped = await harness
        .http()
        .get('/api/v1/products?limit=500')
        .expect(200);
      expect(capped.body.data.limit).toBe(100);

      const outOfRange = await harness
        .http()
        .get('/api/v1/products?page=99&limit=10')
        .expect(200);
      expect(outOfRange.body.data).toMatchObject({
        items: [],
        total: 5,
        page: 99,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('GET /products/:id (public)', () => {
    it('returns a visible product with nested category and seller', async () => {
      const category = harness.fixture.seedCategory({ name: 'Điện thoại' });
      const seller = harness.fixture.seedSeller({ shopName: 'Shop của A' });
      const product = harness.fixture.seedProduct({
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        categoryId: category._id,
        sellerId: seller._id,
      });

      const response = await harness
        .http()
        .get(`/api/v1/products/${product._id}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: product._id,
        slug: 'iphone-15-pro',
        isActive: true,
        category: { id: category._id, name: 'Điện thoại' },
        seller: { id: seller._id, shopName: 'Shop của A' },
      });
      expect(response.body.data).not.toHaveProperty('isBlocked');
      expect(response.body.data).not.toHaveProperty('blockReason');
    });

    it('degrades safely when the category or seller ref is missing', async () => {
      const product = harness.fixture.seedProduct({ slug: 'orphan' });

      const response = await harness
        .http()
        .get(`/api/v1/products/${product._id}`)
        .expect(200);

      expect(response.body.data.category).toBeNull();
      expect(response.body.data.seller).toMatchObject({
        id: product.sellerId,
        shopName: null,
      });
    });

    it.each([
      [
        'an inactive product',
        () => harness.fixture.seedProduct({ isActive: false })._id,
      ],
      [
        'a blocked product',
        () => harness.fixture.seedProduct({ isBlocked: true })._id,
      ],
      ['an unknown id', () => 'ffffffffffffffffffffffff'],
      ['a malformed id', () => 'not-an-object-id'],
    ])('returns 404 for %s', async (_label, idFactory) => {
      await harness.http().get(`/api/v1/products/${idFactory()}`).expect(404);
    });
  });
});
