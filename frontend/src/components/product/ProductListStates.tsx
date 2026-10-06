import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

const SKELETON_ITEMS = 8;

/** Loading grid that reserves the same geometry as `ProductGrid` to avoid shift. */
export function ProductGridSkeleton() {
  const { t } = useTranslation();

  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        {t("products.loading")}
      </p>
      <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
          <li key={index}>
            <div className="aspect-square animate-pulse rounded-lg bg-surface motion-reduce:animate-none" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-surface motion-reduce:animate-none" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-surface motion-reduce:animate-none" />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ProductListEmptyProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/** Empty catalog vs. no-match messaging, each with its own next action. */
export function ProductListEmpty({ hasActiveFilters, onClearFilters }: ProductListEmptyProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-border px-4 py-16 text-center">
      <p className="text-base text-muted-foreground">
        {hasActiveFilters ? t("products.noResults") : t("products.empty")}
      </p>
      {hasActiveFilters ? (
        <Button variant="outline" className="mt-5" onClick={onClearFilters}>
          {t("products.clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}

interface ProductListErrorProps {
  message: string;
  onRetry: () => void;
}

/** Contextual load failure with a safe retry action. */
export function ProductListError({ message, onRetry }: ProductListErrorProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-border px-4 py-16 text-center">
      <p role="alert" className="text-base text-error">
        {message}
      </p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        {t("products.retry")}
      </Button>
    </div>
  );
}
