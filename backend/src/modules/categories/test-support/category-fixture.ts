const SEEDED_AT = new Date('2026-10-01T00:00:00.000Z');

export interface StoredCategory {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type CategoryFilter = Record<string, unknown>;

function createIdGenerator(): () => string {
  let sequence = 0x100;
  return () => (sequence += 1).toString(16).padStart(24, '0');
}

function matchesFilter(
  category: StoredCategory,
  filter: CategoryFilter,
): boolean {
  if ('slug' in filter && category.slug !== filter.slug) return false;

  if ('name' in filter) {
    const condition = filter.name;
    if (typeof condition === 'string') {
      if (category.name !== condition) return false;
    } else if (
      condition &&
      typeof condition === 'object' &&
      '$regex' in condition
    ) {
      const { $regex, $options } = condition as {
        $regex: string;
        $options?: string;
      };
      if (!new RegExp($regex, $options).test(category.name)) return false;
    }
  }

  if ('isActive' in filter && category.isActive !== filter.isActive)
    return false;

  if ('_id' in filter) {
    const condition = filter._id;
    if (condition && typeof condition === 'object' && '$ne' in condition) {
      if (category._id === String((condition as { $ne: unknown }).$ne)) {
        return false;
      }
    } else if (category._id !== String(condition)) {
      return false;
    }
  }

  return true;
}

function compareValues(left: unknown, right: unknown): number {
  const l = String(left instanceof Date ? left.getTime() : left);
  const r = String(right instanceof Date ? right.getTime() : right);
  if (l < r) return -1;
  if (l > r) return 1;
  return 0;
}

function createFindQuery(items: StoredCategory[]) {
  let sortSpec: Record<string, 1 | -1> | undefined;
  return {
    sort(spec: Record<string, 1 | -1>) {
      sortSpec = spec;
      return this;
    },
    exec: async (): Promise<StoredCategory[]> => {
      const sorted = [...items];
      if (sortSpec) {
        const [key, direction] = Object.entries(sortSpec)[0];
        sorted.sort((left, right) => {
          const result = compareValues(
            left[key as keyof StoredCategory],
            right[key as keyof StoredCategory],
          );
          return direction === -1 ? -result : result;
        });
      }
      return sorted;
    },
  };
}

/** Minimal `exec()`-style query returning a fixed value; shared with other mocks. */
export function createSingleQuery<T>(value: T) {
  return { exec: async (): Promise<T> => value };
}

function createCategoryModel(
  categories: StoredCategory[],
  nextId: () => string,
) {
  const create = (
    input: Omit<StoredCategory, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StoredCategory> => {
    const duplicate = categories.some(
      (category) =>
        category.name === input.name || category.slug === input.slug,
    );
    if (duplicate) {
      const error = new Error('E11000 duplicate key') as Error & {
        code?: number;
      };
      error.code = 11000;
      return Promise.reject(error);
    }
    const created: StoredCategory = {
      _id: nextId(),
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      ...input,
    };
    categories.push(created);
    return Promise.resolve(created);
  };

  return {
    create,
    exists: async (filter: CategoryFilter) =>
      categories.some((category) => matchesFilter(category, filter))
        ? { _id: 'exists' }
        : null,
    find: (filter: CategoryFilter) =>
      createFindQuery(
        categories.filter((category) => matchesFilter(category, filter)),
      ),
    findOne: (filter: CategoryFilter) =>
      createSingleQuery(
        categories.find((category) => matchesFilter(category, filter)) ?? null,
      ),
    findByIdAndUpdate: (
      id: string,
      update: { $set: Partial<StoredCategory> },
    ) => {
      const category = categories.find((candidate) => candidate._id === id);
      if (!category) return createSingleQuery(null);
      Object.assign(category, update.$set, { updatedAt: new Date() });
      return createSingleQuery(category);
    },
    findByIdAndDelete: (id: string) => {
      const index = categories.findIndex((candidate) => candidate._id === id);
      if (index === -1) return createSingleQuery(null);
      const [deleted] = categories.splice(index, 1);
      return createSingleQuery(deleted);
    },
  };
}

/** In-memory category/product store backing the HTTP harness. */
export function createCategoryFixture() {
  const nextId = createIdGenerator();
  const categories: StoredCategory[] = [];
  const products: { categoryId: string }[] = [];

  const seedCategory = (
    overrides: Partial<StoredCategory> = {},
  ): StoredCategory => {
    const category: StoredCategory = {
      _id: nextId(),
      name: `Category ${categories.length + 1}`,
      slug: `category-${categories.length + 1}`,
      isActive: true,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      ...overrides,
    };
    categories.push(category);
    return category;
  };

  return {
    categories,
    products,
    seedCategory,
    seedProduct: (categoryId: string) => {
      products.push({ categoryId });
    },
    findCategory: (id: string) =>
      categories.find((category) => category._id === id),
    categoryModel: createCategoryModel(categories, nextId),
    productsCollection: {
      countDocuments: async (filter: { categoryId: { toString(): string } }) =>
        products.filter(
          (product) => product.categoryId === filter.categoryId.toString(),
        ).length,
    },
  };
}

export type CategoryFixture = ReturnType<typeof createCategoryFixture>;
