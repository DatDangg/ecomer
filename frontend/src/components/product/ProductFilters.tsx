import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { Category } from "@/api/categories";
import type { ProductSortField, ProductSortOrder } from "@/api/products";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { ProductListQuery, ProductListQueryPatch } from "@/features/products/product-list-params";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "createdAt:desc", labelKey: "products.sortNewest" },
  { value: "price:asc", labelKey: "products.sortPriceAsc" },
  { value: "price:desc", labelKey: "products.sortPriceDesc" },
  { value: "name:asc", labelKey: "products.sortNameAsc" },
] as const;

const selectClass =
  "min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Returns `null` for empty, `undefined` for invalid, otherwise a whole VNĐ amount. */
function parsePriceInput(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
}

interface PriceFilterFormProps {
  query: ProductListQuery;
  idPrefix: string;
  onChange: (patch: ProductListQueryPatch) => void;
}

/** Price-range form state, validation and submit handling (kept out of render). */
function usePriceFilter({ query, onChange }: Omit<PriceFilterFormProps, "idPrefix">) {
  const { t } = useTranslation();
  const [minPrice, setMinPrice] = useState(query.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMinPrice(query.minPrice?.toString() ?? ""), [query.minPrice]);
  useEffect(() => setMaxPrice(query.maxPrice?.toString() ?? ""), [query.maxPrice]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const min = parsePriceInput(minPrice);
    const max = parsePriceInput(maxPrice);

    if (min === undefined || max === undefined) {
      setError(t("products.priceInvalid"));
      return;
    }
    if (min !== null && max !== null && min > max) {
      setError(t("products.priceRangeInvalid"));
      return;
    }
    setError(null);
    onChange({ minPrice: min, maxPrice: max });
  }

  const minInvalid = Boolean(error && minPrice.trim() !== "" && parsePriceInput(minPrice) === undefined);
  const maxInvalid = Boolean(error && maxPrice.trim() !== "" && parsePriceInput(maxPrice) === undefined);

  return {
    t,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    handleSubmit,
    minError: minInvalid ? (error ?? undefined) : undefined,
    maxError: maxInvalid ? (error ?? undefined) : undefined,
    formError: error && !minInvalid && !maxInvalid ? error : undefined,
  };
}

function PriceFilterForm({ query, idPrefix, onChange }: PriceFilterFormProps) {
  const f = usePriceFilter({ query, onChange });

  return (
    <form className="flex flex-col gap-3" onSubmit={f.handleSubmit} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <FormField id={`${idPrefix}-min-price`} label={f.t("products.minPriceLabel")} error={f.minError}>
          <Input
            id={`${idPrefix}-min-price`}
            type="number"
            min={0}
            inputMode="numeric"
            value={f.minPrice}
            onChange={(event) => f.setMinPrice(event.target.value)}
          />
        </FormField>
        <FormField id={`${idPrefix}-max-price`} label={f.t("products.maxPriceLabel")} error={f.maxError}>
          <Input
            id={`${idPrefix}-max-price`}
            type="number"
            min={0}
            inputMode="numeric"
            value={f.maxPrice}
            onChange={(event) => f.setMaxPrice(event.target.value)}
          />
        </FormField>
      </div>
      {f.formError ? (
        <p role="alert" className="text-sm text-error">
          {f.formError}
        </p>
      ) : null}
      <Button type="submit" variant="outline" className="w-full">
        {f.t("products.applyPrice")}
      </Button>
    </form>
  );
}

interface ProductFiltersProps {
  query: ProductListQuery;
  categories: Category[];
  /** Unique DOM id prefix so the rail and the mobile sheet never collide. */
  idPrefix: string;
  onChange: (patch: ProductListQueryPatch) => void;
}

/** Category, price range and sort controls. Both instances write to the URL. */
export function ProductFilters({ query, categories, idPrefix, onChange }: ProductFiltersProps) {
  const { t } = useTranslation();

  function handleSortChange(value: string) {
    const [sortBy, order] = value.split(":") as [ProductSortField, ProductSortOrder];
    onChange({ sortBy, order });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-heading text-base font-medium">{t("products.filtersTitle")}</h2>

      <FormField id={`${idPrefix}-category`} label={t("products.categoryLabel")}>
        <select
          id={`${idPrefix}-category`}
          value={query.categoryId ?? ""}
          onChange={(event) => onChange({ categoryId: event.target.value || null })}
          className={cn(selectClass)}
        >
          <option value="">{t("products.categoryAll")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </FormField>

      <PriceFilterForm query={query} idPrefix={idPrefix} onChange={onChange} />

      <FormField id={`${idPrefix}-sort`} label={t("products.sortLabel")}>
        <select
          id={`${idPrefix}-sort`}
          value={`${query.sortBy}:${query.order}`}
          onChange={(event) => handleSortChange(event.target.value)}
          className={cn(selectClass)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
