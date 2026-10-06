import { model } from 'mongoose';
import { CategorySchema } from './category.schema';

const CategoryModel = model('CategorySchemaSpec', CategorySchema);

describe('CategorySchema', () => {
  it('defaults isActive to true and lowercases/trims the slug', () => {
    const category = new CategoryModel({
      name: 'Điện thoại',
      slug: '  Dien-Thoai  ',
    });

    expect(category.isActive).toBe(true);
    expect(category.slug).toBe('dien-thoai');
  });

  it('leaves imageUrl undefined when not provided', () => {
    const category = new CategoryModel({
      name: 'Thời trang',
      slug: 'thoi-trang',
    });

    expect(category.imageUrl).toBeUndefined();
  });

  it('declares unique indexes on name and slug', () => {
    const indexes = CategorySchema.indexes();

    const nameIndex = indexes.find(([fields]) => fields.name === 1);
    const slugIndex = indexes.find(([fields]) => fields.slug === 1);

    expect(nameIndex?.[1]?.unique).toBe(true);
    expect(slugIndex?.[1]?.unique).toBe(true);
  });
});
