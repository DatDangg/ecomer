import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CategoryQueryDto } from './dto/category-query.dto';

/**
 * Products collection name. Products are owned by the Product module (Layer 2);
 * counting through the raw collection here avoids depending on that module
 * before it exists (task-03 Notes, same approach as the public shop count).
 */
export const PRODUCTS_COLLECTION = 'products';

export const CATEGORY_NOT_FOUND_MESSAGE = 'Không tìm thấy danh mục';
export const CATEGORY_NAME_CONFLICT_MESSAGE = 'Danh mục đã tồn tại';
export const CATEGORY_IN_USE_MESSAGE =
  'Không thể xoá danh mục vì vẫn còn sản phẩm đang dùng';

/** Body accepted when creating a category; `slug` is never part of it. */
export interface CreateCategoryInput {
  name: string;
  imageUrl?: string;
}

/** Editable fields for `PATCH /categories/:id`; `slug` is intentionally absent. */
export interface UpdateCategoryInput {
  name?: string;
  imageUrl?: string;
  isActive?: boolean;
}

/** Client-facing category contract. */
export interface CategoryView {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts a name into a URL-safe slug. Vietnamese diacritics are decomposed
 * and stripped (`Điện thoại` → `dien-thoai`) so slugs are stable and readable.
 */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Escapes regex metacharacters so a search term is matched literally (ReDoS-safe). */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Maps a category document to the client-facing contract. */
export function toCategoryView(category: CategoryDocument): CategoryView {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    imageUrl: category.imageUrl ?? null,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

/**
 * Keeps only editable keys, defence-in-depth against mass assignment: even a
 * direct service call cannot write `slug` or any other unexpected path.
 */
function pickUpdateFields(
  input: UpdateCategoryInput,
): Record<string, string | boolean> {
  const update: Record<string, string | boolean> = {};
  if (typeof input.name === 'string') update.name = input.name;
  if (typeof input.imageUrl === 'string') update.imageUrl = input.imageUrl;
  if (typeof input.isActive === 'boolean') update.isActive = input.isActive;
  return update;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** Admin create (BR-CAT-003); duplicate names surface as 409 (BR-CAT-001). */
  async create(input: CreateCategoryInput): Promise<CategoryView> {
    await this.assertNameAvailable(input.name);
    const slug = await this.generateUniqueSlug(input.name);
    const category = await this.categoryModel.create({
      name: input.name,
      slug,
      imageUrl: input.imageUrl,
      isActive: true,
    });
    return toCategoryView(category);
  }

  /** Public list: active categories only, with basic search + sort (R-03). */
  async findAll(query: CategoryQueryDto): Promise<CategoryView[]> {
    const filter: FilterQuery<CategoryDocument> = { isActive: true };
    if (query.search) {
      filter.name = { $regex: escapeRegExp(query.search), $options: 'i' };
    }

    const sort: Record<string, 1 | -1> = {
      [query.sortBy]: query.order === 'desc' ? -1 : 1,
    };
    const categories = await this.categoryModel.find(filter).sort(sort).exec();
    return categories.map(toCategoryView);
  }

  /**
   * Public detail. A malformed id, a missing category, or an inactive one all
   * return `null` (rendered as 404) so public output only ever exposes active
   * categories (task-03 Notes).
   */
  async findPublicById(id: string): Promise<CategoryView | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const category = await this.findDocument({ _id: id, isActive: true });
    return category ? toCategoryView(category) : null;
  }

  async update(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryView | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    if (typeof input.name === 'string') {
      await this.assertNameAvailable(input.name, id);
    }

    const update = pickUpdateFields(input);
    if (Object.keys(update).length === 0) {
      const current = await this.findDocument({ _id: id });
      return current ? toCategoryView(current) : null;
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
    return category ? toCategoryView(category) : null;
  }

  /**
   * Admin delete. Refuses with 400 while any product (any shop, any status)
   * still references the category (BR-CAT-002); returns `false` when the
   * category does not exist so the controller can render 404.
   */
  async remove(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const category = await this.findDocument({ _id: id });
    if (!category) {
      return false;
    }

    const productCount = await this.countProductsByCategory(id);
    if (productCount > 0) {
      throw new BadRequestException(CATEGORY_IN_USE_MESSAGE);
    }

    await this.categoryModel.findByIdAndDelete(id).exec();
    return true;
  }

  private findDocument(
    filter: FilterQuery<CategoryDocument>,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne(filter).exec();
  }

  private async assertNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: FilterQuery<CategoryDocument> = { name };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.categoryModel.exists(filter);
    if (existing) {
      throw new ConflictException(CATEGORY_NAME_CONFLICT_MESSAGE);
    }
  }

  /**
   * Builds a unique slug from the name, appending `-2`, `-3`, … on collision
   * (e.g. two different names that slugify the same way). Name uniqueness is
   * checked separately; the unique index is the final safeguard.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'danh-muc';
    let candidate = base;
    let suffix = 1;
    while (await this.categoryModel.exists({ slug: candidate })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  /** Counts products (any shop) referencing the category, via the raw collection. */
  private countProductsByCategory(categoryId: string): Promise<number> {
    return this.connection.collection(PRODUCTS_COLLECTION).countDocuments({
      categoryId: new Types.ObjectId(categoryId),
    });
  }
}
