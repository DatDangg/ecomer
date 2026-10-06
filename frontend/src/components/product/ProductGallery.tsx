import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { ProductImage } from "@/components/product/ProductImage";
import { cn } from "@/lib/utils";

/** Arrow/Home/End navigation shared by the thumbnail list; keeps focus in sync. */
function useGalleryKeyboard(count: number, selected: number, onSelect: (index: number) => void) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (count <= 1) {
      return;
    }

    let next = selected;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (selected + 1) % count;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (selected - 1 + count) % count;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = count - 1;
    } else {
      return;
    }

    event.preventDefault();
    onSelect(next);
    refs.current[next]?.focus();
  }

  return { refs, handleKeyDown };
}

interface ProductGalleryProps {
  images: string[];
  name: string;
}

/** Keyboard-operable gallery; the selected thumbnail is announced via `aria-pressed`. */
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);
  const safeImages = images.length > 0 ? images : [""];
  const activeIndex = Math.min(selected, safeImages.length - 1);
  const { refs, handleKeyDown } = useGalleryKeyboard(safeImages.length, activeIndex, setSelected);

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-lg bg-surface">
        <ProductImage
          src={safeImages[activeIndex] || null}
          alt={t("products.imageAlt", { name, index: activeIndex + 1 })}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
      </div>
      {safeImages.length > 1 ? (
        <div
          role="group"
          aria-label={t("products.galleryLabel")}
          onKeyDown={handleKeyDown}
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {safeImages.map((image, index) => (
            <button
              key={index}
              type="button"
              ref={(element) => {
                refs.current[index] = element;
              }}
              aria-label={t("products.gallerySelect", { index: index + 1 })}
              aria-pressed={index === activeIndex}
              onClick={() => setSelected(index)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-md border transition-colors motion-reduce:transition-none",
                index === activeIndex ? "border-foreground ring-2 ring-ring" : "border-border",
              )}
            >
              <ProductImage src={image} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
