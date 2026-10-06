import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Previous/next pagination bounded by `totalPages`; hidden when one page. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={t("products.paginationLabel")}
      className="mt-10 flex items-center justify-center gap-4"
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        {t("products.previous")}
      </Button>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {t("products.page", { page, total: totalPages })}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        {t("products.next")}
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </Button>
    </nav>
  );
}
