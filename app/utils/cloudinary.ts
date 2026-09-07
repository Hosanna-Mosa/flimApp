import { PixelRatio } from 'react-native';

/**
 * Cloudinary delivery URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/<transforms?>/v123/<id>.jpg
 * Transformations go in as a path segment directly after `/upload/`.
 */
const UPLOAD_SEGMENT = '/image/upload/';

/** Keys that begin a real transformation segment, to tell one from a public id. */
const TRANSFORM_KEY = /^(w|h|c|f|q|dpr|e|g|ar|b|co|fl|l|o|r|t|x|y|z)_/;

/** Past this there is no visible gain, only bytes — tablets at 3x hit it fast. */
const MAX_REQUEST_WIDTH = 1600;

export interface ImageVariantOptions {
  /** Rendered width in layout points; converted to device pixels here. */
  width: number;
  /** Rendered height in points. Only used when cropping to a fixed box. */
  height?: number;
  /** `limit` never upscales (default); `fill` crops to the exact box. */
  crop?: 'limit' | 'fill';
}

/**
 * Ask Cloudinary for a copy of an image sized to where it is actually shown.
 *
 * Uploads store Cloudinary's `secure_url`, which is the untouched original —
 * routinely a 4000px camera photo delivered into a 400px-wide feed card. A
 * screen-sized variant turns megabytes into tens of kilobytes; `f_auto` picks a
 * modern format per device and `q_auto` a quality that still looks right.
 *
 * Anything that is not a Cloudinary image URL — the Gravatar default avatar, a
 * video poster served from `/video/upload/`, a self-hosted asset — is returned
 * untouched, so this is always safe to call.
 */
export function cloudinaryImage(
  url: string | null | undefined,
  { width, height, crop = 'limit' }: ImageVariantOptions
): string | undefined {
  if (!url) return undefined;

  const at = url.indexOf(UPLOAD_SEGMENT);
  if (at === -1 || !url.includes('res.cloudinary.com')) return url;

  const prefix = url.slice(0, at + UPLOAD_SEGMENT.length);
  const rest = url.slice(at + UPLOAD_SEGMENT.length);

  // Already carries a transformation: leave it be rather than stacking another.
  const firstParam = rest.split('/')[0].split(',')[0];
  if (TRANSFORM_KEY.test(firstParam)) return url;

  const toPixels = (points: number) =>
    Math.min(Math.round(PixelRatio.getPixelSizeForLayoutSize(points)), MAX_REQUEST_WIDTH);

  const params = [`w_${toPixels(width)}`];
  if (crop === 'fill' && height) params.push(`h_${toPixels(height)}`);
  params.push(`c_${crop}`, 'f_auto', 'q_auto');

  return `${prefix}${params.join(',')}/${rest}`;
}
