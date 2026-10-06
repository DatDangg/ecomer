import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../../common/enums';
import {
  Category,
  CategoryDocument,
} from '../../modules/categories/category.schema';
// Reused from the category domain (single slugify implementation).
import { slugify } from '../../modules/categories/categories.service';
import {
  Product,
  ProductDocument,
} from '../../modules/products/product.schema';
import { User, UserDocument } from '../../modules/users/user.schema';

const MONGO_DUPLICATE_KEY_CODE = 11000;

export interface SampleCategorySeed {
  name: string;
}

export interface SampleProductSeed {
  name: string;
  description: string;
  price: number;
  stock: number;
  /** Resolved to a `categoryId` from the sample categories. */
  category: string;
  isActive?: boolean;
  isBlocked?: boolean;
}

/** Three categories; products spread across them (R-05 UAT). */
export const SAMPLE_CATEGORIES: SampleCategorySeed[] = [
  { name: 'Điện thoại' },
  { name: 'Thời trang' },
  { name: 'Sách' },
];

/** Eight products, including `stock=0`, an inactive and a blocked one. */
export const SAMPLE_PRODUCTS: SampleProductSeed[] = [
  {
    name: 'iPhone 15 Pro',
    description: 'Điện thoại cao cấp của Apple, chip A17 Pro.',
    price: 29990000,
    stock: 50,
    category: 'Điện thoại',
  },
  {
    name: 'Samsung Galaxy S24',
    description: 'Điện thoại Android flagship của Samsung.',
    price: 21990000,
    stock: 0,
    category: 'Điện thoại',
  },
  {
    name: 'Áo thun nam',
    description: 'Áo thun cotton basic, form rộng.',
    price: 199000,
    stock: 120,
    category: 'Thời trang',
  },
  {
    name: 'Quần jeans',
    description: 'Quần jeans xanh, co giãn nhẹ.',
    price: 499000,
    stock: 30,
    category: 'Thời trang',
  },
  {
    name: 'Sách Lập trình',
    description: 'Sách nhập môn lập trình cho người mới.',
    price: 150000,
    stock: 10,
    category: 'Sách',
  },
  {
    name: 'Sách Kỹ năng',
    description: 'Sách phát triển kỹ năng mềm.',
    price: 120000,
    stock: 5,
    category: 'Sách',
  },
  {
    name: 'Tai nghe Bluetooth',
    description: 'Tai nghe không dây, chống ồn cơ bản.',
    price: 990000,
    stock: 40,
    category: 'Điện thoại',
    isActive: false,
  },
  {
    name: 'Đồng hồ thông minh',
    description: 'Đồng hồ theo dõi sức khỏe.',
    price: 1500000,
    stock: 15,
    category: 'Thời trang',
    isBlocked: true,
  },
];

export interface SampleSeedResult {
  categories: number;
  productsCreated: number;
  productsSkipped: number;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY_CODE
  );
}

/** Public placeholder image so sample products render without the upload flow. */
function buildImages(slug: string): string[] {
  return [`https://picsum.photos/seed/${slug}/600/600`];
}

/**
 * Idempotent sample data for local/UAT (task-04). Running it twice creates
 * nothing new: every write checks for an existing document first and treats a
 * duplicate-key race as already seeded (same pattern as `AdminSeedService`).
 *
 * It never reads `MONGODB_URI_PROD` (configuration only exposes `MONGODB_URI`)
 * and never creates a user/seller account with credentials. Because
 * `sellerId` is a required `User` ref, product seeding requires at least one
 * active customer already in the database; otherwise only categories are
 * seeded and a warning tells the operator to register a customer and re-run.
 */
@Injectable()
export class SampleSeedService {
  private readonly logger = new Logger(SampleSeedService.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<SampleSeedResult> {
    const categories = await this.ensureCategories();
    const sellerId = await this.resolveSellerId();

    if (!sellerId) {
      this.logger.warn(
        `Sample seed created ${categories.length} categories but skipped ` +
          'products: no active customer user exists to own them. Register a ' +
          'customer account first, then re-run "npm run seed:sample" to ' +
          'create the sample products with a real sellerId.',
      );
      return {
        categories: categories.length,
        productsCreated: 0,
        productsSkipped: 0,
      };
    }

    const categoryIdByName = new Map(
      categories.map((category) => [category.name, category._id]),
    );

    let productsCreated = 0;
    let productsSkipped = 0;
    for (const seed of SAMPLE_PRODUCTS) {
      const categoryId = categoryIdByName.get(seed.category);
      if (!categoryId) {
        this.logger.warn(
          `Sample seed skipped "${seed.name}": category "${seed.category}" missing`,
        );
        continue;
      }
      if (await this.ensureProduct(seed, categoryId, sellerId)) {
        productsCreated += 1;
      } else {
        productsSkipped += 1;
      }
    }

    this.logger.log(
      `Sample seed complete: ${categories.length} categories, ` +
        `${productsCreated} products created, ${productsSkipped} already present`,
    );
    return {
      categories: categories.length,
      productsCreated,
      productsSkipped,
    };
  }

  /** Creates only the sample categories that are missing (by name/slug). */
  private async ensureCategories(): Promise<CategoryDocument[]> {
    const categories: CategoryDocument[] = [];
    for (const seed of SAMPLE_CATEGORIES) {
      const category = await this.ensureCategory(seed);
      if (category) categories.push(category);
    }
    return categories;
  }

  private async ensureCategory(
    seed: SampleCategorySeed,
  ): Promise<CategoryDocument | null> {
    const slug = slugify(seed.name);
    const existing = await this.categoryModel
      .findOne({ $or: [{ name: seed.name }, { slug }] })
      .exec();
    if (existing) {
      return existing;
    }

    try {
      return await this.categoryModel.create({
        name: seed.name,
        slug,
        isActive: true,
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      return this.categoryModel.findOne({ slug }).exec();
    }
  }

  /**
   * Returns a real active customer `_id` to own the sample products, or `null`
   * when no such user exists. `sellerId` is a required `User` ref, so the seed
   * never fabricates a placeholder reference; product seeding is skipped
   * instead (see `run`).
   */
  private async resolveSellerId(): Promise<Types.ObjectId | null> {
    const customer = await this.userModel
      .findOne({ role: UserRole.CUSTOMER, isActive: true })
      .exec();
    return customer?._id ?? null;
  }

  /** Returns true when the product was created, false when it already existed. */
  private async ensureProduct(
    seed: SampleProductSeed,
    categoryId: Types.ObjectId | string,
    sellerId: Types.ObjectId,
  ): Promise<boolean> {
    const slug = slugify(seed.name);
    const existing = await this.productModel.exists({ slug });
    if (existing) {
      return false;
    }

    try {
      await this.productModel.create({
        sellerId,
        slug,
        name: seed.name,
        description: seed.description,
        price: seed.price,
        stock: seed.stock,
        images: buildImages(slug),
        categoryId,
        isActive: seed.isActive ?? true,
        isBlocked: seed.isBlocked ?? false,
      });
      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) return false;
      throw error;
    }
  }
}
