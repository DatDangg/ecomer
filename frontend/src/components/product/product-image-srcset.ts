const RESPONSIVE_WIDTHS = [320, 640, 960];

/**
 * Builds a responsive `srcSet` for the image providers this app uses
 * (Cloudinary transforms, picsum seed URLs). Returns `undefined` for unknown
 * hosts so the browser falls back to `src` without an invalid candidate set.
 */
export function buildImageSrcSet(src: string): string | undefined {
  const cloudinary = src.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/,
  );
  if (cloudinary) {
    const base = cloudinary[1]!;
    const rest = cloudinary[2]!;
    return RESPONSIVE_WIDTHS.map((w) => `${base}w_${w},f_auto,q_auto/${rest} ${w}w`).join(", ");
  }

  const picsum = src.match(/^(https?:\/\/picsum\.photos\/(?:seed\/[^/]+\/)?)\d+\/\d+$/);
  if (picsum) {
    const base = picsum[1]!;
    return RESPONSIVE_WIDTHS.map((w) => `${base}${w}/${w} ${w}w`).join(", ");
  }

  return undefined;
}
