import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 350;

interface ProductSearchProps {
  value: string;
  onSearch: (term: string) => void;
}

/**
 * Search field bound to the URL. Typing is debounced; submitting (Enter) applies
 * immediately. The local value re-syncs when the URL changes (browser back).
 */
export function ProductSearch({ value, onSearch }: ProductSearchProps) {
  const { t } = useTranslation();
  const [term, setTerm] = useState(value);

  useEffect(() => {
    setTerm(value);
  }, [value]);

  useEffect(() => {
    if (term === value) {
      return;
    }
    const timer = window.setTimeout(() => onSearch(term), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [term, value, onSearch]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(term);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="w-full">
      <label htmlFor="product-search" className="text-sm font-medium text-foreground">
        {t("products.searchLabel")}
      </label>
      <div className="relative mt-1.5">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="product-search"
          type="search"
          enterKeyHint="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t("products.searchPlaceholder")}
          className="pl-9"
        />
      </div>
    </form>
  );
}
