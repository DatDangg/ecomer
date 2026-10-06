import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ProductListQuery, ProductListQueryPatch } from "@/features/products/product-list-params";
import { formatVnd } from "@/utils/format";

interface ActiveFilterChipsProps {
  query: ProductListQuery;
  categoryName?: string;
  onChange: (patch: ProductListQueryPatch) => void;
}

interface FilterChipProps {
  label: string;
  removeLabel: string;
  onRemove: () => void;
}

function FilterChip({ label, removeLabel, onRemove }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-colors motion-reduce:transition-none hover:bg-background"
    >
      {label}
      <X aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="sr-only">{removeLabel}</span>
    </button>
  );
}

/** Human-readable active filters; each chip removes exactly its own param. */
export function ActiveFilterChips({ query, categoryName, onChange }: ActiveFilterChipsProps) {
  const { t } = useTranslation();
  const hasChips =
    Boolean(query.search) ||
    Boolean(query.categoryId) ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined;

  if (!hasChips) {
    return null;
  }

  return (
    <div role="group" aria-label={t("products.activeFilters")} className="flex flex-wrap gap-2">
      {query.search ? (
        <FilterChip
          label={t("products.searchChip", { term: query.search })}
          removeLabel={t("products.removeFilter", { label: query.search })}
          onRemove={() => onChange({ search: null })}
        />
      ) : null}
      {query.categoryId ? (
        <FilterChip
          label={t("products.categoryChip", { name: categoryName ?? query.categoryId })}
          removeLabel={t("products.removeFilter", { label: categoryName ?? query.categoryId })}
          onRemove={() => onChange({ categoryId: null })}
        />
      ) : null}
      {query.minPrice !== undefined ? (
        <FilterChip
          label={t("products.priceFrom", { price: formatVnd(query.minPrice) })}
          removeLabel={t("products.removeFilter", { label: formatVnd(query.minPrice) })}
          onRemove={() => onChange({ minPrice: null })}
        />
      ) : null}
      {query.maxPrice !== undefined ? (
        <FilterChip
          label={t("products.priceTo", { price: formatVnd(query.maxPrice) })}
          removeLabel={t("products.removeFilter", { label: formatVnd(query.maxPrice) })}
          onRemove={() => onChange({ maxPrice: null })}
        />
      ) : null}
    </div>
  );
}
