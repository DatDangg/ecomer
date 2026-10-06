import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { Product } from "@/api/products";
import { ProductImage } from "@/components/product/ProductImage";
import { formatVnd } from "@/utils/format";

/**
 * Discovery grid item. Stock is announced with the explicit text label `Hết
 * hàng` rather than colour alone; there is no add-to-cart affordance here
 * (deferred). The whole item is one link to the product detail.
 */
export function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const outOfStock = product.stock === 0;

  return (
    <article className="group flex flex-col">
      <Link to={`/products/${product.id}`} className="flex flex-col rounded-lg">
        <div className="aspect-square overflow-hidden rounded-lg bg-surface">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="transition-transform duration-200 motion-reduce:transition-none group-hover:scale-[1.02]"
          />
        </div>
        <h2 className="mt-3 line-clamp-2 text-base font-medium text-foreground">
          {product.name}
        </h2>
        <p className="mt-1 text-base font-semibold text-foreground">
          {formatVnd(product.price)}
        </p>
        {outOfStock ? (
          <span className="mt-1 w-fit rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-warning">
            {t("products.outOfStock")}
          </span>
        ) : null}
      </Link>
    </article>
  );
}
