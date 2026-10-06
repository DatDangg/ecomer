import { useQuery } from "@tanstack/react-query";

import { getProduct, listProducts, type ProductListParams } from "@/api/products";
import { listCategories } from "@/api/categories";

/** Query keys for the public catalog; exported for invalidation in later layers. */
export const productsQueryKeys = {
  list: (params: ProductListParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  categories: ["categories", "list"] as const,
};

/** Paginated public product browse for `/` and `/products`. */
export function useProductList(params: ProductListParams) {
  return useQuery({
    queryKey: productsQueryKeys.list(params),
    queryFn: () => listProducts(params),
  });
}

/** Public product detail for `/products/:id`; disabled until an id is present. */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });
}

/** Active category options for the discovery filter. */
export function useCategories() {
  return useQuery({
    queryKey: productsQueryKeys.categories,
    queryFn: listCategories,
  });
}
