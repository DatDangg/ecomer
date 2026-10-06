import { model, Types } from 'mongoose';
import { PRODUCT_NAME_MAX_LENGTH, ProductSchema } from './product.schema';

const ProductModel = model('ProductSchemaSpec', ProductSchema);

function validProduct(overrides: Record<string, unknown> = {}) {
  return new ProductModel({
    sellerId: new Types.ObjectId(),
    slug: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    description: 'Mô tả',
    price: 29990000,
    stock: 10,
    categoryId: new Types.ObjectId(),
    ...overrides,
  });
}

describe('ProductSchema', () => {
  it('defaults visibility flags and images, and trims name/slug', () => {
    const product = validProduct({
      slug: '  IPHONE-15-PRO  ',
      name: '  iPhone 15 Pro  ',
      stock: 0,
    });

    expect(product.isActive).toBe(true);
    expect(product.isBlocked).toBe(false);
    expect(product.images).toEqual([]);
    expect(product.name).toBe('iPhone 15 Pro');
    expect(product.slug).toBe('iphone-15-pro');
  });

  it('rejects a non-integer or non-positive price', () => {
    expect(
      validProduct({ price: 0 }).validateSync()?.errors.price,
    ).toBeDefined();
    expect(
      validProduct({ price: 1000.5 }).validateSync()?.errors.price,
    ).toBeDefined();
  });

  it('rejects a negative or non-integer stock', () => {
    expect(
      validProduct({ stock: -1 }).validateSync()?.errors.stock,
    ).toBeDefined();
    expect(
      validProduct({ stock: 1.5 }).validateSync()?.errors.stock,
    ).toBeDefined();
  });

  it('rejects a name longer than the documented maximum', () => {
    const tooLong = 'a'.repeat(PRODUCT_NAME_MAX_LENGTH + 1);
    expect(
      validProduct({ name: tooLong }).validateSync()?.errors.name,
    ).toBeDefined();
  });

  it('declares the required indexes', () => {
    const indexes = ProductSchema.indexes();

    expect(indexes.find(([fields]) => fields.slug === 1)?.[1]?.unique).toBe(
      true,
    );
    expect(indexes.find(([fields]) => fields.sellerId === 1)).toBeDefined();
    expect(indexes.find(([fields]) => fields.categoryId === 1)).toBeDefined();
    expect(indexes.find(([fields]) => fields.name === 'text')).toBeDefined();
    expect(indexes.find(([fields]) => fields.price === 1)).toBeDefined();
    expect(
      indexes.find(
        ([fields]) => fields.isActive === 1 && fields.isBlocked === 1,
      ),
    ).toBeDefined();
  });
});
