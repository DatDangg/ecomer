import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  buildPaginated,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  PaginatedData,
} from '../../common/dto/pagination-query.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product, ProductDocument } from './product.schema';

export const PRODUCT_NOT_FOUND_MESSAGE = 'Không tìm thấy sản phẩm';

/** A product is publicly visible only when active and not admin-blocked. */
const PUBLIC_PRODUCT_FILTER = { isActive: true, isBlocked: false } as const;

/**
 * Client-facing product contract for public browse. Kept flat (`sellerId`,
 * `categoryId`) because the lean MVP list/detail only links back to a category
 * filter; the nested `category`/`seller` objects from the full contract and
 * seller/admin views are deferred (R-05, layer-2-task-02).
 */
export interface ProductView {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

/** Maps a product document to the public browse contract. */
export function toProductView(product: ProductDocument): ProductView {
  return {
    id: String(product._id),
    sellerId: String(product.sellerId),
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    images: product.images ?? [],
    categoryId: String(product.categoryId),
    isActive: product.isActive,
    isBlocked: product.isBlocked,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Builds the public filter: always `isActive && !isBlocked`, plus the optional
 * search/category/seller/price filters. `search` is trimmed before it reaches
 * Mongo so a padded query behaves the same as a direct service call.
 */
export function buildPublicProductFilter(
  query: QueryProductDto,
): FilterQuery<ProductDocument> {
  const filter: FilterQuery<ProductDocument> = {
    isActive: true,
    isBlocked: false,
  };

  const search = query.search?.trim();
  if (search) {
    filter.$text = { $search: search };
  }
  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }
  if (query.sellerId) {
    filter.sellerId = query.sellerId;
  }

  const price: { $gte?: number; $lte?: number } = {};
  if (query.minPrice !== undefined) price.$gte = query.minPrice;
  if (query.maxPrice !== undefined) price.$lte = query.maxPrice;
  if (Object.keys(price).length > 0) {
    filter.price = price;
  }

  return filter;
}

/** Default sort is newest first; explicit `sortBy`/`order` override it. */
function buildSort(query: QueryProductDto): Record<string, 1 | -1> {
  const sortBy = query.sortBy ?? 'createdAt';
  const order = query.order ?? 'desc';
  return { [sortBy]: order === 'desc' ? -1 : 1 };
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  /**
   * Public paginated browse (R-05). Returns only visible products and never
   * leaks hidden/blocked ones; an out-of-range page yields `items: []` with the
   * correct `total`/`totalPages`.
   */
  async findAll(query: QueryProductDto): Promise<PaginatedData<ProductView>> {
    const filter = buildPublicProductFilter(query);
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(buildSort(query))
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return buildPaginated(items.map(toProductView), total, page, limit);
  }

  /**
   * Public detail. A malformed id, a missing product, or a hidden/blocked one
   * all return `null` (rendered as 404) so public output never exposes
   * non-visible products (R-05).
   */
  async findPublicById(id: string): Promise<ProductView | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const product = await this.productModel
      .findOne({ _id: id, ...PUBLIC_PRODUCT_FILTER })
      .exec();
    return product ? toProductView(product) : null;
  }
}
