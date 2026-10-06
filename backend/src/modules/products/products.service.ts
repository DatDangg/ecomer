import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import {
  buildPaginated,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  PaginatedData,
} from '../../common/dto/pagination-query.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product, ProductDocument } from './product.schema';

export const PRODUCT_NOT_FOUND_MESSAGE = 'Không tìm thấy sản phẩm';

/**
 * Categories/users are read by id through the raw connection so the public
 * product module does not depend on the Category/User modules (task-05 Notes).
 */
export const CATEGORIES_COLLECTION = 'categories';
export const USERS_COLLECTION = 'users';

/** Minimal shapes read from the referenced collections for the detail view. */
interface CategoryRefDocument {
  name: string;
}

interface SellerRefDocument {
  shopName?: string;
}

/** A product is publicly visible only when active and not admin-blocked. */
const PUBLIC_PRODUCT_FILTER = { isActive: true, isBlocked: false } as const;

/**
 * Client-facing public browse contract. `isBlocked`/`blockReason` are
 * owner/admin-only (`06-api-contract.md:287`) and intentionally absent here.
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
  createdAt: Date;
  updatedAt: Date;
}

/** Nested `category` for the public detail response; `null` when unresolvable. */
export interface ProductCategoryRef {
  id: string;
  name: string;
}

/** Nested `seller`; `shopName` is `null` until the seller sets up the shop. */
export interface ProductSellerRef {
  id: string;
  shopName: string | null;
}

/**
 * Public detail response (`GET /products/:id`) — base view plus the nested
 * `category`/`seller` objects from the canonical contract (R-05, task-05).
 */
export interface ProductDetailView extends ProductView {
  category: ProductCategoryRef | null;
  seller: ProductSellerRef;
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
    @InjectConnection() private readonly connection: Connection,
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
   * non-visible products (R-05). Visible products are enriched with the
   * canonical nested `category`/`seller` refs; a dangling ref degrades safely
   * instead of failing the request.
   */
  async findPublicById(id: string): Promise<ProductDetailView | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const product = await this.productModel
      .findOne({ _id: id, ...PUBLIC_PRODUCT_FILTER })
      .exec();
    if (!product) {
      return null;
    }

    const [category, seller] = await Promise.all([
      this.findCategoryRef(product.categoryId),
      this.findSellerRef(product.sellerId),
    ]);

    return { ...toProductView(product), category, seller };
  }

  /** Reads the nested category ref; `null` when the category no longer exists. */
  private async findCategoryRef(
    categoryId: Types.ObjectId,
  ): Promise<ProductCategoryRef | null> {
    const category = await this.connection
      .collection<CategoryRefDocument>(CATEGORIES_COLLECTION)
      .findOne({ _id: categoryId });
    return category ? { id: String(category._id), name: category.name } : null;
  }

  /**
   * Reads the seller's shop name. The seller ref is always echoed (products
   * always have an owner); `shopName` is `null` when the user is missing or has
   * not set up a shop.
   */
  private async findSellerRef(
    sellerId: Types.ObjectId,
  ): Promise<ProductSellerRef> {
    const seller = await this.connection
      .collection<SellerRefDocument>(USERS_COLLECTION)
      .findOne({ _id: sellerId });
    return { id: String(sellerId), shopName: seller?.shopName ?? null };
  }
}
