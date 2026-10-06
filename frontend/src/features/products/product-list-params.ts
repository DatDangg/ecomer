import {
  PRODUCT_SORT_FIELDS,
  PRODUCT_SORT_ORDERS,
  type ProductSortField,
  type ProductSortOrder,
} from "@/api/products";

/** Page size kept under the API max of 100; not mirrored in the URL. */
export const PRODUCTS_PAGE_SIZE = 24;

/** Normalized filter/search/pagination state derived from the URL search params. */
export interface ProductListQuery {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: ProductSortField;
  order: ProductSortOrder;
  page: number;
}

/** Partial update applied to the URL; `null` clears a param. */
export interface ProductListQueryPatch {
  search?: string | null;
  categoryId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: ProductSortField;
  order?: ProductSortOrder;
  page?: number;
}

const FILTER_KEYS: ReadonlyArray<keyof ProductListQueryPatch> = [
  "search",
  "categoryId",
  "minPrice",
  "maxPrice",
  "sortBy",
  "order",
];

function readNonNegativeInt(value: string | null, min: number): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min ? parsed : undefined;
}

function readSortField(value: string | null): ProductSortField {
  return PRODUCT_SORT_FIELDS.includes(value as ProductSortField)
    ? (value as ProductSortField)
    : "createdAt";
}

function readSortOrder(value: string | null): ProductSortOrder {
  return PRODUCT_SORT_ORDERS.includes(value as ProductSortOrder)
    ? (value as ProductSortOrder)
    : "desc";
}

/** Reads any URL shape into a normalized query, ignoring invalid/out-of-range values. */
export function parseProductListQuery(params: URLSearchParams): ProductListQuery {
  const search = params.get("search")?.trim() ?? "";
  const categoryId = params.get("categoryId")?.trim() ?? "";

  return {
    search: search || undefined,
    categoryId: categoryId || undefined,
    minPrice: readNonNegativeInt(params.get("minPrice"), 0),
    maxPrice: readNonNegativeInt(params.get("maxPrice"), 0),
    sortBy: readSortField(params.get("sortBy")),
    order: readSortOrder(params.get("order")),
    page: readNonNegativeInt(params.get("page"), 1) ?? 1,
  };
}

/** True when any narrowing filter (not sort/pagination) is active. */
export function hasActiveProductFilters(query: ProductListQuery): boolean {
  return (
    Boolean(query.search) ||
    Boolean(query.categoryId) ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  );
}

function applyParam(
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
): void {
  if (value === null || value === undefined || value === "") {
    params.delete(key);
    return;
  }
  params.set(key, String(value));
}

/**
 * Applies a patch on top of the current URL and keeps the URL canonical:
 * default sort/page values stay out of the query string, and any filter change
 * resets `page` to 1 so shared links and browser back/forward stay consistent.
 */
export function buildProductListSearchParams(
  previous: URLSearchParams,
  patch: ProductListQueryPatch,
): URLSearchParams {
  const next = new URLSearchParams(previous);

  if ("search" in patch) applyParam(next, "search", patch.search?.trim() || null);
  if ("categoryId" in patch) applyParam(next, "categoryId", patch.categoryId || null);
  if ("minPrice" in patch) applyParam(next, "minPrice", patch.minPrice ?? null);
  if ("maxPrice" in patch) applyParam(next, "maxPrice", patch.maxPrice ?? null);
  if ("sortBy" in patch) {
    applyParam(next, "sortBy", patch.sortBy === "createdAt" ? null : patch.sortBy);
  }
  if ("order" in patch) applyParam(next, "order", patch.order === "desc" ? null : patch.order);

  const filterChanged = FILTER_KEYS.some((key) => key in patch);
  if ("page" in patch) {
    applyParam(next, "page", (patch.page ?? 1) > 1 ? patch.page ?? 1 : null);
  } else if (filterChanged) {
    next.delete("page");
  }

  return next;
}
