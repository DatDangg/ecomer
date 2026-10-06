import { apiGet } from "@/lib/api-client";
import type { Paginated } from "@/types/api";

/** Public product shape returned by `GET /products` (docs/API_SPEC.md R-05). */
export interface Product {
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
  createdAt: string;
  updatedAt: string;
}

/** Nested category on the public detail response; `null` when unresolvable. */
export interface ProductCategoryRef {
  id: string;
  name: string;
}

/** Nested seller on the public detail response; `shopName` is `null` until set. */
export interface ProductSellerRef {
  id: string;
  shopName: string | null;
}

/** `GET /products/:id` base view plus nested `category`/`seller`. */
export interface ProductDetail extends Product {
  category: ProductCategoryRef | null;
  seller: ProductSellerRef;
}

export const PRODUCT_SORT_FIELDS = ["createdAt", "price", "name"] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export const PRODUCT_SORT_ORDERS = ["asc", "desc"] as const;
export type ProductSortOrder = (typeof PRODUCT_SORT_ORDERS)[number];

/** Query accepted by `GET /products`; `limit` is clamped to 100 by the API. */
export interface ProductListParams {
  search?: string;
  categoryId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortField;
  order?: ProductSortOrder;
  page?: number;
  limit?: number;
}

/** Public paginated browse; the API filters to active and unblocked products. */
export function listProducts(params: ProductListParams = {}): Promise<Paginated<Product>> {
  return apiGet<Paginated<Product>>("/products", { params });
}

/** Public product detail; a hidden/blocked/missing product resolves to HTTP 404. */
export function getProduct(id: string): Promise<ProductDetail> {
  return apiGet<ProductDetail>(`/products/${id}`);
}
