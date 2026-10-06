import { ImageOff } from "lucide-react";
import { useState } from "react";

import { buildImageSrcSet } from "@/components/product/product-image-srcset";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  /** Pass the product name for a meaningful image; empty string for decorative. */
  alt: string;
  className?: string;
  /** Above-the-fold image (detail gallery) loads eagerly; list images lazy-load. */
  priority?: boolean;
  /** Overrides the default responsive `sizes` hint for non-grid usages. */
  sizes?: string;
}

/** Default hint: full width on mobile, 1/3 at tablet, 1/4 in the desktop rail. */
const DEFAULT_SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

/**
 * Product media with a neutral fallback. There is no generated placeholder art:
 * a missing or broken URL renders a quiet icon so layouts never shift or fake
 * inventory. The fallback keeps `role="img"` only when an alt text is provided.
 */
export function ProductImage({ src, alt, className, priority = false, sizes }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn(
          "flex h-full w-full items-center justify-center bg-surface",
          className,
        )}
      >
        <ImageOff aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      srcSet={buildImageSrcSet(src)}
      sizes={sizes ?? DEFAULT_SIZES}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
