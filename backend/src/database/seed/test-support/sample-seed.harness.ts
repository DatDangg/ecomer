import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../../common/enums';
import { Category } from '../../../modules/categories/category.schema';
import { Product } from '../../../modules/products/product.schema';
import { User } from '../../../modules/users/user.schema';
import { SampleSeedService } from '../sample-seed.service';

const MONGO_DUPLICATE_KEY_CODE = 11000;

export interface StoredCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface StoredProduct {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId | string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: Types.ObjectId | string;
  isActive: boolean;
  isBlocked: boolean;
}

export interface StoredUser {
  _id: Types.ObjectId;
  role: UserRole;
  isActive: boolean;
}

function duplicateKeyError(): { code: number } {
  return { code: MONGO_DUPLICATE_KEY_CODE };
}

/** Matches both `{ name }`/`{ slug }` and `{ $or: [{ name }, { slug }] }`. */
function matchesCategory(
  category: StoredCategory,
  filter: Record<string, unknown>,
): boolean {
  if (Array.isArray(filter.$or)) {
    return (filter.$or as Record<string, unknown>[]).some((condition) =>
      matchesCategory(category, condition),
    );
  }
  return Object.entries(filter).every(
    ([key, value]) => category[key as keyof StoredCategory] === value,
  );
}

/** In-memory category model that enforces the unique name/slug index. */
function createCategoryModel(
  categories: StoredCategory[],
  nextId: () => Types.ObjectId,
) {
  return {
    findOne: jest.fn((filter: Record<string, unknown>) => ({
      exec: async () =>
        categories.find((item) => matchesCategory(item, filter)) ?? null,
    })),
    create: jest.fn(async (doc: Omit<StoredCategory, '_id'>) => {
      if (
        categories.some(
          (item) => item.name === doc.name || item.slug === doc.slug,
        )
      ) {
        throw duplicateKeyError();
      }
      const category: StoredCategory = { _id: nextId(), ...doc };
      categories.push(category);
      return category;
    }),
  };
}

/** In-memory product model whose `create` rejects a duplicate slug. */
function createProductModel(
  products: StoredProduct[],
  nextId: () => Types.ObjectId,
) {
  return {
    exists: jest.fn(async (filter: { slug: string }) =>
      products.some((item) => item.slug === filter.slug),
    ),
    create: jest.fn(async (doc: Omit<StoredProduct, '_id'>) => {
      if (products.some((item) => item.slug === doc.slug)) {
        throw duplicateKeyError();
      }
      const product: StoredProduct = { _id: nextId(), ...doc };
      products.push(product);
      return product;
    }),
  };
}

function createUserModel(users: StoredUser[]) {
  return {
    findOne: jest.fn((filter: { role: UserRole; isActive: boolean }) => ({
      exec: async () =>
        users.find(
          (item) =>
            item.role === filter.role && item.isActive === filter.isActive,
        ) ?? null,
    })),
  };
}

/**
 * Boots `SampleSeedService` with in-memory model doubles so the idempotency of
 * the seed can be observed against real stored collections (no live MongoDB).
 */
export async function createSampleSeedHarness() {
  let idSequence = 0;
  const nextId = (): Types.ObjectId =>
    new Types.ObjectId((idSequence += 1).toString(16).padStart(24, '0'));
  const categories: StoredCategory[] = [];
  const products: StoredProduct[] = [];
  const users: StoredUser[] = [];

  const categoryModel = createCategoryModel(categories, nextId);
  const productModel = createProductModel(products, nextId);
  const userModel = createUserModel(users);

  const moduleRef = await Test.createTestingModule({
    providers: [
      SampleSeedService,
      { provide: getModelToken(Category.name), useValue: categoryModel },
      { provide: getModelToken(Product.name), useValue: productModel },
      { provide: getModelToken(User.name), useValue: userModel },
    ],
  }).compile();

  return {
    service: moduleRef.get(SampleSeedService),
    categoryModel,
    productModel,
    userModel,
    categories,
    products,
    users,
    seedCategory(overrides: Partial<StoredCategory> = {}): StoredCategory {
      const category: StoredCategory = {
        _id: nextId(),
        name: 'Danh mục',
        slug: 'danh-muc',
        isActive: true,
        ...overrides,
      };
      categories.push(category);
      return category;
    },
    seedProduct(overrides: Partial<StoredProduct> = {}): StoredProduct {
      const product: StoredProduct = {
        _id: nextId(),
        sellerId: 'seller-1',
        slug: `product-${products.length + 1}`,
        name: 'Sản phẩm',
        description: 'Mô tả',
        price: 1000,
        stock: 1,
        images: [],
        categoryId: 'category-1',
        isActive: true,
        isBlocked: false,
        ...overrides,
      };
      products.push(product);
      return product;
    },
    seedCustomer(): StoredUser {
      const user: StoredUser = {
        _id: nextId(),
        role: UserRole.CUSTOMER,
        isActive: true,
      };
      users.push(user);
      return user;
    },
  };
}

export type SampleSeedHarness = Awaited<
  ReturnType<typeof createSampleSeedHarness>
>;
