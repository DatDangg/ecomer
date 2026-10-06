import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { type ProductDetail } from "@/api/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/features/products/useProducts";
import { ApiRequestError, getApiErrorStatus } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatNumber, formatVnd } from "@/utils/format";

function ProductDetailSkeleton() {
  const { t } = useTranslation();

  return (
    <section className="container-page py-8 md:py-12" aria-busy="true">
      <p role="status" className="sr-only">
        {t("products.detailLoading")}
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-lg bg-surface motion-reduce:animate-none" />
        <div>
          <div className="h-8 w-3/4 animate-pulse rounded bg-surface motion-reduce:animate-none" />
          <div className="mt-4 h-6 w-1/3 animate-pulse rounded bg-surface motion-reduce:animate-none" />
          <div className="mt-6 h-4 w-full animate-pulse rounded bg-surface motion-reduce:animate-none" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface motion-reduce:animate-none" />
        </div>
      </div>
    </section>
  );
}

function ProductDetailError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <section className="container-page py-8 md:py-12">
      <p role="alert" className="text-base text-error">
        {message}
      </p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        {t("products.retry")}
      </Button>
    </section>
  );
}

/** Shared 404 state; hidden/blocked/missing all resolve here without extra detail. */
function ProductNotFound() {
  const { t } = useTranslation();

  return (
    <section className="container-page py-16 text-center md:py-24">
      <h1 className="font-medium">{t("products.notFoundTitle")}</h1>
      <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
        {t("products.notFoundBody")}
      </p>
      <Link
        to="/products"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      >
        {t("products.notFoundAction")}
      </Link>
    </section>
  );
}

function ProductInfo({ product }: { product: ProductDetail }) {
  const { t } = useTranslation();
  const outOfStock = product.stock === 0;

  return (
    <div>
      <h1 className="font-medium">{product.name}</h1>
      <p className="mt-3 text-2xl font-semibold text-foreground">{formatVnd(product.price)}</p>
      <p
        role="status"
        className={cn("mt-2 text-sm", outOfStock ? "text-warning" : "text-success")}
      >
        {outOfStock
          ? t("products.outOfStock")
          : t("products.inStock", { stock: formatNumber(product.stock) })}
      </p>
      {product.category ? (
        <Link
          to={`/products?categoryId=${product.category.id}`}
          className="mt-4 inline-flex min-h-11 items-center text-sm text-foreground underline underline-offset-4"
        >
          {t("products.categoryLinkLabel", { name: product.category.name })}
        </Link>
      ) : null}
      {product.seller.shopName ? (
        <p className="text-sm text-muted-foreground">
          {t("products.sellerLabel")}: {product.seller.shopName}
        </p>
      ) : null}
      <div className="mt-6 border-t border-border pt-6">
        <h2 className="font-heading text-base font-medium">{t("products.descriptionLabel")}</h2>
        <p className="mt-2 whitespace-pre-line text-base text-muted-foreground">
          {product.description || t("products.noDescription")}
        </p>
      </div>
    </div>
  );
}

function ProductDetailView({ product }: { product: ProductDetail }) {
  const { t } = useTranslation();

  return (
    <section className="container-page py-8 md:py-12">
      <Link
        to="/products"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="mr-1.5 h-4 w-4" />
        {t("products.backToProducts")}
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <ProductInfo product={product} />
      </div>
    </section>
  );
}

/** Public product detail screen for `/products/:id`. */
export function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const productQuery = useProduct(id ?? "");

  if (!id) {
    return <ProductNotFound />;
  }
  if (productQuery.isLoading) {
    return <ProductDetailSkeleton />;
  }
  if (productQuery.isError) {
    if (getApiErrorStatus(productQuery.error) === 404) {
      return <ProductNotFound />;
    }
    const message =
      productQuery.error instanceof ApiRequestError
        ? productQuery.error.message
        : t("products.loadError");
    return <ProductDetailError message={message} onRetry={() => void productQuery.refetch()} />;
  }
  if (!productQuery.data) {
    return <ProductNotFound />;
  }
  return <ProductDetailView product={productQuery.data} />;
}
