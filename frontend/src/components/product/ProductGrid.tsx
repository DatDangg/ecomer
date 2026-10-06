import type { Product } from "@/api/products";
import { ProductCard } from "@/components/product/ProductCard";

/** Responsive discovery grid: 2 columns at 375, 3 at 768, 4 at 1280. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
