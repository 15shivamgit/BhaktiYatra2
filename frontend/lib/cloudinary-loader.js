/**
 * next/image loader. Cloudinary URLs get on-the-fly format, quality and width transformations
 * (NFR-PERF-03); any other host (for example Google profile photos) is returned unchanged.
 * @param {{ src: string, width: number, quality?: number }} params
 */
export default function cloudinaryLoader({ src, width, quality }) {
  const marker = '/image/upload/';
  if (!src.startsWith('https://res.cloudinary.com/') || !src.includes(marker)) return src;
  // Large photos use Cloudinary's "eco" quality: about a fifth fewer bytes, no visible loss
  // at that size on phones, where the bandwidth matters most.
  const q = quality ?? (width >= 640 ? 'auto:eco' : 'auto');
  const transform = `f_auto,q_${q},c_limit,w_${width}`;
  return src.replace(marker, `${marker}${transform}/`);
}

/** Fixed-size crop for social previews (Open Graph 1200×630). */
export function ogImageUrl(src) {
  const marker = '/image/upload/';
  if (!src?.includes(marker)) return src;
  return src.replace(marker, `${marker}f_jpg,q_auto,c_fill,g_auto,w_1200,h_630/`);
}
