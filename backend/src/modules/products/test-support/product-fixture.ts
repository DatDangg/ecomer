const SEEDED_AT = new Date('2026-10-01T00:00:00.000Z');

export interface StoredProduct {
  _id: string;
  sellerId: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

type ProductFilter = Record<string, unknown>;

export interface StoredCategory {
  _id: string;
  name: string;
}

export interface StoredSeller {
  _id: string;
  shopName?: string;
}

function createIdGenerator(): () => string {
  let sequence = 0x200;
  return () => (sequence += 1).toString(16).padStart(24, '0');
}

function matchesPriceRange(price: number, condition: unknown): boolean {
  if (typeof condition !== 'object' || condition === null) return false;
  const { $gte, $lte } = condition as { $gte?: number; $lte?: number };
  if (typeof $gte === 'number' && price < $gte) return false;
  if (typeof $lte === 'number' && price > $lte) return false;
  return true;
}

function matchesTextSearch(name: string, condition: unknown): boolean {
  const search = (condition as { $search?: string }).$search ?? '';
  return name.toLowerCase().includes(search.toLowerCase());
}

function matchesFilter(product: StoredProduct, filter: ProductFilter): boolean {
  return Object.entries(filter).every(([key, value]) => {
    switch (key) {
      case 'isActive':
        return product.isActive === value;
      case 'isBlocked':
        return product.isBlocked === value;
      case 'categoryId':
        return product.categoryId === String(value);
      case 'sellerId':
        return product.sellerId === String(value);
      case '_id':
        return product._id === String(value);
      case 'price':
        return matchesPriceRange(product.price, value);
      case '$text':
        return matchesTextSearch(product.name, value);
      default:
        return true;
    }
  });
}

function compareValues(left: unknown, right: unknown): number {
  const l = left instanceof Date ? left.getTime() : left;
  const r = right instanceof Date ? right.getTime() : right;
  if (typeof l === 'number' && typeof r === 'number') return l - r;
  return String(l).localeCompare(String(r));
}

function createFindQuery(items: StoredProduct[]) {
  let sortSpec: Record<string, 1 | -1> | undefined;
  let skipCount = 0;
  let limitCount = Number.POSITIVE_INFINITY;

  return {
    sort(spec: Record<string, 1 | -1>) {
      sortSpec = spec;
      return this;
    },
    skip(count: number) {
      skipCount = count;
      return this;
    },
    limit(count: number) {
      limitCount = count;
      return this;
    },
    exec: async (): Promise<StoredProduct[]> => {
      const sorted = [...items];
      if (sortSpec) {
        const [key, direction] = Object.entries(sortSpec)[0];
        sorted.sort((left, right) => {
          const result = compareValues(
            left[key as keyof StoredProduct],
            right[key as keyof StoredProduct],
          );
          return direction === -1 ? -result : result;
        });
      }
      return sorted.slice(skipCount, skipCount + limitCount);
    },
  };
}

/** Minimal `exec()`-style query returning a fixed value. */
export function createSingleQuery<T>(value: T) {
  return { exec: async (): Promise<T> => value };
}

/** In-memory product store backing the public product HTTP harness. */
export function createProductFixture() {
  const nextId = createIdGenerator();
  const products: StoredProduct[] = [];
  const categories: StoredCategory[] = [];
  const sellers: StoredSeller[] = [];

  const seedProduct = (
    overrides: Partial<StoredProduct> = {},
  ): StoredProduct => {
    const product: StoredProduct = {
      _id: nextId(),
      sellerId: 'seller-1',
      slug: `product-${products.length + 1}`,
      name: `Product ${products.length + 1}`,
      description: 'Mô tả',
      price: 100000,
      stock: 10,
      images: [],
      categoryId: 'category-1',
      isActive: true,
      isBlocked: false,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      ...overrides,
    };
    products.push(product);
    return product;
  };

  const seedCategory = (
    overrides: Partial<StoredCategory> = {},
  ): StoredCategory => {
    const category: StoredCategory = {
      _id: nextId(),
      name: `Category ${categories.length + 1}`,
      ...overrides,
    };
    categories.push(category);
    return category;
  };

  const seedSeller = (overrides: Partial<StoredSeller> = {}): StoredSeller => {
    const seller: StoredSeller = { _id: nextId(), ...overrides };
    sellers.push(seller);
    return seller;
  };

  const productModel = {
    find: (filter: ProductFilter) =>
      createFindQuery(products.filter((item) => matchesFilter(item, filter))),
    findOne: (filter: ProductFilter) =>
      createSingleQuery(
        products.find((item) => matchesFilter(item, filter)) ?? null,
      ),
    countDocuments: (filter: ProductFilter) =>
      createSingleQuery(
        products.filter((item) => matchesFilter(item, filter)).length,
      ),
  };

  /** Raw connection double for the `categories`/`users` ref lookups (task-05). */
  const connection = {
    collection: (name: string) => {
      if (name === 'categories') {
        return {
          findOne: async (filter: { _id: string }) =>
            categories.find((item) => item._id === filter._id) ?? null,
        };
      }
      if (name === 'users') {
        return {
          findOne: async (filter: { _id: string }) =>
            sellers.find((item) => item._id === filter._id) ?? null,
        };
      }
      throw new Error(`Unexpected collection requested: ${name}`);
    },
  };

  return {
    products,
    categories,
    sellers,
    seedProduct,
    seedCategory,
    seedSeller,
    productModel,
    connection,
    findProduct: (id: string) => products.find((item) => item._id === id),
  };
}

export type ProductFixture = ReturnType<typeof createProductFixture>;
