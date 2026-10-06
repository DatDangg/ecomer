import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from './sample-seed.service';
import {
  createSampleSeedHarness,
  SampleSeedHarness,
} from './test-support/sample-seed.harness';

describe('SampleSeedService', () => {
  let harness: SampleSeedHarness;

  beforeEach(async () => {
    harness = await createSampleSeedHarness();
  });

  it('seeds the sample categories and products, including hidden/blocked/zero-stock', async () => {
    harness.seedCustomer();

    const result = await harness.service.run();

    expect(result).toEqual({
      categories: SAMPLE_CATEGORIES.length,
      productsCreated: SAMPLE_PRODUCTS.length,
      productsSkipped: 0,
    });
    expect(harness.categories).toHaveLength(SAMPLE_CATEGORIES.length);
    expect(harness.products).toHaveLength(SAMPLE_PRODUCTS.length);
    expect(harness.products.some((item) => item.stock === 0)).toBe(true);
    expect(harness.products.some((item) => item.isActive === false)).toBe(true);
    expect(harness.products.some((item) => item.isBlocked === true)).toBe(true);
    expect(
      harness.products.every((item) =>
        item.images[0]?.startsWith('https://picsum.photos/seed/'),
      ),
    ).toBe(true);
  });

  it('is idempotent: a second run creates nothing new', async () => {
    harness.seedCustomer();
    await harness.service.run();

    const second = await harness.service.run();

    expect(second).toEqual({
      categories: SAMPLE_CATEGORIES.length,
      productsCreated: 0,
      productsSkipped: SAMPLE_PRODUCTS.length,
    });
    expect(harness.categories).toHaveLength(SAMPLE_CATEGORIES.length);
    expect(harness.products).toHaveLength(SAMPLE_PRODUCTS.length);
  });

  it('reuses an existing category instead of duplicating it', async () => {
    harness.seedCategory({ name: 'Điện thoại', slug: 'dien-thoai' });

    const result = await harness.service.run();

    expect(result.categories).toBe(SAMPLE_CATEGORIES.length);
    expect(
      harness.categories.filter((item) => item.slug === 'dien-thoai'),
    ).toHaveLength(1);
  });

  it('assigns an existing active customer as seller without creating a user', async () => {
    const customer = harness.seedCustomer();

    await harness.service.run();

    expect(harness.users).toHaveLength(1);
    expect(
      harness.products.every(
        (item) => String(item.sellerId) === String(customer._id),
      ),
    ).toBe(true);
  });

  it('skips product seeding when no customer exists, creating no orphan seller reference', async () => {
    const result = await harness.service.run();

    expect(harness.users).toHaveLength(0);
    expect(harness.products).toHaveLength(0);
    expect(result).toEqual({
      categories: SAMPLE_CATEGORIES.length,
      productsCreated: 0,
      productsSkipped: 0,
    });
  });

  it('treats a category duplicate-key race as already seeded', async () => {
    harness.seedCategory({ name: 'Điện thoại', slug: 'dien-thoai' });
    harness.categoryModel.findOne.mockReturnValueOnce({
      exec: async () => null,
    });

    const result = await harness.service.run();

    expect(result.categories).toBe(SAMPLE_CATEGORIES.length);
    expect(
      harness.categories.filter((item) => item.slug === 'dien-thoai'),
    ).toHaveLength(1);
  });

  it('treats a product duplicate-key race as already seeded', async () => {
    harness.seedCustomer();
    harness.seedProduct({ slug: 'iphone-15-pro' });
    harness.productModel.exists.mockResolvedValueOnce(false);

    const result = await harness.service.run();

    expect(result.productsCreated).toBe(SAMPLE_PRODUCTS.length - 1);
    expect(result.productsSkipped).toBe(1);
    expect(
      harness.products.filter((item) => item.slug === 'iphone-15-pro'),
    ).toHaveLength(1);
  });

  it('rethrows an unexpected category error', async () => {
    const failure = new Error('connection lost');
    harness.categoryModel.create.mockRejectedValueOnce(failure);

    await expect(harness.service.run()).rejects.toThrow(failure);
  });

  it('rethrows an unexpected product error', async () => {
    harness.seedCustomer();
    const failure = new Error('write conflict');
    harness.productModel.create.mockRejectedValueOnce(failure);

    await expect(harness.service.run()).rejects.toThrow(failure);
  });
});
