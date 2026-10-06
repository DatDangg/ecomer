import { SlidersHorizontal } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import type { UseQueryResult } from "@tanstack/react-query";

import type { Category } from "@/api/categories";
import type { Product } from "@/api/products";
import { ActiveFilterChips } from "@/components/product/ActiveFilterChips";
import { Pagination } from "@/components/product/Pagination";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  ProductGridSkeleton,
  ProductListEmpty,
  ProductListError,
} from "@/components/product/ProductListStates";
import { ProductSearch } from "@/components/product/ProductSearch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  buildProductListSearchParams,
  hasActiveProductFilters,
  parseProductListQuery,
  PRODUCTS_PAGE_SIZE,
  type ProductListQuery,
  type ProductListQueryPatch,
} from "@/features/products/product-list-params";
import { useCategories, useProductList } from "@/features/products/useProducts";
import { ApiRequestError } from "@/lib/api-client";
import type { Paginated } from "@/types/api";

/** Reads URL state, keeps the list query and the filter writer in one place. */
function useProductDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseProductListQuery(searchParams);
  const categoriesQuery = useCategories();
  const listQuery = useProductList({
    search: query.search,
    categoryId: query.categoryId,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sortBy: query.sortBy,
    order: query.order,
    page: query.page,
    limit: PRODUCTS_PAGE_SIZE,
  });

  const updateFilters = useCallback(
    (patch: ProductListQueryPatch, options?: { replace?: boolean }) => {
      setSearchParams((previous) => buildProductListSearchParams(previous, patch), {
        replace: options?.replace ?? false,
      });
    },
    [setSearchParams],
  );

  const searchProducts = useCallback(
    (term: string) => updateFilters({ search: term || null }, { replace: true }),
    [updateFilters],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    query,
    categories: categoriesQuery.data ?? [],
    listQuery,
    updateFilters,
    searchProducts,
    clearFilters,
  };
}

interface FiltersPanelProps {
  query: ProductListQuery;
  categories: Category[];
  onChange: (patch: ProductListQueryPatch) => void;
  onClear: () => void;
}

/** Desktop filter rail; clear action only shown when a filter is active. */
function FiltersRail({ query, categories, onChange, onClear }: FiltersPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:block" aria-label={t("products.filtersTitle")}>
      <ProductFilters query={query} categories={categories} idPrefix="rail" onChange={onChange} />
      {hasActiveProductFilters(query) ? (
        <Button variant="ghost" className="mt-2 w-full justify-start px-0" onClick={onClear}>
          {t("products.clearFilters")}
        </Button>
      ) : null}
    </aside>
  );
}

/** Mobile filter sheet; controls write straight to the URL. */
function MobileFilters({ query, categories, onChange }: Omit<FiltersPanelProps, "onClear">) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            {t("products.openFilters")}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 max-w-[85vw]">
          <SheetTitle>{t("products.filtersTitle")}</SheetTitle>
          <SheetDescription className="sr-only">{t("products.filtersIntro")}</SheetDescription>
          <div className="mt-2 flex-1 overflow-y-auto">
            <ProductFilters
              query={query}
              categories={categories}
              idPrefix="sheet"
              onChange={onChange}
            />
          </div>
          <Button type="button" className="mt-2 w-full" onClick={() => setOpen(false)}>
            {t("products.viewResults")}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ResultsSummary({ total, isLoading }: { total: number; isLoading: boolean }) {
  const { t } = useTranslation();

  return (
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
      {isLoading ? "" : t("products.resultCount", { count: total })}
    </p>
  );
}

interface DiscoveryBodyProps {
  query: ProductListQuery;
  categoryName?: string;
  categories: Category[];
  listQuery: UseQueryResult<Paginated<Product>, Error>;
  onFilterChange: (patch: ProductListQueryPatch) => void;
  onClearFilters: () => void;
}

/** Results column: summary, mobile filters, chips, grid/empty/error, pagination. */
function DiscoveryBody({
  query,
  categoryName,
  categories,
  listQuery,
  onFilterChange,
  onClearFilters,
}: DiscoveryBodyProps) {
  const { t } = useTranslation();
  const products = listQuery.data?.items ?? [];
  const errorMessage =
    listQuery.error instanceof ApiRequestError ? listQuery.error.message : t("products.loadError");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ResultsSummary total={listQuery.data?.total ?? 0} isLoading={listQuery.isLoading} />
        <MobileFilters query={query} categories={categories} onChange={onFilterChange} />
      </div>
      <div className="mt-4">
        <ActiveFilterChips query={query} categoryName={categoryName} onChange={onFilterChange} />
      </div>
      <div className="mt-6">
        {listQuery.isLoading ? <ProductGridSkeleton /> : null}
        {listQuery.isError ? (
          <ProductListError message={errorMessage} onRetry={() => void listQuery.refetch()} />
        ) : null}
        {listQuery.isSuccess && products.length === 0 ? (
          <ProductListEmpty
            hasActiveFilters={hasActiveProductFilters(query)}
            onClearFilters={onClearFilters}
          />
        ) : null}
        {listQuery.isSuccess && products.length > 0 ? <ProductGrid products={products} /> : null}
      </div>
      <Pagination
        page={query.page}
        totalPages={listQuery.data?.totalPages ?? 0}
        onPageChange={(page) => onFilterChange({ page })}
      />
    </div>
  );
}

/** Public discovery screen for `/` and `/products`. */
export function ProductListPage() {
  const { t } = useTranslation();
  const { query, categories, listQuery, updateFilters, searchProducts, clearFilters } =
    useProductDiscovery();
  const categoryName = categories.find((category) => category.id === query.categoryId)?.name;

  return (
    <section className="container-page py-8 md:py-12">
      <header className="max-w-2xl">
        <h1 className="font-medium">{t("products.title")}</h1>
        <p className="mt-2 text-base text-muted-foreground">{t("products.intro")}</p>
      </header>

      <div className="mt-6">
        <ProductSearch value={query.search ?? ""} onSearch={searchProducts} />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <FiltersRail
          query={query}
          categories={categories}
          onChange={updateFilters}
          onClear={clearFilters}
        />
        <DiscoveryBody
          query={query}
          categoryName={categoryName}
          categories={categories}
          listQuery={listQuery}
          onFilterChange={updateFilters}
          onClearFilters={clearFilters}
        />
      </div>
    </section>
  );
}
